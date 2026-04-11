import { IsString, IsNotEmpty, IsBoolean, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ZipcodeItemDto {
    @ApiProperty({ description: 'Zipcode value', example: '90210' })
    @IsString()
    @IsNotEmpty()
    zipcode: string;

    @ApiProperty({ description: 'Location name', example: 'Beverly Hills, CA' })
    @IsString()
    @IsNotEmpty()
    location: string;
}

export class CreateZipcodeGroupDto {
    @ApiProperty({ description: 'Group name', example: 'Los Angeles Area' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiPropertyOptional({ description: 'Status', example: true, default: true })
    @IsBoolean()
    @IsOptional()
    status?: boolean;

    @ApiProperty({ description: 'List of zipcodes in this group', type: [ZipcodeItemDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ZipcodeItemDto)
    zipcodes: ZipcodeItemDto[];
}
