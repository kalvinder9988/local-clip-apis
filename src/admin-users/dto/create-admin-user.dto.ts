import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsEnum, IsString, MinLength, IsOptional, Matches } from 'class-validator';
import { AdminRole } from '../entities/admin-user.entity';

export class CreateAdminUserDto {
    @ApiProperty({ example: 'John Doe', description: 'Full name of the admin user' })
    @IsNotEmpty()
    @IsString()
    name: string;

    @ApiProperty({ example: 'admin@example.com', description: 'Email address' })
    @IsNotEmpty()
    @IsEmail()
    email: string;

    @ApiProperty({ example: 'SecurePass123!', description: 'Password (min 8 characters)' })
    @IsNotEmpty()
    @IsString()
    @MinLength(8)
    password: string;

    @ApiProperty({ example: '1234567890', description: 'Phone number (10 digits)' })
    @IsNotEmpty()
    @IsString()
    @Matches(/^\d{10}$/, { message: 'Phone must be a 10-digit number' })
    phone: string;

    @ApiProperty({
        enum: AdminRole,
        example: AdminRole.ADMIN,
        description: 'Role of the admin user',
        default: AdminRole.ADMIN
    })
    @IsOptional()
    @IsEnum(AdminRole)
    role?: AdminRole;
}
