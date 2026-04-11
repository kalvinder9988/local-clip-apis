import { ApiProperty } from '@nestjs/swagger';

export class ZipcodeInGroupDto {
    @ApiProperty() id: number;
    @ApiProperty() zipcode: string;
    @ApiProperty() location: string;
    @ApiProperty() status: boolean;
    @ApiProperty() created_at: Date;
    @ApiProperty() updated_at: Date;
}

export class ZipcodeGroupResponseDto {
    @ApiProperty({ description: 'Group ID' }) id: number;
    @ApiProperty({ description: 'Group name' }) name: string;
    @ApiProperty({ description: 'Status' }) status: boolean;
    @ApiProperty({ description: 'Soft delete flag' }) deleted: boolean;
    @ApiProperty({ type: [ZipcodeInGroupDto] }) zipcodes: ZipcodeInGroupDto[];
    @ApiProperty() created_at: Date;
    @ApiProperty() updated_at: Date;
}
