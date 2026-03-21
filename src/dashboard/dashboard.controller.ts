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
     * GET /dashboard/merchant-stats
     * Get dashboard statistics for the logged-in merchant
     */
    @Get('merchant-stats')
    getMerchantDashboardStats(@Req() req: Request) {
        const user = req['user'] as { userId: number; email: string; role: string };
        return this.dashboardService.getMerchantDashboardStats(user.userId);
    }
}
