import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HomeController } from './home/home.controller';
import { HomeService } from './home/home.service';
import { Banner } from '../contents/entities/banner.entity';
import { Category } from '../categories/entities/category.entity';
import { MerchantBusiness } from '../merchant-businesses/entities/merchant-business.entity';
import { DealsController } from './deals/deals.controller';
import { DealsService } from './deals/deals.service';
import { User } from '../users/entities/user.entity';
import { WebAccountService } from './users/web-account.service';
import { WebUsersController } from './users/web-users.controller';
import { UsersModule } from '../users/users.module';
import { UserLike } from '../merchant-businesses/entities/user-like.entity';
import { UserCouponHistory } from '../merchant-businesses/entities/user-coupon-history.entity';
import { SharedCoupon } from '../merchant-businesses/entities/shared-coupon.entity';
import { Coupon } from '../coupons/entities/coupon.entity';
import { Review } from '../merchant-businesses/entities/review.entity';
import { StaticPage } from '../contents/entities/static-page.entity';
import { ContactInquiry } from './home/entities/contact-inquiry.entity';
import { UserCouponReaction } from '../merchant-businesses/entities/user-coupon-reaction.entity';
import { MerchantQuestion } from '../merchant-businesses/entities/merchant-question.entity';
import { MailModule } from '../mail/mail.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Banner, Category, MerchantBusiness, UserLike, UserCouponHistory, SharedCoupon, UserCouponReaction, Coupon, Review, StaticPage, ContactInquiry, MerchantQuestion, User]),
        UsersModule,
        MailModule,
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                secret: configService.get<string>('JWT_SECRET') || 'localclip-secret-key-2025',
                signOptions: { expiresIn: '7d' },
            }),
        }),
    ],
    controllers: [HomeController, DealsController, WebUsersController],
    providers: [HomeService, DealsService, WebAccountService],
})
export class WebApisModule { }
