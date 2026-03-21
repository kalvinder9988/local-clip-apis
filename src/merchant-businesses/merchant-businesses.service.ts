import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Not, In } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { CreateMerchantBusinessDto } from './dto/create-merchant-business.dto';
import { UpdateMerchantBusinessDto } from './dto/update-merchant-business.dto';
import { MerchantBusiness } from './entities/merchant-business.entity';
import { MerchantConvenience } from './entities/merchant-convenience.entity';
import { Convenience } from './entities/convenience.entity';
import { Asset } from './entities/asset.entity';
import { AdminUser, AdminRole } from '../admin-users/entities/admin-user.entity';
import { Category } from '../categories/entities/category.entity';
import { Zipcode } from '../zipcodes/entities/zipcode.entity';
import { generateUniqueSlug } from '../common/utils/slug.utils';

@Injectable()
export class MerchantBusinessesService {
  constructor(
    @InjectRepository(MerchantBusiness)
    private readonly merchantBusinessRepository: Repository<MerchantBusiness>,
    @InjectRepository(MerchantConvenience)
    private readonly merchantConvenienceRepository: Repository<MerchantConvenience>,
    @InjectRepository(Convenience)
    private readonly convenienceRepository: Repository<Convenience>,
    @InjectRepository(Asset)
    private readonly assetRepository: Repository<Asset>,
    @InjectRepository(AdminUser)
    private readonly adminUserRepository: Repository<AdminUser>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Zipcode)
    private readonly zipcodeRepository: Repository<Zipcode>,
    private readonly dataSource: DataSource,
  ) { }

  /**
   * Create merchant business (Step 1 - Required)
   * Creates admin user as merchant and merchant business record
   */
  async create(createMerchantBusinessDto: CreateMerchantBusinessDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Step 1: Check if owner email already exists
      const existingUser = await this.adminUserRepository.findOne({
        where: { email: createMerchantBusinessDto.owner_email },
      });

      if (existingUser) {
        throw new ConflictException('Owner email already exists in the system');
      }

      // Validate category exists
      const category = await this.categoryRepository.findOne({
        where: { id: createMerchantBusinessDto.category_id },
      });

      if (!category) {
        throw new NotFoundException(`Category with ID ${createMerchantBusinessDto.category_id} not found`);
      }

      // Validate zipcode exists
      const zipcode = await this.zipcodeRepository.findOne({
        where: { id: createMerchantBusinessDto.zipcode_id },
      });

      if (!zipcode) {
        throw new NotFoundException(`Zipcode with ID ${createMerchantBusinessDto.zipcode_id} not found`);
      }

      // Step 2: Create AdminUser as MERCHANT
      // Generate a random password (merchant will reset on first login or via email)
      const randomPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      const merchantUser = this.adminUserRepository.create({
        name: createMerchantBusinessDto.owner_name,
        email: createMerchantBusinessDto.owner_email,
        phone: createMerchantBusinessDto.owner_phone,
        password: hashedPassword,
        role: AdminRole.MERCHANT,
      });

      const savedMerchantUser = await queryRunner.manager.save(merchantUser);

      // Generate unique slug from business name
      const slug = await this.generateBusinessSlug(createMerchantBusinessDto.business_name);

      // Step 3: Create MerchantBusiness record
      const merchantBusiness = this.merchantBusinessRepository.create({
        business_name: createMerchantBusinessDto.business_name,
        slug: slug,
        business_tagline: createMerchantBusinessDto.business_tagline,
        phone: createMerchantBusinessDto.phone,
        website: createMerchantBusinessDto.website,
        banner_image: createMerchantBusinessDto.banner_image,
        description: createMerchantBusinessDto.description,
        zipcode: zipcode,
        category: category,
        merchant: savedMerchantUser,
        location: createMerchantBusinessDto.location,
        lat: createMerchantBusinessDto.lat,
        lng: createMerchantBusinessDto.lng,
        featured_savings: createMerchantBusinessDto.featured_savings ?? false,
        more_great_savings: createMerchantBusinessDto.more_great_savings ?? false,
        status: createMerchantBusinessDto.status ?? true,
      });

      const savedBusiness = await queryRunner.manager.save(merchantBusiness);

      // Step 4: Handle conveniences if provided (Step 2 - Optional)
      if (createMerchantBusinessDto.convenience_ids && createMerchantBusinessDto.convenience_ids.length > 0) {
        await this.addConveniences(savedBusiness.id, createMerchantBusinessDto.convenience_ids, queryRunner);
      }

      // Commit transaction
      await queryRunner.commitTransaction();

      // Return the created business with relations
      return this.findOne(savedBusiness.id);

    } catch (error) {
      // Rollback transaction on error
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Add conveniences to merchant business (Step 2)
   */
  async addConveniences(merchantBusinessId: number, convenienceIds: number[], queryRunner?: any) {
    const manager = queryRunner ? queryRunner.manager : this.dataSource.manager;

    // Validate merchant business exists (use transactional manager so newly created businesses are visible)
    const merchantBusiness = await manager.findOne(MerchantBusiness, {
      where: { id: merchantBusinessId },
    });

    if (!merchantBusiness) {
      throw new NotFoundException(`Merchant business with ID ${merchantBusinessId} not found`);
    }

    // Validate all convenience IDs exist (use manager to stay within transaction context)
    const conveniences = await manager.find(Convenience, { where: { id: In(convenienceIds) } });

    if (conveniences.length !== convenienceIds.length) {
      throw new BadRequestException('One or more convenience IDs are invalid');
    }

    // Delete existing conveniences for this business
    await manager.delete(MerchantConvenience, { merchant_business: { id: merchantBusinessId } });

    // Create new merchant_convenience records
    const merchantConveniences = convenienceIds.map((convenienceId) => {
      return this.merchantConvenienceRepository.create({
        merchant_business: { id: merchantBusinessId } as any,
        convenience: { id: convenienceId } as any,
      });
    });

    await manager.save(merchantConveniences);

    return { message: 'Conveniences added successfully' };
  }

  /**
   * Add assets to merchant business (Step 3)
   */
  async addAssets(merchantBusinessId: number, assets: Array<{ asset_name: string; asset_type: 'image' | 'video' | 'attachment' }>) {
    // Validate merchant business exists
    const merchantBusiness = await this.merchantBusinessRepository.findOne({
      where: { id: merchantBusinessId },
    });

    if (!merchantBusiness) {
      throw new NotFoundException(`Merchant business with ID ${merchantBusinessId} not found`);
    }

    // Create asset records
    const assetRecords = assets.map((asset) => {
      return this.assetRepository.create({
        merchant_business: merchantBusiness,
        asset_name: asset.asset_name,
        asset_type: asset.asset_type,
      });
    });

    await this.assetRepository.save(assetRecords);

    return { message: 'Assets added successfully', count: assetRecords.length };
  }

  /**
   * Get all merchant businesses
   */
  async findAll() {
    return this.merchantBusinessRepository.find({
      where: { deleted: false },
      relations: ['zipcode', 'category', 'merchant', 'merchant_convenience', 'assets'],
      order: { created_at: 'DESC' },
    });
  }

  /**
   * Get merchant businesses owned by a specific admin user (merchant role)
   */
  async findByMerchantUserId(merchantUserId: number) {
    return this.merchantBusinessRepository.find({
      where: { merchant: { id: merchantUserId }, deleted: false },
      relations: ['zipcode', 'category', 'merchant', 'merchant_convenience', 'merchant_convenience.convenience', 'assets'],
      order: { created_at: 'DESC' },
    });
  }

  /**
   * Get merchant business by ID
   */
  async findOne(id: number) {
    const merchantBusiness = await this.merchantBusinessRepository.findOne({
      where: { id, deleted: false },
      relations: ['zipcode', 'category', 'merchant', 'merchant_convenience', 'merchant_convenience.convenience', 'assets', 'reviews'],
    });

    if (!merchantBusiness) {
      throw new NotFoundException(`Merchant business with ID ${id} not found`);
    }

    return merchantBusiness;
  }

  /**
   * Update merchant business
   */
  async update(id: number, updateMerchantBusinessDto: UpdateMerchantBusinessDto) {
    const merchantBusiness = await this.findOne(id);

    // Update owner name if provided
    if (updateMerchantBusinessDto.owner_name && merchantBusiness.merchant) {
      merchantBusiness.merchant.name = updateMerchantBusinessDto.owner_name;
      await this.adminUserRepository.save(merchantBusiness.merchant);
    }

    // Generate new slug if business name changed
    if (updateMerchantBusinessDto.business_name && updateMerchantBusinessDto.business_name !== merchantBusiness.business_name) {
      const slug = await this.generateBusinessSlug(updateMerchantBusinessDto.business_name, id);
      merchantBusiness.slug = slug;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { owner_name, ...businessFields } = updateMerchantBusinessDto;

    // Update fields
    Object.assign(merchantBusiness, businessFields);

    // If category_id or zipcode_id changed, update relations
    if (updateMerchantBusinessDto.category_id) {
      const category = await this.categoryRepository.findOne({
        where: { id: updateMerchantBusinessDto.category_id },
      });
      if (!category) {
        throw new NotFoundException(`Category with ID ${updateMerchantBusinessDto.category_id} not found`);
      }
      merchantBusiness.category = category;
    }

    if (updateMerchantBusinessDto.zipcode_id) {
      const zipcode = await this.zipcodeRepository.findOne({
        where: { id: updateMerchantBusinessDto.zipcode_id },
      });
      if (!zipcode) {
        throw new NotFoundException(`Zipcode with ID ${updateMerchantBusinessDto.zipcode_id} not found`);
      }
      merchantBusiness.zipcode = zipcode;
    }

    await this.merchantBusinessRepository.save(merchantBusiness);

    return this.findOne(id);
  }

  /**
   * Soft delete merchant business
   */
  async remove(id: number) {
    const merchantBusiness = await this.findOne(id);

    merchantBusiness.deleted = true;
    await this.merchantBusinessRepository.save(merchantBusiness);

    return { message: 'Merchant business deleted successfully' };
  }

  /**
   * Get assets for a merchant business
   */
  async getAssets(id: number) {
    await this.findOne(id); // Validate business exists

    return this.assetRepository.find({
      where: { merchant_business: { id } },
      order: { created_at: 'DESC' },
    });
  }

  /**
   * Update banner image for merchant business
   */
  async updateBanner(id: number, bannerPath: string) {
    const merchantBusiness = await this.findOne(id);
    merchantBusiness.banner_image = bannerPath;
    await this.merchantBusinessRepository.save(merchantBusiness);
    return this.findOne(id);
  }

  /**
   * Delete an asset from merchant business
   */
  async deleteAsset(businessId: number, assetId: number) {
    await this.findOne(businessId); // Validate business exists

    const asset = await this.assetRepository.findOne({
      where: { id: assetId, merchant_business: { id: businessId } },
    });

    if (!asset) {
      throw new NotFoundException(`Asset with ID ${assetId} not found for this merchant business`);
    }

    await this.assetRepository.remove(asset);

    return { message: 'Asset deleted successfully' };
  }

  /**
   * Generate unique slug for merchant business
   */
  private async generateBusinessSlug(name: string, excludeId?: number): Promise<string> {
    const checkExists = async (slug: string): Promise<boolean> => {
      const where: any = { slug };
      if (excludeId) {
        where.id = Not(excludeId);
      }
      const existing = await this.merchantBusinessRepository.findOne({ where });
      return !!existing;
    };

    return generateUniqueSlug(name, null, checkExists);
  }
}
