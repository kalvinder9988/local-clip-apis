import { ApiProperty } from '@nestjs/swagger';

export class CategoryResponseDto {
    @ApiProperty({ description: 'Category ID', example: 1 })
    id: number;

    @ApiProperty({ description: 'Category name', example: 'Food & Dining' })
    name: string;

    @ApiProperty({ description: 'Category status', example: true })
    status: boolean;

    @ApiProperty({ description: 'Created timestamp' })
    created_at: Date;

    @ApiProperty({ description: 'Updated timestamp' })
    updated_at: Date;
}
