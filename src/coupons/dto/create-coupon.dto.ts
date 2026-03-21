import { IsString, IsInt, IsEnum, IsNumber, IsOptional, IsBoolean, IsDateString, Min, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateCouponDto {
    @Transform(({ value }) => parseInt(value, 10))
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

    @Transform(({ value }) => parseFloat(value))
    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0)
    coupon_value: number;

    @IsString()
    @IsOptional()
    description?: string;

    @Transform(({ value }) => value !== undefined ? parseInt(value, 10) : undefined)
    @IsInt()
    @IsOptional()
    @Min(0)
    total_likes?: number;

    @Transform(({ value }) => value !== undefined ? parseInt(value, 10) : undefined)
    @IsInt()
    @IsOptional()
    @Min(0)
    total_dislikes?: number;

    @Transform(({ value }) => value !== undefined ? parseInt(value, 10) : undefined)
    @IsInt()
    @IsOptional()
    @Min(0)
    total_shared?: number;

    @IsDateString()
    valid_from: string;

    @IsDateString()
    valid_to: string;

    @Transform(({ value }) => value === 'true' || value === true)
    @IsBoolean()
    @IsOptional()
    status?: boolean;
}
