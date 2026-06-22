import { Injectable, NotFoundException, UnauthorizedException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../users/entities/user.entity';
import { SharedCoupon } from '../../merchant-businesses/entities/shared-coupon.entity';
import {
    UserCouponReaction,
    CouponReactionType,
} from '../../merchant-businesses/entities/user-coupon-reaction.entity';
import { UserLike } from '../../merchant-businesses/entities/user-like.entity';
import { normalizePagination } from '../../common/utils/pagination.util';

@Injectable()
export class WebAccountService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(SharedCoupon)
        private readonly sharedCouponRepository: Repository<SharedCoupon>,
        @InjectRepository(UserCouponReaction)
        private readonly reactionRepository: Repository<UserCouponReaction>,
        @InjectRepository(UserLike)
        private readonly userLikeRepository: Repository<UserLike>,
    ) { }

    async getProfile(userId: number) {
        const user = await this.userRepository.findOne({
            where: { id: userId },
            select: ['id', 'name', 'email', 'phone', 'zipcode', 'created_at', 'updated_at'],
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return user;
    }

    async updateProfile(
        userId: number,
        data: { name?: string; email?: string; phone?: string; zipcode?: string },
    ) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new NotFoundException('User not found');
        }

        if (data.email && data.email !== user.email) {
            const existing = await this.userRepository.findOne({ where: { email: data.email } });
            if (existing) {
                throw new ConflictException('Email already in use');
            }
        }

        Object.assign(user, data);
        await this.userRepository.save(user);

        return this.getProfile(userId);
    }

    async changePassword(userId: number, currentPassword: string, newPassword: string) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new NotFoundException('User not found');
        }

        const match = await bcrypt.compare(currentPassword, user.password);
        if (!match) {
            throw new UnauthorizedException('Current password is incorrect');
        }

        user.password = await bcrypt.hash(newPassword, 10);
        await this.userRepository.save(user);

        return { message: 'Password updated successfully' };
    }

    async getSharedCoupons(userId: number, page = 1, limit = 10) {
        const { page: p, limit: l, skip } = normalizePagination(page, limit);

        const [shares, total] = await this.sharedCouponRepository.findAndCount({
            where: { shared_by_user_id: userId },
            relations: ['coupon', 'merchant_business'],
            order: { created_at: 'DESC' },
            skip,
            take: l,
        });

        return {
            data: shares.map((share) => ({
                id: share.id,
                coupon_id: share.coupon_id,
                coupon_code: share.coupon_code,
                coupon_name: share.coupon?.coupon_name ?? '',
                merchant_business_name: share.merchant_business?.business_name ?? '',
                merchant_slug: share.merchant_business?.slug ?? '',
                recipient_type: share.recipient_type,
                recipient_name: share.recipient_name,
                recipient_email: share.recipient_email,
                recipient_phone: share.recipient_phone,
                used_status: share.used_status,
                shared_at: share.created_at,
            })),
            total,
            page: p,
            limit: l,
        };
    }

    async getCouponReactions(userId: number, type: CouponReactionType, page = 1, limit = 10) {
        const { page: p, limit: l, skip } = normalizePagination(page, limit);

        const [reactions, total] = await this.reactionRepository.findAndCount({
            where: { user_id: userId, reaction_type: type },
            relations: ['coupon', 'coupon.merchant_business'],
            order: { created_at: 'DESC' },
            skip,
            take: l,
        });

        return {
            data: reactions.map((reaction) => ({
                id: reaction.id,
                coupon_id: reaction.coupon_id,
                coupon_code: reaction.coupon?.coupon_code ?? '',
                coupon_name: reaction.coupon?.coupon_name ?? '',
                reaction_type: reaction.reaction_type,
                merchant_business_name: reaction.coupon?.merchant_business?.business_name ?? '',
                merchant_slug: reaction.coupon?.merchant_business?.slug ?? '',
                reacted_at: reaction.created_at,
            })),
            total,
            page: p,
            limit: l,
        };
    }

    async getLikedBusinesses(userId: number, page = 1, limit = 10) {
        const { page: p, limit: l, skip } = normalizePagination(page, limit);

        const [likes, total] = await this.userLikeRepository.findAndCount({
            where: { user_id: userId },
            relations: ['merchant_business', 'merchant_business.category'],
            order: { created_at: 'DESC' },
            skip,
            take: l,
        });

        return {
            data: likes.map((like) => ({
                id: like.id,
                merchant_business_id: like.merchant_business_id,
                business_name: like.merchant_business?.business_name ?? '',
                slug: like.merchant_business?.slug ?? '',
                banner_image_url: like.merchant_business?.banner_image_url ?? '',
                category_name: like.merchant_business?.category?.name ?? '',
                liked_at: like.created_at,
            })),
            total,
            page: p,
            limit: l,
        };
    }
}
