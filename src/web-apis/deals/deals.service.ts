import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Not } from 'typeorm';
import { MerchantBusiness } from '../../merchant-businesses/entities/merchant-business.entity';
import { UserLike } from '../../merchant-businesses/entities/user-like.entity';
import { UserCouponHistory } from '../../merchant-businesses/entities/user-coupon-history.entity';
import { SharedCoupon, SharedCouponRecipient } from '../../merchant-businesses/entities/shared-coupon.entity';
import { UserCouponReaction, CouponReactionType } from '../../merchant-businesses/entities/user-coupon-reaction.entity';
import { Coupon } from '../../coupons/entities/coupon.entity';
import { Review } from '../../merchant-businesses/entities/review.entity';
import { MerchantQuestion, QuestionStatus } from '../../merchant-businesses/entities/merchant-question.entity';
import { MailService } from '../../mail/mail.service';

@Injectable()
export class DealsService {
    constructor(
        @InjectRepository(MerchantBusiness)
        private readonly merchantBusinessRepository: Repository<MerchantBusiness>,
        @InjectRepository(UserLike)
        private readonly userLikeRepository: Repository<UserLike>,
        @InjectRepository(UserCouponHistory)
        private readonly couponHistoryRepository: Repository<UserCouponHistory>,
        @InjectRepository(Coupon)
        private readonly couponRepository: Repository<Coupon>,
        @InjectRepository(SharedCoupon)
        private readonly sharedCouponRepository: Repository<SharedCoupon>,
        @InjectRepository(UserCouponReaction)
        private readonly userCouponReactionRepository: Repository<UserCouponReaction>,
        @InjectRepository(Review)
        private readonly reviewRepository: Repository<Review>,
        @InjectRepository(MerchantQuestion)
        private readonly questionRepository: Repository<MerchantQuestion>,
        private readonly mailService: MailService,
    ) { }

    /**
     * Fetch a single active deal by numeric ID or slug.
     * Includes category, zipcode, conveniences, and media assets.
     */
    async findByIdOrSlug(idOrSlug: string): Promise<MerchantBusiness> {
        const isNumeric = /^\d+$/.test(idOrSlug);

        const queryBuilder = this.merchantBusinessRepository
            .createQueryBuilder('mb')
            .leftJoinAndSelect('mb.category', 'category')
            .leftJoinAndSelect('mb.zipcode', 'zipcode')
            .leftJoinAndSelect('mb.merchant_convenience', 'mc')
            .leftJoinAndSelect('mc.convenience', 'convenience')
            .leftJoinAndSelect('mb.assets', 'assets')
            .leftJoinAndSelect('mb.reviews', 'reviews', 'reviews.published = :published', { published: true })
            .leftJoinAndSelect('reviews.user', 'reviewUser')
            .leftJoinAndSelect('mb.coupons', 'coupons', 'coupons.status = :couponStatus', { couponStatus: true })
            .where('mb.status = :status', { status: true })
            .andWhere('mb.deleted = :deleted', { deleted: false });

        if (isNumeric) {
            queryBuilder.andWhere('mb.id = :id', { id: parseInt(idOrSlug, 10) });
        } else {
            queryBuilder.andWhere('mb.slug = :slug', { slug: idOrSlug });
        }

        const deal = await queryBuilder.getOne();

        if (!deal) {
            throw new NotFoundException(`Deal "${idOrSlug}" not found`);
        }

        return deal;
    }

    /**
     * Like a deal. Saves history record and increments total_likes.
     * Prevents duplicate likes from the same user.
     */
    async likeDeal(userId: number, merchantBusinessId: number): Promise<{ total_likes: number; already_liked: boolean }> {
        const business = await this.merchantBusinessRepository.findOne({ where: { id: merchantBusinessId } });
        if (!business) {
            throw new NotFoundException(`Deal with ID ${merchantBusinessId} not found`);
        }

        const existing = await this.userLikeRepository.findOne({
            where: { user_id: userId, merchant_business_id: merchantBusinessId },
        });

        if (existing) {
            return { total_likes: Number(business.total_likes), already_liked: true };
        }

        await this.userLikeRepository.save(
            this.userLikeRepository.create({ user_id: userId, merchant_business_id: merchantBusinessId }),
        );

        await this.merchantBusinessRepository.increment({ id: merchantBusinessId }, 'total_likes', 1);

        return { total_likes: Number(business.total_likes) + 1, already_liked: false };
    }

