import { IsString, IsInt, IsBoolean, IsOptional, Min } from 'class-validator';

export class CreateBannerDto {
    @IsOptional()
    @IsString()
    banner_image?: string;

    @IsOptional()
    @IsString()
    caption?: string;

    @IsOptional()
    @IsInt()
    @Min(0)
    display_order?: number;

    @IsOptional()
    @IsBoolean()
    status?: boolean;
}
