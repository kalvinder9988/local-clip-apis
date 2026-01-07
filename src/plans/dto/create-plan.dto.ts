import { IsString, IsNotEmpty, IsNumber, IsBoolean, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePlanDto {
    @ApiProperty({
        description: 'Name of the plan',
        example: 'Premium Plan',
    })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiPropertyOptional({
        description: 'Detailed description of the plan',
        example: 'Access to all premium features',
    })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({
        description: 'Duration of the plan in days',
        example: 30,
    })
    @IsNumber()
    @Min(1)
    duration: number;

    @ApiProperty({
        description: 'Price amount for the plan',
        example: 99.99,
    })
    @IsNumber()
    @Min(0)
    amount: number;

    @ApiPropertyOptional({
        description: 'Status of the plan (active/inactive)',
        example: true,
        default: true,
    })
    @IsBoolean()
    @IsOptional()
    status?: boolean;

    @ApiPropertyOptional({
        description: 'Soft delete flag',
        example: false,
        default: false,
    })
    @IsBoolean()
    @IsOptional()
    deleted?: boolean;
}

