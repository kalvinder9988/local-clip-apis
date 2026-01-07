import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { User } from '../users/entities/user.entity';
import { Coupon } from '../coupons/entities/coupon.entity';
import { MerchantBusiness } from '../merchant-businesses/entities/merchant-business.entity';
import { Plan } from '../plans/entities/plan.entity';
import { Category } from '../categories/entities/category.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            User,
            Coupon,
            MerchantBusiness,
            Plan,
            Category,
        ]),
    ],
    controllers: [DashboardController],
    providers: [DashboardService],
    exports: [DashboardService],
})
export class DashboardModule { }
