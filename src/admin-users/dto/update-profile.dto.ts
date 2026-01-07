import { IsString, IsEmail, IsOptional, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProfileDto {
    @ApiProperty({
        example: 'John Doe',
        description: 'Full name of the admin user',
        required: false,
    })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    name?: string;

    @ApiProperty({
        example: 'john@example.com',
        description: 'Email address',
        required: false,
    })
    @IsOptional()
    @IsEmail()
    email?: string;

    @ApiProperty({
        example: '+1 234-567-8900',
        description: 'Phone number',
        required: false,
    })
    @IsOptional()
    @IsString()
    @MaxLength(20)
    phone?: string;

    @ApiProperty({
        example: 'CurrentPassword123!',
        description: 'Current password (required if changing password)',
        required: false,
    })
    @IsOptional()
    @IsString()
    current_password?: string;

    @ApiProperty({
        example: 'NewPassword123!',
        description: 'New password (min 8 characters)',
        required: false,
    })
    @IsOptional()
    @IsString()
    @MinLength(8)
    new_password?: string;
}
