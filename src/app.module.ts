import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ContentsModule } from './contents/contents.module';
import { PlansModule } from './plans/plans.module';
import { CouponsModule } from './coupons/coupons.module';
import { ZipcodesModule } from './zipcodes/zipcodes.module';
import { ZipcodeGroupsModule } from './zipcode-groups/zipcode-groups.module';
import { CategoriesModule } from './categories/categories.module';
import { MerchantBusinessesModule } from './merchant-businesses/merchant-businesses.module';
import { UsersModule } from './users/users.module';
import { AdminUsersModule } from './admin-users/admin-users.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { ConveniencesModule } from './conveniences/conveniences.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { WebApisModule } from './web-apis/web-apis.module';
import { ContactInquiriesModule } from './contact-inquiries/contact-inquiries.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      autoLoadEntities: true,
      synchronize: true
    }),

    ContentsModule,

    PlansModule,

    CouponsModule,

    ZipcodesModule,

    ZipcodeGroupsModule,

    CategoriesModule,

    MerchantBusinessesModule,

    UsersModule,

    AdminUsersModule,

    ConveniencesModule,

    DashboardModule,

    WebApisModule,

    ContactInquiriesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule { }
