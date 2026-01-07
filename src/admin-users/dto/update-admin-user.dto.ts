import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateAdminUserDto } from './create-admin-user.dto';
import { IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// Exclude password from required fields when updating
export class UpdateAdminUserDto extends PartialType(OmitType(CreateAdminUserDto, ['password'] as const)) {
    @ApiProperty({
        example: 'NewSecurePass123!',
        description: 'New password (optional, min 8 characters)',
        required: false
    })
    @IsOptional()
    @IsString()
    @MinLength(8)
    password?: string;
}
