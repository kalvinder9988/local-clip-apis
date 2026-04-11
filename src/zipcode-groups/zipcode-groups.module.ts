import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ZipcodeGroupsService } from './zipcode-groups.service';
import { ZipcodeGroupsController } from './zipcode-groups.controller';
import { ZipcodeGroup } from './entities/zipcode-group.entity';
import { Zipcode } from '../zipcodes/entities/zipcode.entity';

@Module({
    imports: [TypeOrmModule.forFeature([ZipcodeGroup, Zipcode])],
    controllers: [ZipcodeGroupsController],
    providers: [ZipcodeGroupsService],
    exports: [ZipcodeGroupsService],
})
export class ZipcodeGroupsModule { }
