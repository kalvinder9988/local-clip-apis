import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { Coupon } from './entities/coupon.entity';
import { UserCouponReaction, CouponReactionType } from '../merchant-businesses/entities/user-coupon-reaction.entity';
import { SharedCoupon } from '../merchant-businesses/entities/shared-coupon.entity';
import { normalizePagination } from '../common/utils/pagination.util';

@Injectable()
export class CouponsService {
  constructor(
    @InjectRepository(Coupon)
    private readonly couponRepository: Repository<Coupon>,
    @InjectRepository(UserCouponReaction)
    private readonly userCouponReactionRepository: Repository<UserCouponReaction>,
    @InjectRepository(SharedCoupon)
    private readonly sharedCouponRepository: Repository<SharedCoupon>,
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

  private async attachRedeemedCounts<T extends { id: number }>(coupons: T[]) {
    if (coupons.length === 0) {
      return coupons.map((coupon) => ({ ...coupon, total_redeemed: 0 }));
    }

    const couponIds = coupons.map((coupon) => coupon.id);
    const rows = await this.sharedCouponRepository
      .createQueryBuilder('share')
      .select('share.coupon_id', 'coupon_id')
      .addSelect('COUNT(share.id)', 'total_redeemed')
      .where('share.coupon_id IN (:...couponIds)', { couponIds })
      .andWhere('share.used_status = :used', { used: true })
      .groupBy('share.coupon_id')
      .getRawMany();

    const redeemedMap = new Map(
      rows.map((row) => [Number(row.coupon_id), Number(row.total_redeemed)]),
    );

    return coupons.map((coupon) => ({
      ...coupon,
      total_redeemed: redeemedMap.get(coupon.id) ?? 0,
    }));
  }

  private applyValidityDateRangeFilter(
    qb: ReturnType<Repository<Coupon>['createQueryBuilder']>,
    dateFrom?: string,
    dateTo?: string,
  ) {
    if (dateFrom) {
      qb.andWhere('coupon.valid_to >= :dateFrom', { dateFrom });
    }
    if (dateTo) {
      qb.andWhere('coupon.valid_from <= :dateTo', { dateTo });
    }
  }

  async findAll(
    merchantBusinessId?: number,
    page: number = 1,
    limit: number = 10,
    dateFrom?: string,
    dateTo?: string,
  ) {
    const { page: normalizedPage, limit: normalizedLimit, skip } = normalizePagination(page, limit);

    const qb = this.couponRepository
      .createQueryBuilder('coupon')
      .leftJoinAndSelect('coupon.merchant_business', 'merchant_business')
      .orderBy('coupon.created_at', 'DESC');

    if (merchantBusinessId) {
      qb.andWhere('coupon.merchant_business_id = :merchantBusinessId', { merchantBusinessId });
    }

    this.applyValidityDateRangeFilter(qb, dateFrom, dateTo);

    const [data, total] = await qb.skip(skip).take(normalizedLimit).getManyAndCount();

    const countQb = this.couponRepository.createQueryBuilder('coupon');
    if (merchantBusinessId) {
      countQb.andWhere('coupon.merchant_business_id = :merchantBusinessId', { merchantBusinessId });
    }
    this.applyValidityDateRangeFilter(countQb, dateFrom, dateTo);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const activeCount = await countQb
      .clone()
      .andWhere('coupon.status = :status', { status: true })
      .andWhere('coupon.valid_to >= :today', { today })
      .getCount();
    const inactiveCount = await countQb
      .clone()
      .andWhere('coupon.status = :status', { status: false })
      .andWhere('coupon.valid_to >= :today', { today })
      .getCount();
    const expiredCount = await countQb
      .clone()
      .andWhere('coupon.valid_to < :today', { today })
      .getCount();

    const dataWithRedeemed = await this.attachRedeemedCounts(data);

    return {
      data: dataWithRedeemed,
      total,
      page: normalizedPage,
      limit: normalizedLimit,
      active_count: activeCount,
      inactive_count: inactiveCount,
      expired_count: expiredCount,
    };
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

  async findByMerchantBusiness(
    merchantBusinessId: number,
    page: number = 1,
    limit: number = 10,
    dateFrom?: string,
    dateTo?: string,
  ) {
    return this.findAll(merchantBusinessId, page, limit, dateFrom, dateTo);
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

  async getCouponLikes(id: number) {
    const result = await this.getAllLikes(id, undefined, 1, 100);
    return result.data;
  }

  async getCouponDislikes(id: number) {
    const result = await this.getAllDislikes(id, undefined, 1, 100);
    return result.data;
  }

  async getAllLikes(
    couponId?: number,
    merchantBusinessId?: number,
    page: number = 1,
    limit: number = 10,
  ) {
    if (couponId) {
      await this.findOne(couponId);
    }

    const { normalizedPage, normalizedLimit, skip } = this.normalizePagination(page, limit);
    const [reactions, total] = await this.buildReactionQuery(CouponReactionType.LIKE, {
      couponId,
      merchantBusinessId,
    })
      .skip(skip)
      .take(normalizedLimit)
      .getManyAndCount();

    return {
      data: reactions.map((reaction) => this.mapReaction(reaction)),
      total,
      page: normalizedPage,
      limit: normalizedLimit,
    };
  }

  async getAllDislikes(
    couponId?: number,
    merchantBusinessId?: number,
    page: number = 1,
    limit: number = 10,
  ) {
    if (couponId) {
      await this.findOne(couponId);
    }

    const { normalizedPage, normalizedLimit, skip } = this.normalizePagination(page, limit);
    const [reactions, total] = await this.buildReactionQuery(CouponReactionType.DISLIKE, {
      couponId,
      merchantBusinessId,
    })
      .skip(skip)
      .take(normalizedLimit)
      .getManyAndCount();

    return {
      data: reactions.map((reaction) => this.mapReaction(reaction)),
      total,
      page: normalizedPage,
      limit: normalizedLimit,
    };
  }

  async getCouponShares(id: number) {
    const result = await this.getAllShares(id, undefined, 1, 100);
    return result.data;
  }

  async getAllShares(
    couponId?: number,
    merchantBusinessId?: number,
    page: number = 1,
    limit: number = 10,
  ) {
    if (couponId) {
      await this.findOne(couponId);
    }

    const { normalizedPage, normalizedLimit, skip } = this.normalizePagination(page, limit);
    const qb = this.buildShareQuery(couponId, merchantBusinessId);
    const [shares, total] = await qb.skip(skip).take(normalizedLimit).getManyAndCount();

    const usedCount = await this.buildShareQuery(couponId, merchantBusinessId)
      .andWhere('share.used_status = :usedStatus', { usedStatus: true })
      .getCount();

    return {
      data: shares.map((share) => this.mapShare(share)),
      total,
      page: normalizedPage,
      limit: normalizedLimit,
      used_count: usedCount,
      unused_count: total - usedCount,
    };
  }

  private normalizePagination(page: number, limit: number) {
    const normalizedPage = Math.max(1, Number(page) || 1);
    const normalizedLimit = Math.min(100, Math.max(1, Number(limit) || 10));
    return {
      normalizedPage,
      normalizedLimit,
      skip: (normalizedPage - 1) * normalizedLimit,
    };
  }

  private buildShareQuery(couponId?: number, merchantBusinessId?: number) {
    const qb = this.sharedCouponRepository
      .createQueryBuilder('share')
      .leftJoinAndSelect('share.shared_by', 'shared_by')
      .leftJoinAndSelect('share.coupon', 'coupon')
      .leftJoinAndSelect('share.merchant_business', 'merchant_business')
      .orderBy('share.created_at', 'DESC');

    if (couponId) {
      qb.andWhere('share.coupon_id = :couponId', { couponId });
    }
    if (merchantBusinessId) {
      qb.andWhere('share.merchant_business_id = :merchantBusinessId', { merchantBusinessId });
    }

    return qb;
  }

  private buildReactionQuery(
    type: CouponReactionType,
    filters: { couponId?: number; merchantBusinessId?: number },
  ) {
    const qb = this.userCouponReactionRepository
      .createQueryBuilder('reaction')
      .leftJoinAndSelect('reaction.user', 'user')
      .leftJoinAndSelect('reaction.coupon', 'coupon')
      .leftJoinAndSelect('coupon.merchant_business', 'merchant_business')
      .where('reaction.reaction_type = :type', { type })
      .orderBy('reaction.created_at', 'DESC');

    if (filters.couponId) {
      qb.andWhere('reaction.coupon_id = :couponId', { couponId: filters.couponId });
    }
    if (filters.merchantBusinessId) {
      qb.andWhere('coupon.merchant_business_id = :merchantBusinessId', {
        merchantBusinessId: filters.merchantBusinessId,
      });
    }

    return qb;
  }

  private mapReaction(reaction: UserCouponReaction) {
    return {
      id: reaction.id,
      user_id: reaction.user_id,
      user_name: reaction.user?.name ?? 'Unknown',
      user_email: reaction.user?.email ?? '',
      user_phone: reaction.user?.phone ?? '',
      reacted_at: reaction.created_at,
      coupon_id: reaction.coupon_id,
      coupon_code: reaction.coupon?.coupon_code ?? '',
      coupon_name: reaction.coupon?.coupon_name ?? '',
      merchant_business_name: reaction.coupon?.merchant_business?.business_name ?? '',
    };
  }

  private mapShare(share: SharedCoupon) {
    return {
      id: share.id,
      shared_by_user_id: share.shared_by_user_id,
      shared_by_name: share.shared_by?.name ?? 'Unknown',
      shared_by_email: share.shared_by?.email ?? '',
      recipient_type: share.recipient_type,
      recipient_name: share.recipient_name,
      recipient_email: share.recipient_email,
      recipient_phone: share.recipient_phone,
      shared_at: share.created_at,
      coupon_id: share.coupon_id,
      coupon_code: share.coupon_code,
      coupon_name: share.coupon?.coupon_name ?? '',
      merchant_business_name: share.merchant_business?.business_name ?? '',
      used_status: share.used_status,
    };
  }

  async updateShareUsedStatus(shareId: number, usedStatus: boolean) {
    const share = await this.sharedCouponRepository.findOne({
      where: { id: shareId },
      relations: ['shared_by', 'coupon', 'merchant_business'],
    });

    if (!share) {
      throw new NotFoundException(`Shared coupon record with ID ${shareId} not found`);
    }

    share.used_status = usedStatus;
    const saved = await this.sharedCouponRepository.save(share);

    return this.mapShare(saved);
  }
}
