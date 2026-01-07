import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { BannersController } from './banners.controller';
import { BannersService } from './banners.service';
import { Banner } from './entities/banner.entity';
import { StaticPagesController } from './static-pages.controller';
import { StaticPagesService } from './static-pages.service';
import { StaticPage } from './entities/static-page.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Banner, StaticPage]),
    MulterModule.register({
      dest: './uploads/banners',
    }),
  ],
  controllers: [BannersController, StaticPagesController],
  providers: [BannersService, StaticPagesService],
  exports: [BannersService, StaticPagesService],
})
export class ContentsModule { }
