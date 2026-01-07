import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Coupon } from '../coupons/entities/coupon.entity';
import { MerchantBusiness } from '../merchant-businesses/entities/merchant-business.entity';
import { Plan } from '../plans/entities/plan.entity';
import { Category } from '../categories/entities/category.entity';
import {
    DashboardStatsDto,
    UserStatsDto,
    MerchantStatsDto,
    CouponStatsDto,
    RecentActivityDto,
    GrowthStatsDto,
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
    ) { }

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
            this.couponRepository.count({ where: { status: true } }),
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
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
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
            this.couponRepository.count({ where: { status: true } }),
            this.couponRepository
                .createQueryBuilder('coupon')
                .where('coupon.valid_to < :now', { now: today })
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
