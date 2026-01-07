import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';
import { Banner } from './entities/banner.entity';

@Injectable()
export class BannersService {
    constructor(
        @InjectRepository(Banner)
        private readonly bannerRepository: Repository<Banner>,
    ) { }

    async create(createBannerDto: CreateBannerDto): Promise<Banner> {
        // If display_order is 0 or not provided, set it to next available order
        if (!createBannerDto.display_order || createBannerDto.display_order === 0) {
            const banners = await this.bannerRepository.find({
                order: { display_order: 'DESC' },
                take: 1,
            });

            const maxOrderBanner = banners.length > 0 ? banners[0] : null;

            // If there are existing banners, set order to max + 1, otherwise set to 1
            createBannerDto.display_order = maxOrderBanner ? maxOrderBanner.display_order + 1 : 1;

            console.log(`Auto-assigned display_order: ${createBannerDto.display_order}`);
        }

        const banner = this.bannerRepository.create(createBannerDto);
        return await this.bannerRepository.save(banner);
    }

    async findAll(): Promise<Banner[]> {
        return await this.bannerRepository.find({
            order: { display_order: 'ASC', created_at: 'DESC' },
        });
    }

    async findAllActive(): Promise<Banner[]> {
        return await this.bannerRepository.find({
            where: { status: true },
            order: { display_order: 'ASC', created_at: 'DESC' },
        });
    }

    async findOne(id: number): Promise<Banner> {
        const banner = await this.bannerRepository.findOne({ where: { id } });
        if (!banner) {
            throw new NotFoundException(`Banner with ID ${id} not found`);
        }
        return banner;
    }

    async update(id: number, updateBannerDto: UpdateBannerDto): Promise<Banner> {
        const banner = await this.findOne(id);
        Object.assign(banner, updateBannerDto);
        return await this.bannerRepository.save(banner);
    }

    async remove(id: number): Promise<void> {
        const banner = await this.findOne(id);
        await this.bannerRepository.remove(banner);
    }

    async updateDisplayOrder(id: number, display_order: number): Promise<Banner> {
        const banner = await this.findOne(id);
        banner.display_order = display_order;
        return await this.bannerRepository.save(banner);
    }
}
