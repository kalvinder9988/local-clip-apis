export class DashboardStatsDto {
    totalUsers: number;
    totalMerchants: number;
    totalCoupons: number;
    activeCoupons: number;
    totalCategories: number;
    totalPlans: number;
}

export class UserStatsDto {
    totalUsers: number;
    activeUsers: number;
    newUsersToday: number;
    newUsersThisWeek: number;
    newUsersThisMonth: number;
    usersByPlan: {
        planName: string;
        count: number;
    }[];
}

export class MerchantStatsDto {
    totalMerchants: number;
    activeMerchants: number;
    newMerchantsToday: number;
    newMerchantsThisWeek: number;
    newMerchantsThisMonth: number;
    merchantsByCategory: {
        categoryName: string;
        count: number;
    }[];
}

export class CouponStatsDto {
    totalCoupons: number;
    activeCoupons: number;
    expiredCoupons: number;
    newCouponsToday: number;
    newCouponsThisWeek: number;
    newCouponsThisMonth: number;
    couponsByType: {
        type: string;
        count: number;
    }[];
    topCouponsByLikes: {
        id: number;
        couponName: string;
        couponCode: string;
        totalLikes: number;
        totalShared: number;
    }[];
    topCouponsByShares: {
        id: number;
        couponName: string;
        couponCode: string;
        totalShared: number;
        totalLikes: number;
    }[];
}

export class RecentActivityDto {
    type: 'user' | 'merchant' | 'coupon';
    title: string;
    description: string;
    timestamp: Date;
    id: number;
}

export class GrowthStatsDto {
    period: string;
    users: number;
    merchants: number;
    coupons: number;
}

export class MerchantDashboardStatsDto {
    businessName: string;
    businessStatus: boolean;
    totalCoupons: number;
    activeCoupons: number;
    totalLikes: number;
    totalDislikes: number;
    totalShares: number;
}