    /**
     * Get coupon code for a logged-in user:
     * - records copy history
     * - saves a shared_coupons row (recipient_type = me)
     * - emails the coupon code to the user
     */
    async recordCouponCopy(
        userId: number,
        couponId: number,
        recipientEmail: string,
        recipientName?: string,
        recipientPhone?: string,
        lang: 'en' | 'es' = 'en',
    ): Promise<{
        coupon_code: string;
        coupon_name: string;
        email_sent: boolean;
        total_shared: number;
    }> {
        if (!recipientEmail?.trim()) {
            throw new BadRequestException('Email is required to get the coupon code');
        }

        const coupon = await this.couponRepository.findOne({
            where: { id: couponId },
            relations: ['merchant_business'],
        });

        if (!coupon) {
            throw new NotFoundException(`Coupon with ID ${couponId} not found`);
        }

        await this.couponHistoryRepository.save(
            this.couponHistoryRepository.create({
                user_id: userId,
                merchant_business_id: coupon.merchant_business_id,
                coupon_id: coupon.id,
                coupon_code: coupon.coupon_code,
            }),
        );

        await this.sharedCouponRepository.save(
            this.sharedCouponRepository.create({
                shared_by_user_id: userId,
                coupon_id: coupon.id,
                merchant_business_id: coupon.merchant_business_id,
                coupon_code: coupon.coupon_code,
                recipient_type: 'me',
                recipient_email: recipientEmail.trim(),
                recipient_name: recipientName?.trim() || null,
                recipient_phone: recipientPhone?.trim() || null,
            }),
        );

        await this.couponRepository.increment({ id: coupon.id }, 'total_shared', 1);

        const emailSent = await this.mailService.sendCouponCodeEmail({
            to: recipientEmail.trim(),
            recipientName: recipientName,
            couponCode: coupon.coupon_code,
            couponName: coupon.coupon_name,
            businessName: coupon.merchant_business?.business_name,
            couponImageUrl: coupon.coupon_image_url,
            offerType: coupon.type,
            offerValue: coupon.coupon_value,
            description: coupon.description,
            validFrom: coupon.valid_from,
            validTo: coupon.valid_to,
            language: lang,
        });

        return {
            coupon_code: coupon.coupon_code,
            coupon_name: coupon.coupon_name,
            email_sent: emailSent,
            total_shared: Number(coupon.total_shared) + 1,
        };
    }

    /**
     * Share a coupon — saves a record to shared_coupons and emails the recipient.
     */
    async shareCoupon(
        userId: number,
        couponId: number,
        recipientType: SharedCouponRecipient,
        recipientEmail: string,
        recipientName?: string,
        recipientPhone?: string,
        lang: 'en' | 'es' = 'en',
    ): Promise<SharedCoupon & { total_shared: number; email_sent: boolean }> {
        if (!recipientEmail?.trim()) {
            throw new BadRequestException('Recipient email is required');
        }

        const coupon = await this.couponRepository.findOne({
            where: { id: couponId },
            relations: ['merchant_business'],
        });
        if (!coupon) {
            throw new NotFoundException(`Coupon with ID ${couponId} not found`);
        }

        const record = await this.sharedCouponRepository.save(
            this.sharedCouponRepository.create({
                shared_by_user_id: userId,
                coupon_id: coupon.id,
                merchant_business_id: coupon.merchant_business_id,
                coupon_code: coupon.coupon_code,
                recipient_type: recipientType,
                recipient_email: recipientEmail.trim(),
                recipient_name: recipientName?.trim() || null,
                recipient_phone: recipientPhone?.trim() || null,
            }),
        );

        await this.couponRepository.increment({ id: coupon.id }, 'total_shared', 1);

        const emailSent = await this.mailService.sendCouponCodeEmail({
            to: recipientEmail.trim(),
            recipientName: recipientName,
            couponCode: coupon.coupon_code,
            couponName: coupon.coupon_name,
            businessName: coupon.merchant_business?.business_name,
            couponImageUrl: coupon.coupon_image_url,
            offerType: coupon.type,
            offerValue: coupon.coupon_value,
            description: coupon.description,
            validFrom: coupon.valid_from,
            validTo: coupon.valid_to,
            language: lang,
        });

        return {
            ...record,
            total_shared: Number(coupon.total_shared) + 1,
            email_sent: emailSent,
        };
    }

    /**
     * Like a coupon — one reaction per user; switches from dislike if needed.
     */
    async likeCoupon(
        userId: number,
        couponId: number,
    ): Promise<{
        total_likes: number;
        total_dislikes: number;
        user_reaction: CouponReactionType;
        already_reacted: boolean;
    }> {
        const coupon = await this.couponRepository.findOne({ where: { id: couponId } });
        if (!coupon) {
            throw new NotFoundException(`Coupon with ID ${couponId} not found`);
        }

        const existing = await this.userCouponReactionRepository.findOne({
            where: { user_id: userId, coupon_id: couponId },
        });

        if (existing?.reaction_type === CouponReactionType.LIKE) {
            return {
                total_likes: Number(coupon.total_likes),
                total_dislikes: Number(coupon.total_dislikes),
                user_reaction: CouponReactionType.LIKE,
                already_reacted: true,
            };
        }

        if (existing?.reaction_type === CouponReactionType.DISLIKE) {
            existing.reaction_type = CouponReactionType.LIKE;
            await this.userCouponReactionRepository.save(existing);
            if (Number(coupon.total_dislikes) > 0) {
                await this.couponRepository.decrement({ id: couponId }, 'total_dislikes', 1);
            }
            await this.couponRepository.increment({ id: couponId }, 'total_likes', 1);
        } else {
            await this.userCouponReactionRepository.save(
                this.userCouponReactionRepository.create({
                    user_id: userId,
                    coupon_id: couponId,
                    reaction_type: CouponReactionType.LIKE,
                }),
            );
            await this.couponRepository.increment({ id: couponId }, 'total_likes', 1);
        }

        const updated = await this.couponRepository.findOne({ where: { id: couponId } });

        return {
            total_likes: Number(updated?.total_likes ?? 0),
            total_dislikes: Number(updated?.total_dislikes ?? 0),
            user_reaction: CouponReactionType.LIKE,
            already_reacted: false,
        };
    }

