import { ApiProperty } from '@nestjs/swagger';

export class ZipcodeResponseDto {
    @ApiProperty({ description: 'Zipcode ID', example: 1 })
    id: number;

    @ApiProperty({ description: 'Zipcode value', example: '90210' })
    zipcode: string;

    @ApiProperty({ description: 'Location name', example: 'Beverly Hills, CA' })
    location: string;

    @ApiProperty({ description: 'Zipcode status', example: true })
    status: boolean;

    @ApiProperty({ description: 'Soft delete flag', example: false })
    deleted: boolean;

    @ApiProperty({ description: 'Created timestamp' })
    created_at: Date;

    @ApiProperty({ description: 'Updated timestamp' })
    updated_at: Date;
}
