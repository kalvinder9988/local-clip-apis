import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContactInquiry } from '../web-apis/home/entities/contact-inquiry.entity';
import { ContactInquiriesService } from './contact-inquiries.service';
import { ContactInquiriesController } from './contact-inquiries.controller';

@Module({
    imports: [TypeOrmModule.forFeature([ContactInquiry])],
    controllers: [ContactInquiriesController],
    providers: [ContactInquiriesService],
})
export class ContactInquiriesModule { }
