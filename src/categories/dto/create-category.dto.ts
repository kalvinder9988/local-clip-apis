import { IsString, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCategoryDto {
    @ApiProperty({
        description: 'Name of the category',
        example: 'Food & Dining',
    })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiPropertyOptional({
        description: 'Status of the category (active/inactive)',
        example: true,
        default: true,
    })
    @IsBoolean()
    @IsOptional()
    status?: boolean;
}

