import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { Coupon } from './entities/coupon.entity';

@Injectable()
export class CouponsService {
  constructor(
    @InjectRepository(Coupon)
    private readonly couponRepository: Repository<Coupon>,
  ) { }

  async create(createCouponDto: CreateCouponDto, file?: any): Promise<Coupon> {
    // Check if coupon code already exists
    const existingCoupon = await this.couponRepository.findOne({
      where: { coupon_code: createCouponDto.coupon_code },
    });

    if (existingCoupon) {
      throw new ConflictException(`Coupon code "${createCouponDto.coupon_code}" already exists`);
    }

    // Validate dates
    const validFrom = new Date(createCouponDto.valid_from);
    const validTo = new Date(createCouponDto.valid_to);

    if (validTo <= validFrom) {
      throw new BadRequestException('valid_to must be after valid_from');
    }

    // Prepare coupon data - explicitly handle image
    const couponData: any = { ...createCouponDto };

    // Only set coupon_image if a file was uploaded
    if (file) {
      couponData.coupon_image = file.filename;
    }

    const coupon = this.couponRepository.create(couponData);
    const savedCoupon = await this.couponRepository.save(coupon);
    return savedCoupon as unknown as Coupon;
  }

  async findAll(): Promise<Coupon[]> {
    return await this.couponRepository.find({
      relations: ['merchant_business'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Coupon> {
    const coupon = await this.couponRepository.findOne({
      where: { id },
      relations: ['merchant_business'],
    });

    if (!coupon) {
      throw new NotFoundException(`Coupon with ID ${id} not found`);
    }

    return coupon;
  }

  async findByMerchantBusiness(merchantBusinessId: number): Promise<Coupon[]> {
    return await this.couponRepository.find({
      where: { merchant_business_id: merchantBusinessId },
      relations: ['merchant_business'],
      order: { created_at: 'DESC' },
    });
  }

  async findByCouponCode(couponCode: string): Promise<Coupon> {
    const coupon = await this.couponRepository.findOne({
      where: { coupon_code: couponCode },
      relations: ['merchant_business'],
    });

    if (!coupon) {
      throw new NotFoundException(`Coupon with code "${couponCode}" not found`);
    }

    return coupon;
  }

  async update(id: number, updateCouponDto: UpdateCouponDto, file?: any): Promise<Coupon> {
    const coupon = await this.findOne(id);

    // If coupon code is being updated, check uniqueness
    if (updateCouponDto.coupon_code && updateCouponDto.coupon_code !== coupon.coupon_code) {
      const existingCoupon = await this.couponRepository.findOne({
        where: { coupon_code: updateCouponDto.coupon_code },
      });

      if (existingCoupon) {
        throw new ConflictException(`Coupon code "${updateCouponDto.coupon_code}" already exists`);
      }
    }

    // Validate dates if being updated
    if (updateCouponDto.valid_from || updateCouponDto.valid_to) {
      const validFrom = updateCouponDto.valid_from
        ? new Date(updateCouponDto.valid_from)
        : coupon.valid_from;
      const validTo = updateCouponDto.valid_to
        ? new Date(updateCouponDto.valid_to)
        : coupon.valid_to;

      if (validTo <= validFrom) {
        throw new BadRequestException('valid_to must be after valid_from');
      }
    }

    // Handle image update
    if (file) {
      // New file uploaded - update with new filename
      coupon.coupon_image = file.filename;
    }
    // If no file, don't modify coupon_image - keep existing value

    Object.assign(coupon, updateCouponDto);
    return await this.couponRepository.save(coupon);
  }

  async remove(id: number): Promise<void> {
    const coupon = await this.findOne(id);
    await this.couponRepository.remove(coupon);
  }

  async incrementLikes(id: number): Promise<Coupon> {
    const coupon = await this.findOne(id);
    coupon.total_likes += 1;
    return await this.couponRepository.save(coupon);
  }

  async incrementDislikes(id: number): Promise<Coupon> {
    const coupon = await this.findOne(id);
    coupon.total_dislikes += 1;
    return await this.couponRepository.save(coupon);
  }

  async incrementShared(id: number): Promise<Coupon> {
    const coupon = await this.findOne(id);
    coupon.total_shared += 1;
    return await this.couponRepository.save(coupon);
  }

  async toggleStatus(id: number): Promise<Coupon> {
    const coupon = await this.findOne(id);
    coupon.status = !coupon.status;
    return await this.couponRepository.save(coupon);
  }
}
