import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category } from './entities/category.entity';
import { CategoryResponseDto } from './dto/category-response.dto';
import { generateUniqueSlug } from '../common/utils/slug.utils';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) { }

  /**
   * Create a new category
   */
  async create(createCategoryDto: CreateCategoryDto): Promise<CategoryResponseDto> {
    try {
      // Generate unique slug from category name
      const slug = await this.generateCategorySlug(createCategoryDto.name);

      const category = this.categoryRepository.create({
        ...createCategoryDto,
        slug,
      });
      const savedCategory = await this.categoryRepository.save(category);
      return this.toResponseDto(savedCategory);
    } catch (error) {
      throw new BadRequestException('Failed to create category');
    }
  }

  /**
   * Find all categories
   */
  async findAll(): Promise<CategoryResponseDto[]> {
    const categories = await this.categoryRepository.find({
      order: { created_at: 'DESC' },
    });
    return categories.map((category) => this.toResponseDto(category));
  }

  /**
   * Find one category by ID
   */
  async findOne(id: number): Promise<CategoryResponseDto> {
    const category = await this.categoryRepository.findOne({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return this.toResponseDto(category);
  }

  /**
   * Update a category
   */
  async update(id: number, updateCategoryDto: UpdateCategoryDto): Promise<CategoryResponseDto> {
    const category = await this.categoryRepository.findOne({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    // Generate new slug if name changed
    if (updateCategoryDto.name && updateCategoryDto.name !== category.name) {
      const slug = await this.generateCategorySlug(updateCategoryDto.name, id);
      category.slug = slug;
    }

    Object.assign(category, updateCategoryDto);

    try {
      const updatedCategory = await this.categoryRepository.save(category);
      return this.toResponseDto(updatedCategory);
    } catch (error) {
      throw new BadRequestException('Failed to update category');
    }
  }

  /**
   * Remove a category
   */
  async remove(id: number): Promise<{ message: string }> {
    const category = await this.categoryRepository.findOne({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    await this.categoryRepository.remove(category);
    return { message: `Category with ID ${id} has been deleted` };
  }

  /**
   * Convert Category entity to response DTO
   */
  private toResponseDto(category: Category): CategoryResponseDto {
    return {
      id: category.id,
      name: category.name,
      status: category.status,
      created_at: category.created_at,
      updated_at: category.updated_at,
    };
  }

  /**
   * Generate unique slug for category
   */
  private async generateCategorySlug(name: string, excludeId?: number): Promise<string> {
    const checkExists = async (slug: string): Promise<boolean> => {
      const where: any = { slug };
      if (excludeId) {
        where.id = Not(excludeId);
      }
      const existing = await this.categoryRepository.findOne({ where });
      return !!existing;
    };

    return generateUniqueSlug(name, null, checkExists);
  }
}
