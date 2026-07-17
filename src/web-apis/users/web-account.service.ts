import {
    Injectable,
    NotFoundException,
    UnauthorizedException,
    ConflictException,
    BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { User } from '../../users/entities/user.entity';
import { SharedCoupon } from '../../merchant-businesses/entities/shared-coupon.entity';
import {
    UserCouponReaction,
    CouponReactionType,
} from '../../merchant-businesses/entities/user-coupon-reaction.entity';
import { UserLike } from '../../merchant-businesses/entities/user-like.entity';
import { normalizePagination } from '../../common/utils/pagination.util';
import { MailService } from '../../mail/mail.service';

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
        private readonly mailService: MailService,
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

    /**
     * Generate a temporary password, save it, and email it to the user.
     * Always returns a generic success message when the email is unknown.
     */
    async forgotPassword(email: string, language: 'en' | 'es' = 'en') {
        const normalizedEmail = email.trim();
        const user = await this.userRepository.findOne({ where: { email: normalizedEmail } });

        const genericMessage =
            language === 'es'
                ? 'Si existe una cuenta con este correo, te enviamos una nueva contraseña.'
                : 'If an account exists for this email, a new password has been sent.';

        if (!user) {
            return { message: genericMessage };
        }

        const temporaryPassword = this.generateTemporaryPassword();
        const previousPasswordHash = user.password;
        user.password = await bcrypt.hash(temporaryPassword, 10);
        await this.userRepository.save(user);

        const sent = await this.mailService.sendForgotPasswordEmail({
            to: user.email,
            recipientName: user.name,
            temporaryPassword,
            language,
        });

        if (!sent) {
            user.password = previousPasswordHash;
            await this.userRepository.save(user);
            throw new BadRequestException(
                language === 'es'
                    ? 'No se pudo enviar el correo. Inténtalo de nuevo más tarde.'
                    : 'Unable to send email right now. Please try again later.',
            );
        }

        return { message: genericMessage };
    }

    private generateTemporaryPassword(length = 8): string {
        const bytes = randomBytes(length);
        let password = '';
        for (let i = 0; i < length; i++) {
            password += String(bytes[i] % 10);
        }
        // Avoid leading zeros looking like a truncated code
        if (password[0] === '0') {
            password = `1${password.slice(1)}`;
        }
        return password;
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
