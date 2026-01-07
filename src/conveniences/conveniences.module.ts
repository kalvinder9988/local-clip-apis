import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConveniencesService } from './conveniences.service';
import { ConveniencesController } from './conveniences.controller';
import { Convenience } from '../merchant-businesses/entities/convenience.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Convenience])],
  controllers: [ConveniencesController],
  providers: [ConveniencesService],
  exports: [ConveniencesService],
})
export class ConveniencesModule { }
