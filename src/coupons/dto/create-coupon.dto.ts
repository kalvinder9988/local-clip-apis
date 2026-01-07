import { IsString, IsInt, IsEnum, IsNumber, IsOptional, IsBoolean, IsDateString, Min, MaxLength } from 'class-validator';

export class CreateCouponDto {
    @IsInt()
    merchant_business_id: number;

    @IsString()
    @MaxLength(255)
    coupon_name: string;

    @IsString()
    @MaxLength(100)
    coupon_code: string;

    @IsEnum(['flat', 'percentage'])
    type: 'flat' | 'percentage';

    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0)
    coupon_value: number;

    @IsString()
    @IsOptional()
    description?: string;

    @IsInt()
    @IsOptional()
    @Min(0)
    total_likes?: number;

    @IsInt()
    @IsOptional()
    @Min(0)
    total_dislikes?: number;

    @IsInt()
    @IsOptional()
    @Min(0)
    total_shared?: number;

    @IsDateString()
    valid_from: string;

    @IsDateString()
    valid_to: string;

    @IsBoolean()
    @IsOptional()
    status?: boolean;
}
