import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MerchantBusinessesService } from './merchant-businesses.service';
import { MerchantBusinessesController } from './merchant-businesses.controller';
import { MerchantBusiness } from './entities/merchant-business.entity';
import { MerchantConvenience } from './entities/merchant-convenience.entity';
import { Convenience } from './entities/convenience.entity';
import { Asset } from './entities/asset.entity';
import { Review } from './entities/review.entity';
import { AdminUser } from '../admin-users/entities/admin-user.entity';
import { Category } from '../categories/entities/category.entity';
import { Zipcode } from '../zipcodes/entities/zipcode.entity';
import { ZipcodeGroup } from '../zipcode-groups/entities/zipcode-group.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MerchantBusiness,
      MerchantConvenience,
      Convenience,
      Asset,
      Review,
      AdminUser,
      Category,
      Zipcode,
      ZipcodeGroup,
    ]),
  ],
  controllers: [MerchantBusinessesController],
  providers: [MerchantBusinessesService],
  exports: [MerchantBusinessesService],
})
export class MerchantBusinessesModule { }
