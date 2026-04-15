import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Not } from 'typeorm';
import { MerchantBusiness } from '../../merchant-businesses/entities/merchant-business.entity';
import { UserLike } from '../../merchant-businesses/entities/user-like.entity';
import { UserCouponHistory } from '../../merchant-businesses/entities/user-coupon-history.entity';
import { SharedCoupon, SharedCouponRecipient } from '../../merchant-businesses/entities/shared-coupon.entity';
import { Coupon } from '../../coupons/entities/coupon.entity';
import { Review } from '../../merchant-businesses/entities/review.entity';
import { MerchantQuestion, QuestionStatus } from '../../merchant-businesses/entities/merchant-question.entity';

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
        @InjectRepository(Review)
        private readonly reviewRepository: Repository<Review>,
        @InjectRepository(MerchantQuestion)
        private readonly questionRepository: Repository<MerchantQuestion>,
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
     * Record a coupon copy event for a logged-in user.
     */
    async recordCouponCopy(userId: number, couponId: number): Promise<UserCouponHistory> {
        const coupon = await this.couponRepository.findOne({
            where: { id: couponId },
            relations: ['merchant_business'],
        });

        if (!coupon) {
            throw new NotFoundException(`Coupon with ID ${couponId} not found`);
        }

        const record = this.couponHistoryRepository.create({
            user_id: userId,
            merchant_business_id: coupon.merchant_business_id,
            coupon_id: coupon.id,
            coupon_code: coupon.coupon_code,
        });

        return this.couponHistoryRepository.save(record);
    }

    /**
     * Share a coupon — saves a record to shared_coupons.
     */
    async shareCoupon(
        userId: number,
        couponId: number,
        recipientType: SharedCouponRecipient,
        recipientEmail: string,
        recipientName?: string,
        recipientPhone?: string,
    ): Promise<SharedCoupon> {
        const coupon = await this.couponRepository.findOne({
            where: { id: couponId },
            relations: ['merchant_business'],
        });
        if (!coupon) {
            throw new NotFoundException(`Coupon with ID ${couponId} not found`);
        }

        const record = this.sharedCouponRepository.create({
            shared_by_user_id: userId,
            coupon_id: coupon.id,
            merchant_business_id: coupon.merchant_business_id,
            coupon_code: coupon.coupon_code,
            recipient_type: recipientType,
            recipient_email: recipientEmail,
            recipient_name: recipientName || null,
            recipient_phone: recipientPhone || null,
        });

        return this.sharedCouponRepository.save(record);
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

