import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ZipcodesService } from './zipcodes.service';
import { ZipcodesController } from './zipcodes.controller';
import { Zipcode } from './entities/zipcode.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Zipcode])],
  controllers: [ZipcodesController],
  providers: [ZipcodesService],
  exports: [ZipcodesService],
})
export class ZipcodesModule { }
