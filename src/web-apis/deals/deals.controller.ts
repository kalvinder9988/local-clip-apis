import { Controller, Get, Post, Param, Req, UseGuards, Body } from '@nestjs/common';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { DealsService } from './deals.service';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SharedCouponRecipient } from '../../merchant-businesses/entities/shared-coupon.entity';

class SubmitQuestionDto {
    @IsNotEmpty()
    @IsString()
    question: string;
}

class ShareCouponDto {
    @IsNotEmpty()
    coupon_id: number;

    @IsEnum(['me', 'other'])
    recipient_type: SharedCouponRecipient;

    @IsEmail()
    recipient_email: string;

    @IsOptional()
    @IsString()
    recipient_name?: string;

    @IsOptional()
    @IsString()
    recipient_phone?: string;
}

class SubmitReviewDto {
    @IsNotEmpty()
    merchant_business_id: number;

    @IsNotEmpty()
    rating: number;

    @IsNotEmpty()
    @IsString()
    review: string;
}

@Controller('web/deals')
export class DealsController {
    constructor(private readonly dealsService: DealsService) { }

    /**
     * GET /web/deals/:idOrSlug — public
     */
    @Public()
    @Get(':idOrSlug')
    findOne(@Param('idOrSlug') idOrSlug: string) {
        return this.dealsService.findByIdOrSlug(idOrSlug);
    }

    /**
     * POST /web/deals/:id/like — requires user JWT
     */
    @UseGuards(JwtAuthGuard)
    @Post(':id/like')
    like(@Param('id') id: string, @Req() req: any) {
        const userId: number = req.user.userId;
        return this.dealsService.likeDeal(userId, parseInt(id, 10));
    }

    /**
     * POST /web/deals/coupon-copy — requires user JWT
     * Body: { coupon_id: number }
     */
    @UseGuards(JwtAuthGuard)
    @Post('coupon-copy')
    recordCouponCopy(@Body('coupon_id') couponId: number, @Req() req: any) {
        const userId: number = req.user.userId;
        return this.dealsService.recordCouponCopy(userId, Number(couponId));
    }

    /**
     * POST /web/deals/coupon-share — requires user JWT
     */
    @UseGuards(JwtAuthGuard)
    @Post('coupon-share')
    shareCoupon(@Body() body: ShareCouponDto, @Req() req: any) {
        const userId: number = req.user.userId;
        return this.dealsService.shareCoupon(
            userId,
            Number(body.coupon_id),
            body.recipient_type,
            body.recipient_email,
            body.recipient_name,
            body.recipient_phone,
        );
    }

    /**
     * POST /web/deals/review — requires user JWT
     */
    @UseGuards(JwtAuthGuard)
    @Post('review')
    submitReview(@Body() body: SubmitReviewDto, @Req() req: any) {
        const userId: number = req.user.userId;
        return this.dealsService.submitReview(
            userId,
            Number(body.merchant_business_id),
            Number(body.rating),
            body.review,
        );
    }

    /**
     * POST /web/deals/:id/question — requires user JWT
     */
    @UseGuards(JwtAuthGuard)
    @Post(':id/question')
    submitQuestion(@Param('id') id: string, @Body() body: SubmitQuestionDto, @Req() req: any) {
        const userId: number = req.user.userId;
        return this.dealsService.submitQuestion(userId, parseInt(id, 10), body.question);
    }

    /**
     * GET /web/deals/:id/questions — public, returns only answered questions
     */
    @Public()
    @Get(':id/questions')
    getAnsweredQuestions(@Param('id') id: string) {
        return this.dealsService.getAnsweredQuestions(parseInt(id, 10));
    }
}