    /**
     * Dislike a coupon — one reaction per user; switches from like if needed.
     */
    async dislikeCoupon(
        userId: number,
        couponId: number,
    ): Promise<{
        total_likes: number;
        total_dislikes: number;
        user_reaction: CouponReactionType;
        already_reacted: boolean;
    }> {
        const coupon = await this.couponRepository.findOne({ where: { id: couponId } });
        if (!coupon) {
            throw new NotFoundException(`Coupon with ID ${couponId} not found`);
        }

        const existing = await this.userCouponReactionRepository.findOne({
            where: { user_id: userId, coupon_id: couponId },
        });

        if (existing?.reaction_type === CouponReactionType.DISLIKE) {
            return {
                total_likes: Number(coupon.total_likes),
                total_dislikes: Number(coupon.total_dislikes),
                user_reaction: CouponReactionType.DISLIKE,
                already_reacted: true,
            };
        }

        if (existing?.reaction_type === CouponReactionType.LIKE) {
            existing.reaction_type = CouponReactionType.DISLIKE;
            await this.userCouponReactionRepository.save(existing);
            if (Number(coupon.total_likes) > 0) {
                await this.couponRepository.decrement({ id: couponId }, 'total_likes', 1);
            }
            await this.couponRepository.increment({ id: couponId }, 'total_dislikes', 1);
        } else {
            await this.userCouponReactionRepository.save(
                this.userCouponReactionRepository.create({
                    user_id: userId,
                    coupon_id: couponId,
                    reaction_type: CouponReactionType.DISLIKE,
                }),
            );
            await this.couponRepository.increment({ id: couponId }, 'total_dislikes', 1);
        }

        const updated = await this.couponRepository.findOne({ where: { id: couponId } });

        return {
            total_likes: Number(updated?.total_likes ?? 0),
            total_dislikes: Number(updated?.total_dislikes ?? 0),
            user_reaction: CouponReactionType.DISLIKE,
            already_reacted: false,
        };
    }

    /**
     * Get the logged-in user's coupon reactions for a merchant business.
     */
    async getUserCouponReactions(
        userId: number,
        merchantBusinessId: number,
    ): Promise<Record<number, CouponReactionType>> {
        const reactions = await this.userCouponReactionRepository
            .createQueryBuilder('reaction')
            .innerJoin('reaction.coupon', 'coupon')
            .where('reaction.user_id = :userId', { userId })
            .andWhere('coupon.merchant_business_id = :merchantBusinessId', { merchantBusinessId })
            .getMany();

        return reactions.reduce<Record<number, CouponReactionType>>((acc, reaction) => {
            acc[reaction.coupon_id] = reaction.reaction_type;
            return acc;
        }, {});
    }

    /**
     * Submit a review for a deal (logged-in users only).
     */
    async submitReview(
        userId: number,
        merchantBusinessId: number,
        rating: number,
        reviewText: string,
    ): Promise<Review> {
        const business = await this.merchantBusinessRepository.findOne({ where: { id: merchantBusinessId } });
        if (!business) {
            throw new NotFoundException(`Deal with ID ${merchantBusinessId} not found`);
        }

        const record = this.reviewRepository.create({
            merchant_business_id: merchantBusinessId,
            user_id: userId,
            rating,
            review: reviewText,
        });

        return this.reviewRepository.save(record);
    }

    /**
     * Submit a question for a deal (logged-in users only).
     */
    async submitQuestion(
        userId: number,
        merchantBusinessId: number,
        questionText: string,
    ): Promise<MerchantQuestion> {
        const business = await this.merchantBusinessRepository.findOne({ where: { id: merchantBusinessId } });
        if (!business) {
            throw new NotFoundException(`Deal with ID ${merchantBusinessId} not found`);
        }

        const record = this.questionRepository.create({
            merchant_business_id: merchantBusinessId,
            user_id: userId,
            question: questionText,
            answer: null,
            status: QuestionStatus.PENDING,
        });

        return this.questionRepository.save(record);
    }

    /**
     * Get only answered questions for a deal (public).
     */
    async getAnsweredQuestions(merchantBusinessId: number): Promise<MerchantQuestion[]> {
        return this.questionRepository.find({
            where: {
                merchant_business_id: merchantBusinessId,
                status: QuestionStatus.ANSWERED,
                answer: Not(IsNull()),
            },
            relations: ['user'],
            order: { created_at: 'DESC' },
        });
    }
}

