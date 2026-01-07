import { IsString, IsEnum, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';
import { StaticPageType } from '../entities/static-page.entity';

export class CreateStaticPageDto {
    @IsNotEmpty()
    @IsString()
    content: string;

    @IsNotEmpty()
    @IsEnum(StaticPageType)
    type: StaticPageType;

    @IsOptional()
    @IsString()
    @MaxLength(50)
    status?: string; // 'active' or 'inactive', defaults to 'active'
}
