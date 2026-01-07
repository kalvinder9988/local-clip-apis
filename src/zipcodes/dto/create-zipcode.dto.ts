import { IsString, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateZipcodeDto {
    @ApiProperty({
        description: 'Zipcode value',
        example: '90210',
    })
    @IsString()
    @IsNotEmpty()
    zipcode: string;

    @ApiProperty({
        description: 'Location name',
        example: 'Beverly Hills, CA',
    })
    @IsString()
    @IsNotEmpty()
    location: string;

    @ApiPropertyOptional({
        description: 'Status of the zipcode (active/inactive)',
        example: true,
        default: true,
    })
    @IsBoolean()
    @IsOptional()
    status?: boolean;
}
