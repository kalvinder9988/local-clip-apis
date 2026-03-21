import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContactInquiry, ContactInquiryStatus } from '../web-apis/home/entities/contact-inquiry.entity';

@Injectable()
export class ContactInquiriesService {
    constructor(
        @InjectRepository(ContactInquiry)
        private readonly repo: Repository<ContactInquiry>,
    ) { }

    async findAll(): Promise<{ data: ContactInquiry[]; total: number }> {
        const [data, total] = await this.repo.findAndCount({
            order: { created_at: 'DESC' },
        });
        return { data, total };
    }

    async findOne(id: number): Promise<ContactInquiry> {
        const inquiry = await this.repo.findOne({ where: { id } });
        if (!inquiry) throw new NotFoundException(`Inquiry #${id} not found`);
        return inquiry;
    }

    async updateStatus(id: number, status: ContactInquiryStatus): Promise<ContactInquiry> {
        const inquiry = await this.findOne(id);
        inquiry.status = status;
        return this.repo.save(inquiry);
    }

    async delete(id: number): Promise<{ message: string }> {
        await this.findOne(id);
        await this.repo.delete(id);
        return { message: 'Inquiry deleted successfully' };
    }
}
