import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, IsArray, IsEnum, IsEmail, Min, Max } from 'class-validator';

export class CreateConvenienceDto {
    @IsString()
    @IsNotEmpty()
    name: string;
}

export class CreateAssetDto {
    @IsString()
    @IsNotEmpty()
    asset_name: string;

    @IsEnum(['image', 'video', 'attachment'])
    asset_type: 'image' | 'video' | 'attachment';
}

export class CreateMerchantBusinessDto {
    // Owner Information (Step 1)
    @IsString()
    @IsNotEmpty()
    owner_name: string;

    @IsEmail()
    @IsNotEmpty()
    owner_email: string;

    @IsString()
    @IsNotEmpty()
    owner_phone: string;

    // Business Information (Step 1)
    @IsString()
    @IsNotEmpty()
    business_name: string;

    @IsString()
    @IsOptional()
    business_tagline?: string;

    @IsString()
    @IsNotEmpty()
    phone: string;

    @IsString()
    @IsOptional()
    website?: string;

    @IsString()
    @IsOptional()
    banner_image?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsNumber()
    @IsOptional()
    zipcode_id?: number;

    @IsNumber()
    @IsOptional()
    zipcode_group_id?: number;

    @IsNumber()
    @IsNotEmpty()
    category_id: number;

    @IsString()
    @IsNotEmpty()
    location: string;

    @IsNumber()
    @Min(-90)
    @Max(90)
    @IsOptional()
    lat?: number;

    @IsNumber()
    @Min(-180)
    @Max(180)
    @IsOptional()
    lng?: number;

    @IsBoolean()
    @IsOptional()
    featured_savings?: boolean;

    @IsBoolean()
    @IsOptional()
    more_great_savings?: boolean;

    @IsBoolean()
    @IsOptional()
    status?: boolean;

    // Conveniences (Step 2 - Optional)
    @IsArray()
    @IsOptional()
    convenience_ids?: number[];

    // Assets will be handled separately via file upload (Step 3 - Optional)
}
