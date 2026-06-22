import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, Between } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Coupon } from '../coupons/entities/coupon.entity';
import { MerchantBusiness } from '../merchant-businesses/entities/merchant-business.entity';
import { Plan } from '../plans/entities/plan.entity';
import { Category } from '../categories/entities/category.entity';
import { UserLike } from '../merchant-businesses/entities/user-like.entity';
import { SharedCoupon } from '../merchant-businesses/entities/shared-coupon.entity';
import {
    DashboardStatsDto,
    UserStatsDto,
    MerchantStatsDto,
    CouponStatsDto,
    RecentActivityDto,
    GrowthStatsDto,
    MerchantMonthlyGrowthDto,
    MerchantCouponCountDto,
    MerchantCouponRedeemedDto,
    MerchantDashboardStatsDto,
    MerchantBusinessLikeDto,
    PaginatedResponseDto,
} from './dto/dashboard-stats.dto';

@Injectable()
export class DashboardService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(Coupon)
        private readonly couponRepository: Repository<Coupon>,
        @InjectRepository(MerchantBusiness)
        private readonly merchantRepository: Repository<MerchantBusiness>,
        @InjectRepository(Plan)
        private readonly planRepository: Repository<Plan>,
        @InjectRepository(Category)
        private readonly categoryRepository: Repository<Category>,
        @InjectRepository(UserLike)
        private readonly userLikeRepository: Repository<UserLike>,
        @InjectRepository(SharedCoupon)
        private readonly sharedCouponRepository: Repository<SharedCoupon>,
    ) { }

    private getTodayStart(): Date {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return today;
    }

    private async countActiveCoupons(merchantBusinessId?: number): Promise<number> {
        const today = this.getTodayStart();
        const qb = this.couponRepository
            .createQueryBuilder('coupon')
            .where('coupon.status = :status', { status: true })
            .andWhere('coupon.valid_to >= :today', { today });

        if (merchantBusinessId) {
            qb.andWhere('coupon.merchant_business_id = :merchantBusinessId', { merchantBusinessId });
        }

        return qb.getCount();
    }

    /**
     * Get overall dashboard statistics
     */
    async getDashboardStats(): Promise<DashboardStatsDto> {
        const [
            totalUsers,
            totalMerchants,
            totalCoupons,
            activeCoupons,
            totalCategories,
            totalPlans,
        ] = await Promise.all([
            this.userRepository.count(),
            this.merchantRepository.count(),
            this.couponRepository.count(),
            this.countActiveCoupons(),
            this.categoryRepository.count(),
            this.planRepository.count(),
        ]);

        return {
            totalUsers,
            totalMerchants,
            totalCoupons,
            activeCoupons,
            totalCategories,
            totalPlans,
        };
    }

    /**
     * Get user statistics
     */
    async getUserStats(): Promise<UserStatsDto> {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);

        const [
            totalUsers,
            newUsersToday,
            newUsersThisWeek,
            newUsersThisMonth,
            usersByPlan,
        ] = await Promise.all([
            this.userRepository.count(),
            this.userRepository.count({ where: { created_at: MoreThan(today) } }),
            this.userRepository.count({ where: { created_at: MoreThan(weekAgo) } }),
            this.userRepository.count({ where: { created_at: MoreThan(monthAgo) } }),
            this.getUsersByPlan(),
        ]);

        return {
            totalUsers,
            activeUsers: totalUsers, // Users don't have status field, so all are considered active
            newUsersToday,
            newUsersThisWeek,
            newUsersThisMonth,
            usersByPlan,
        };
    }

    /**
     * Get merchant statistics
     */
    async getMerchantStats(): Promise<MerchantStatsDto> {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);

        const [
            totalMerchants,
            activeMerchants,
            newMerchantsToday,
            newMerchantsThisWeek,
            newMerchantsThisMonth,
            merchantsByCategory,
        ] = await Promise.all([
            this.merchantRepository.count(),
            this.merchantRepository.count({ where: { status: true } }),
            this.merchantRepository.count({ where: { created_at: MoreThan(today) } }),
            this.merchantRepository.count({ where: { created_at: MoreThan(weekAgo) } }),
            this.merchantRepository.count({ where: { created_at: MoreThan(monthAgo) } }),
            this.getMerchantsByCategory(),
        ]);

        return {
            totalMerchants,
            activeMerchants,
            newMerchantsToday,
            newMerchantsThisWeek,
            newMerchantsThisMonth,
            merchantsByCategory,
        };
    }

    /**
     * Get coupon statistics
     */
    async getCouponStats(): Promise<CouponStatsDto> {
        const today = this.getTodayStart();
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);

        const [
            totalCoupons,
            activeCoupons,
            expiredCoupons,
            newCouponsToday,
            newCouponsThisWeek,
            newCouponsThisMonth,
            couponsByType,
            topCouponsByLikes,
            topCouponsByShares,
        ] = await Promise.all([
            this.couponRepository.count(),
            this.countActiveCoupons(),
            this.couponRepository
                .createQueryBuilder('coupon')
                .where('coupon.valid_to < :today', { today })
                .getCount(),
            this.couponRepository.count({ where: { created_at: MoreThan(today) } }),
            this.couponRepository.count({ where: { created_at: MoreThan(weekAgo) } }),
            this.couponRepository.count({ where: { created_at: MoreThan(monthAgo) } }),
            this.getCouponsByType(),
            this.getTopCouponsByLikes(),
            this.getTopCouponsByShares(),
        ]);

        return {
            totalCoupons,
            activeCoupons,
            expiredCoupons,
            newCouponsToday,
            newCouponsThisWeek,
            newCouponsThisMonth,
            couponsByType,
            topCouponsByLikes,
            topCouponsByShares,
        };
    }

    /**
     * Get recent activity
     */
    async getRecentActivity(limit: number = 10): Promise<RecentActivityDto[]> {
        const activities: RecentActivityDto[] = [];

        // Get recent users
        const recentUsers = await this.userRepository.find({
            order: { created_at: 'DESC' },
            take: limit,
        });

        recentUsers.forEach((user) => {
            activities.push({
                type: 'user',
                title: 'New User Registered',
                description: `${user.name} joined`,
                timestamp: user.created_at,
                id: user.id,
            });
        });

        // Get recent merchants
        const recentMerchants = await this.merchantRepository.find({
            order: { created_at: 'DESC' },
            take: limit,
        });

        recentMerchants.forEach((merchant) => {
            activities.push({
                type: 'merchant',
                title: 'New Merchant Added',
                description: `${merchant.business_name} was added`,
                timestamp: merchant.created_at,
                id: merchant.id,
            });
        });

        // Get recent coupons
        const recentCoupons = await this.couponRepository.find({
            order: { created_at: 'DESC' },
            take: limit,
        });

        recentCoupons.forEach((coupon) => {
            activities.push({
                type: 'coupon',
                title: 'New Coupon Created',
                description: `${coupon.coupon_name} (${coupon.coupon_code})`,
                timestamp: coupon.created_at,
                id: coupon.id,
            });
        });

        // Sort all activities by timestamp and return limited results
        return activities
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, limit);
    }

    /**
     * Get growth statistics for the last 7 days
     */
    async getGrowthStats(): Promise<GrowthStatsDto[]> {
        const stats: GrowthStatsDto[] = [];
        const now = new Date();

        for (let i = 6; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);

            const nextDate = new Date(date);
            nextDate.setDate(nextDate.getDate() + 1);

            const [users, merchants, coupons] = await Promise.all([
                this.userRepository.count({
                    where: {
                        created_at: MoreThan(date),
                    },
                }),
                this.merchantRepository.count({
                    where: {
                        created_at: MoreThan(date),
                    },
                }),
                this.couponRepository.count({
                    where: {
                        created_at: MoreThan(date),
                    },
                }),
            ]);

            stats.push({
                period: date.toISOString().split('T')[0],
                users,
                merchants,
                coupons,
            });
        }

        return stats;
    }

    /**
     * Get merchant additions per month for the last 6 months
     */
    async getMerchantMonthlyGrowth(): Promise<MerchantMonthlyGrowthDto[]> {
        const stats: MerchantMonthlyGrowthDto[] = [];
        const now = new Date();

        for (let i = 5; i >= 0; i--) {
            const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthEnd = new Date(
                monthStart.getFullYear(),
                monthStart.getMonth() + 1,
                0,
                23,
                59,
                59,
                999,
            );

            const count = await this.merchantRepository.count({
                where: {
                    created_at: Between(monthStart, monthEnd),
                    deleted: false,
                },
            });

            stats.push({
                month: `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, '0')}`,
                label: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
                count,
            });
        }

        return stats;
    }

    /**
     * Get coupon count grouped by merchant (top 10 by coupon count)
     */
    async getMerchantCouponCounts(): Promise<MerchantCouponCountDto[]> {
        const result = await this.merchantRepository
            .createQueryBuilder('merchant')
            .leftJoin('merchant.coupons', 'coupon')
            .select('merchant.id', 'merchantId')
            .addSelect('merchant.business_name', 'merchantName')
            .addSelect('COUNT(coupon.id)', 'couponCount')
            .where('merchant.deleted = :deleted', { deleted: false })
            .groupBy('merchant.id')
            .addGroupBy('merchant.business_name')
            .orderBy('couponCount', 'DESC')
            .addOrderBy('merchant.business_name', 'ASC')
            .limit(10)
            .getRawMany();

        return result.map((row) => ({
            merchantId: parseInt(row.merchantId, 10),
            merchantName: row.merchantName,
            couponCount: parseInt(row.couponCount, 10),
        }));
    }

    /**
     * Get dashboard statistics for a specific merchant (by their AdminUser ID)
     */
    async getMerchantDashboardStats(merchantUserId: number): Promise<MerchantDashboardStatsDto> {
        const business = await this.merchantRepository.findOne({
            where: { merchant: { id: merchantUserId }, deleted: false } as any,
            order: { created_at: 'DESC' },
        });

        if (!business) {
            return {
                businessName: '',
                businessStatus: false,
                totalCoupons: 0,
                activeCoupons: 0,
                totalLikes: 0,
                totalDislikes: 0,
                expiredCoupons: 0,
            };
        }

        const today = this.getTodayStart();

        const couponAgg = await this.couponRepository
            .createQueryBuilder('coupon')
            .select('COUNT(coupon.id)', 'totalCoupons')
            .addSelect(
                'SUM(CASE WHEN coupon.status = 1 AND coupon.valid_to >= :today THEN 1 ELSE 0 END)',
                'activeCoupons',
            )
            .addSelect(
                'SUM(CASE WHEN coupon.valid_to < :today THEN 1 ELSE 0 END)',
                'expiredCoupons',
            )
            .addSelect('SUM(coupon.total_likes)', 'totalLikes')
            .addSelect('SUM(coupon.total_dislikes)', 'totalDislikes')
            .where('coupon.merchant_business_id = :businessId', { businessId: business.id })
            .setParameter('today', today)
            .getRawOne();

        return {
            businessName: business.business_name,
            businessStatus: business.status,
            totalCoupons: parseInt(couponAgg?.totalCoupons ?? '0', 10),
            activeCoupons: parseInt(couponAgg?.activeCoupons ?? '0', 10),
            totalLikes: Number(business.total_likes ?? 0),
            totalDislikes: parseInt(couponAgg?.totalDislikes ?? '0', 10),
            expiredCoupons: parseInt(couponAgg?.expiredCoupons ?? '0', 10),
        };
    }

    /**
     * Get redeemed coupon counts for the logged-in merchant (top 10 coupons)
     */
    async getMerchantCouponRedeemedStats(merchantUserId: number): Promise<MerchantCouponRedeemedDto[]> {
        const business = await this.merchantRepository.findOne({
            where: { merchant: { id: merchantUserId }, deleted: false } as any,
            order: { created_at: 'DESC' },
        });

        if (!business) {
            return [];
        }

        const result = await this.couponRepository
            .createQueryBuilder('coupon')
            .leftJoin(
                SharedCoupon,
                'share',
                'share.coupon_id = coupon.id AND share.used_status = :used',
                { used: true },
            )
            .select('coupon.id', 'couponId')
            .addSelect('coupon.coupon_name', 'couponName')
            .addSelect('coupon.coupon_code', 'couponCode')
            .addSelect('COUNT(share.id)', 'redeemedCount')
            .where('coupon.merchant_business_id = :businessId', { businessId: business.id })
            .groupBy('coupon.id')
            .addGroupBy('coupon.coupon_name')
            .addGroupBy('coupon.coupon_code')
            .orderBy('redeemedCount', 'DESC')
            .addOrderBy('coupon.coupon_name', 'ASC')
            .limit(10)
            .getRawMany();

        return result.map((row) => ({
            couponId: parseInt(row.couponId, 10),
            couponName: row.couponName,
            couponCode: row.couponCode,
            redeemedCount: parseInt(row.redeemedCount, 10),
        }));
    }

    /**
     * Get users who liked the merchant's business listing.
     */
    async getMerchantBusinessLikes(
        merchantUserId: number,
        page: number = 1,
        limit: number = 10,
    ): Promise<PaginatedResponseDto<MerchantBusinessLikeDto>> {
        const normalizedPage = Math.max(1, Number(page) || 1);
        const normalizedLimit = Math.min(100, Math.max(1, Number(limit) || 10));
        const skip = (normalizedPage - 1) * normalizedLimit;

        const business = await this.merchantRepository.findOne({
            where: { merchant: { id: merchantUserId }, deleted: false } as any,
            order: { created_at: 'DESC' },
        });

        if (!business) {
            return { data: [], total: 0, page: normalizedPage, limit: normalizedLimit };
        }

        const [likes, total] = await this.userLikeRepository.findAndCount({
            where: { merchant_business_id: business.id },
            relations: ['user'],
            order: { created_at: 'DESC' },
            skip,
            take: normalizedLimit,
        });

        return {
            data: likes.map((like) => ({
                id: like.id,
                user_id: like.user_id,
                user_name: like.user?.name ?? 'Unknown',
                user_email: like.user?.email ?? '',
                user_phone: like.user?.phone ?? '',
                liked_at: like.created_at,
            })),
            total,
            page: normalizedPage,
            limit: normalizedLimit,
        };
    }

    /**
     * Helper: Get users grouped by plan
     */
    private async getUsersByPlan(): Promise<{ planName: string; count: number }[]> {
        const result = await this.userRepository
            .createQueryBuilder('user')
            .leftJoin('user.plan', 'plan')
            .select('plan.plan_name', 'planName')
            .addSelect('COUNT(user.id)', 'count')
            .groupBy('plan.id')
            .getRawMany();

        return result.map((r) => ({
            planName: r.planName || 'No Plan',
            count: parseInt(r.count, 10),
        }));
    }

    /**
     * Helper: Get merchants grouped by category
     */
    private async getMerchantsByCategory(): Promise<{ categoryName: string; count: number }[]> {
        const result = await this.merchantRepository
            .createQueryBuilder('merchant')
            .leftJoin('merchant.category', 'category')
            .select('category.category_name', 'categoryName')
            .addSelect('COUNT(merchant.id)', 'count')
            .groupBy('category.id')
            .getRawMany();

        return result.map((r) => ({
            categoryName: r.categoryName || 'No Category',
            count: parseInt(r.count, 10),
        }));
    }

    /**
     * Helper: Get coupons grouped by type
     */
    private async getCouponsByType(): Promise<{ type: string; count: number }[]> {
        const result = await this.couponRepository
            .createQueryBuilder('coupon')
            .select('coupon.type', 'type')
            .addSelect('COUNT(coupon.id)', 'count')
            .groupBy('coupon.type')
            .getRawMany();

        return result.map((r) => ({
            type: r.type,
            count: parseInt(r.count, 10),
        }));
    }

    /**
     * Helper: Get top coupons by likes
     */
    private async getTopCouponsByLikes(): Promise<
        {
            id: number;
            couponName: string;
            couponCode: string;
            totalLikes: number;
            totalShared: number;
        }[]
    > {
        const coupons = await this.couponRepository.find({
            order: { total_likes: 'DESC' },
            take: 10,
        });

        return coupons.map((c) => ({
            id: c.id,
            couponName: c.coupon_name,
            couponCode: c.coupon_code,
            totalLikes: c.total_likes,
            totalShared: c.total_shared,
        }));
    }

    /**
     * Helper: Get top coupons by shares
     */
    private async getTopCouponsByShares(): Promise<
        {
            id: number;
            couponName: string;
            couponCode: string;
            totalShared: number;
            totalLikes: number;
        }[]
    > {
        const coupons = await this.couponRepository.find({
            order: { total_shared: 'DESC' },
            take: 10,
        });

        return coupons.map((c) => ({
            id: c.id,
            couponName: c.coupon_name,
            couponCode: c.coupon_code,
            totalShared: c.total_shared,
            totalLikes: c.total_likes,
        }));
    }
}
