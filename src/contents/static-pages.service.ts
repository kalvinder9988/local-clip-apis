import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { CreateStaticPageDto } from './dto/create-static-page.dto';
import { UpdateStaticPageDto } from './dto/update-static-page.dto';
import { StaticPage, StaticPageType } from './entities/static-page.entity';
import { generateUniqueSlug } from '../common/utils/slug.utils';

@Injectable()
export class StaticPagesService {
    constructor(
        @InjectRepository(StaticPage)
        private readonly staticPageRepository: Repository<StaticPage>,
    ) { }

    /**
     * Generate unique slug from page type
     */
    private generateSlugFromType(type: StaticPageType): string {
        return type; // type already has proper format like 'terms-conditions'
    }

    /**
     * Create a new static page
     */
    async create(createStaticPageDto: CreateStaticPageDto): Promise<StaticPage> {
        try {
            // Check if page with this type already exists
            const existingPage = await this.staticPageRepository.findOne({
                where: { type: createStaticPageDto.type },
            });

            if (existingPage) {
                throw new ConflictException(`A static page with type '${createStaticPageDto.type}' already exists`);
            }

            // Generate slug from type
            const slug = this.generateSlugFromType(createStaticPageDto.type);

            const staticPage = this.staticPageRepository.create({
                ...createStaticPageDto,
                slug,
                status: createStaticPageDto.status || 'active',
            });

            return await this.staticPageRepository.save(staticPage);
        } catch (error) {
            if (error instanceof ConflictException) {
                throw error;
            }
            throw new BadRequestException('Failed to create static page');
        }
    }

    /**
     * Get all static pages
     */
    async findAll(): Promise<StaticPage[]> {
        return await this.staticPageRepository.find({
            order: { created_at: 'DESC' },
        });
    }

    /**
     * Get static page by ID
     */
    async findOne(id: number): Promise<StaticPage> {
        const staticPage = await this.staticPageRepository.findOne({
            where: { id },
        });

        if (!staticPage) {
            throw new NotFoundException(`Static page with ID ${id} not found`);
        }

        return staticPage;
    }

    /**
     * Get static page by type
     */
    async findByType(type: StaticPageType): Promise<StaticPage> {
        const staticPage = await this.staticPageRepository.findOne({
            where: { type },
        });

        if (!staticPage) {
            throw new NotFoundException(`Static page with type '${type}' not found`);
        }

        return staticPage;
    }

    /**
     * Get static page by slug
     */
    async findBySlug(slug: string): Promise<StaticPage> {
        const staticPage = await this.staticPageRepository.findOne({
            where: { slug },
        });

        if (!staticPage) {
            throw new NotFoundException(`Static page with slug '${slug}' not found`);
        }

        return staticPage;
    }

    /**
     * Update a static page
     */
    async update(id: number, updateStaticPageDto: UpdateStaticPageDto): Promise<StaticPage> {
        const staticPage = await this.findOne(id);

        // Check if trying to change type to one that already exists
        if (updateStaticPageDto.type && updateStaticPageDto.type !== staticPage.type) {
            const existingPage = await this.staticPageRepository.findOne({
                where: { type: updateStaticPageDto.type },
            });

            if (existingPage) {
                throw new ConflictException(`A static page with type '${updateStaticPageDto.type}' already exists`);
            }

            // Update slug if type changes
            staticPage.slug = this.generateSlugFromType(updateStaticPageDto.type);
        }

        Object.assign(staticPage, updateStaticPageDto);

        try {
            return await this.staticPageRepository.save(staticPage);
        } catch (error) {
            throw new BadRequestException('Failed to update static page');
        }
    }

    /**
     * Delete a static page
     */
    async remove(id: number): Promise<{ message: string }> {
        const staticPage = await this.findOne(id);
        await this.staticPageRepository.remove(staticPage);
        return { message: `Static page with ID ${id} has been deleted` };
    }

    /**
     * Toggle static page status
     */
    async toggleStatus(id: number): Promise<StaticPage> {
        const staticPage = await this.findOne(id);
        staticPage.status = staticPage.status === 'active' ? 'inactive' : 'active';
        return await this.staticPageRepository.save(staticPage);
    }
}
