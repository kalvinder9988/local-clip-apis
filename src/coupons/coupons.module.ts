import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CouponsService } from './coupons.service';
import { CouponsController } from './coupons.controller';
import { Coupon } from './entities/coupon.entity';
import { UserCouponReaction } from '../merchant-businesses/entities/user-coupon-reaction.entity';
import { SharedCoupon } from '../merchant-businesses/entities/shared-coupon.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Coupon, UserCouponReaction, SharedCoupon])],
  controllers: [CouponsController],
  providers: [CouponsService],
  exports: [CouponsService],
})
export class CouponsModule { }
