import { Controller, Get, Query, Req } from '@nestjs/common';
import { Request } from 'express';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
    constructor(private readonly dashboardService: DashboardService) { }

    /**
     * GET /dashboard/stats
     * Get overall dashboard statistics
     */
    @Get('stats')
    getDashboardStats() {
        return this.dashboardService.getDashboardStats();
    }

    /**
     * GET /dashboard/users
     * Get user statistics
     */
    @Get('users')
    getUserStats() {
        return this.dashboardService.getUserStats();
    }

    /**
     * GET /dashboard/merchants
     * Get merchant statistics
     */
    @Get('merchants')
    getMerchantStats() {
        return this.dashboardService.getMerchantStats();
    }

    /**
     * GET /dashboard/coupons
     * Get coupon statistics
     */
    @Get('coupons')
    getCouponStats() {
        return this.dashboardService.getCouponStats();
    }

    /**
     * GET /dashboard/activity
     * Get recent activity
     * @param limit - Number of activities to return (default: 10)
     */
    @Get('activity')
    getRecentActivity(@Query('limit') limit?: string) {
        const limitNumber = limit ? parseInt(limit, 10) : 10;
        return this.dashboardService.getRecentActivity(limitNumber);
    }

    /**
     * GET /dashboard/growth
     * Get growth statistics for the last 7 days
     */
    @Get('growth')
    getGrowthStats() {
        return this.dashboardService.getGrowthStats();
    }

    /**
     * GET /dashboard/merchant-monthly-growth
     * Get merchant additions per month for the last 6 months
     */
    @Get('merchant-monthly-growth')
    getMerchantMonthlyGrowth() {
        return this.dashboardService.getMerchantMonthlyGrowth();
    }

    /**
     * GET /dashboard/merchant-coupon-counts
     * Get coupon count grouped by merchant
     */
    @Get('merchant-coupon-counts')
    getMerchantCouponCounts() {
        return this.dashboardService.getMerchantCouponCounts();
    }

    /**
     * GET /dashboard/merchant-stats
     * Get dashboard statistics for the logged-in merchant
     */
    @Get('merchant-stats')
    getMerchantDashboardStats(@Req() req: Request) {
        const user = req['user'] as { userId: number; email: string; role: string };
        return this.dashboardService.getMerchantDashboardStats(user.userId);
    }

    /**
     * GET /dashboard/merchant-business-likes
     * Get users who liked the logged-in merchant's business
     */
    @Get('merchant-business-likes')
    getMerchantBusinessLikes(
        @Req() req: Request,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        const user = req['user'] as { userId: number; email: string; role: string };
        return this.dashboardService.getMerchantBusinessLikes(
            user.userId,
            page ? +page : 1,
            limit ? +limit : 10,
        );
    }

    /**
     * GET /dashboard/merchant-coupon-redeemed
     * Get redeemed counts grouped by coupon for the logged-in merchant
     */
    @Get('merchant-coupon-redeemed')
    getMerchantCouponRedeemedStats(@Req() req: Request) {
        const user = req['user'] as { userId: number; email: string; role: string };
        return this.dashboardService.getMerchantCouponRedeemedStats(user.userId);
    }

    /**
     * GET /dashboard/merchant-overview
     * Full merchant dashboard overview (clippers as visitors)
     */
    @Get('merchant-overview')
    getMerchantOverview(@Req() req: Request) {
        const user = req['user'] as { userId: number; email: string; role: string };
        return this.dashboardService.getMerchantOverview(user.userId);
    }
}
