import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PlanResponseDto {
    @ApiProperty({ description: 'Plan ID', example: 1 })
    id: number;

    @ApiProperty({ description: 'Plan name', example: 'Premium Plan' })
    name: string;

    @ApiPropertyOptional({
        description: 'Plan description',
        example: 'Access to all premium features',
    })
    description?: string;

    @ApiProperty({ description: 'Duration in days', example: 30 })
    duration: number;

    @ApiProperty({ description: 'Plan amount', example: 99.99 })
    amount: number;

    @ApiProperty({ description: 'Plan status', example: true })
    status: boolean;

    @ApiProperty({ description: 'Soft delete flag', example: false })
    deleted: boolean;

    @ApiProperty({ description: 'Created timestamp' })
    created_at: Date;

    @ApiProperty({ description: 'Updated timestamp' })
    updated_at: Date;
}
