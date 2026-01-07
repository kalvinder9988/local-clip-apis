import { PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';
import { IsString, IsEmail, IsOptional, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto extends PartialType(CreateUserDto) {
    @ApiPropertyOptional({
        description: 'The name of the user',
        example: 'John Doe',
        minLength: 2,
        maxLength: 100,
    })
    @IsOptional()
    @IsString()
    @MinLength(2)
    @MaxLength(100)
    name?: string;

    @ApiPropertyOptional({
        description: 'The email address of the user',
        example: 'john.doe@example.com',
    })
    @IsOptional()
    @IsEmail()
    @MaxLength(100)
    email?: string;

    @ApiPropertyOptional({
        description: 'The password for the user account (min 8 characters)',
        example: 'SecurePass123!',
        minLength: 8,
        maxLength: 255,
    })
    @IsOptional()
    @IsString()
    @MinLength(8)
    @MaxLength(255)
    password?: string;

    @ApiPropertyOptional({
        description: 'The zip code of the user',
        example: '12345',
        minLength: 5,
        maxLength: 10,
    })
    @IsOptional()
    @IsString()
    @Matches(/^[0-9]{5}(-[0-9]{4})?$/, {
        message: 'Zipcode must be a valid US zip code (e.g., 12345 or 12345-6789)',
    })
    zipcode?: string;

    @ApiPropertyOptional({
        description: 'The phone number of the user',
        example: '+1234567890',
        minLength: 10,
        maxLength: 20,
    })
    @IsOptional()
    @IsString()
    @MinLength(10)
    @MaxLength(20)
    @Matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/, {
        message: 'Phone must be a valid phone number',
    })
    phone?: string;
}

