import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Banner } from '../../contents/entities/banner.entity';
import { Category } from '../../categories/entities/category.entity';
import { MerchantBusiness } from '../../merchant-businesses/entities/merchant-business.entity';
import { StaticPage, StaticPageType } from '../../contents/entities/static-page.entity';
import { ContactInquiry } from './entities/contact-inquiry.entity';

@Injectable()
export class HomeService {
    constructor(
        @InjectRepository(Banner)
        private readonly bannerRepository: Repository<Banner>,

        @InjectRepository(Category)
        private readonly categoryRepository: Repository<Category>,

        @InjectRepository(MerchantBusiness)
        private readonly merchantBusinessRepository: Repository<MerchantBusiness>,

        @InjectRepository(StaticPage)
        private readonly staticPageRepository: Repository<StaticPage>,

        @InjectRepository(ContactInquiry)
        private readonly contactInquiryRepository: Repository<ContactInquiry>,
    ) { }

    /**
     * Get all active banners ordered by display_order
     */
    async getBanners(): Promise<Banner[]> {
        return this.bannerRepository.find({
            where: { status: true },
            order: { display_order: 'ASC', created_at: 'ASC' },
        });
    }

    /**
     * Get all active categories
     */
    async getCategories(): Promise<Category[]> {
        return this.categoryRepository.find({
            where: { status: true },
            order: { name: 'ASC' },
        });
    }

    /**
     * Get featured savings deals (merchant businesses with featured_savings = true)
     * Optionally filtered by category slug
     */
    async getFeaturedDeals(categorySlug?: string, limit?: number): Promise<MerchantBusiness[]> {
        const queryBuilder = this.merchantBusinessRepository
            .createQueryBuilder('mb')
            .leftJoinAndSelect('mb.category', 'category')
            .leftJoinAndSelect('mb.zipcode', 'zipcode')
            .where('mb.featured_savings = :featured', { featured: true })
            .andWhere('mb.status = :status', { status: true })
            .andWhere('mb.deleted = :deleted', { deleted: false });

        if (categorySlug && categorySlug !== 'all') {
            queryBuilder.andWhere('category.slug = :slug', { slug: categorySlug });
        }

        if (limit) {
            queryBuilder.take(limit);
        }

        return queryBuilder.orderBy('mb.created_at', 'DESC').getMany();
    }

    /**
     * Get more great savings deals (merchant businesses with more_great_savings = true)
     * Optionally filtered by category slug
     */
    async getMoreDeals(categorySlug?: string, limit?: number): Promise<MerchantBusiness[]> {
        const queryBuilder = this.merchantBusinessRepository
            .createQueryBuilder('mb')
            .leftJoinAndSelect('mb.category', 'category')
            .leftJoinAndSelect('mb.zipcode', 'zipcode')
            .where('mb.more_great_savings = :mgs', { mgs: true })
            .andWhere('mb.status = :status', { status: true })
            .andWhere('mb.deleted = :deleted', { deleted: false });

        if (categorySlug && categorySlug !== 'all') {
            queryBuilder.andWhere('category.slug = :slug', { slug: categorySlug });
        }

        if (limit) {
            queryBuilder.take(limit);
        }

        return queryBuilder.orderBy('mb.created_at', 'DESC').getMany();
    }

    /**
     * Search deals by keyword and/or zipcode
     */
    async searchDeals(keyword?: string, zipcode?: string): Promise<MerchantBusiness[]> {
        const queryBuilder = this.merchantBusinessRepository
            .createQueryBuilder('mb')
            .leftJoinAndSelect('mb.category', 'category')
            .leftJoinAndSelect('mb.zipcode', 'zipcode')
            .where('mb.status = :status', { status: true })
            .andWhere('mb.deleted = :deleted', { deleted: false });

        if (keyword) {
            queryBuilder.andWhere(
                '(mb.business_name LIKE :keyword OR mb.description LIKE :keyword OR mb.business_tagline LIKE :keyword OR category.name LIKE :keyword)',
                { keyword: `%${keyword}%` },
            );
        }

        if (zipcode) {
            queryBuilder.andWhere('zipcode.zipcode = :zipcode', { zipcode });
        }

        return queryBuilder.orderBy('mb.created_at', 'DESC').getMany();
    }

    /**
     * Get all deals with optional filters: category, zipcode, type (featured | more | all)
     */
    async getAllDeals(
        categories?: string,
        zipcode?: string,
        type?: 'featured' | 'more' | 'all',
    ): Promise<MerchantBusiness[]> {
        const queryBuilder = this.merchantBusinessRepository
            .createQueryBuilder('mb')
            .leftJoinAndSelect('mb.category', 'category')
            .leftJoinAndSelect('mb.zipcode', 'zipcode')
            .where('mb.status = :status', { status: true })
            .andWhere('mb.deleted = :deleted', { deleted: false });

        if (type === 'featured') {
            queryBuilder.andWhere('mb.featured_savings = :f', { f: true });
        } else if (type === 'more') {
            queryBuilder.andWhere('mb.more_great_savings = :m', { m: true });
        }

        if (categories) {
            const slugs = categories.split(',').map(s => s.trim()).filter(Boolean);
            if (slugs.length === 1) {
                queryBuilder.andWhere('category.slug = :slug', { slug: slugs[0] });
            } else if (slugs.length > 1) {
                queryBuilder.andWhere('category.slug IN (:...slugs)', { slugs });
            }
        }

        if (zipcode) {
            queryBuilder.andWhere('zipcode.zipcode = :zipcode', { zipcode });
        }

        return queryBuilder.orderBy('mb.created_at', 'DESC').getMany();
    }

    async getStaticPage(type: StaticPageType): Promise<StaticPage> {
        const page = await this.staticPageRepository.findOne({
            where: { type, status: 'active' },
        });
        if (!page) {
            throw new NotFoundException(`Static page '${type}' not found`);
        }
        return page;
    }

    async submitContact(data: {
        name: string;
        email: string;
        phone: string;
        subject: string;
        message: string;
        user_id?: number | null;
    }): Promise<{ message: string }> {
        const inquiry = this.contactInquiryRepository.create({
            name: data.name,
            email: data.email,
            phone: data.phone,
            subject: data.subject,
            message: data.message,
            user_id: data.user_id ?? null,
        });
        await this.contactInquiryRepository.save(inquiry);
        return { message: 'Your message has been received. We\'ll be in touch shortly.' };
    }
}

