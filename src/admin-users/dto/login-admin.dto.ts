import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginAdminDto {
    @ApiProperty({
        description: 'The email address of the admin user',
        example: 'admin@localclip.com',
    })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({
        description: 'The password for the admin account',
        example: 'localclip@123',
    })
    @IsString()
    @IsNotEmpty()
    @MinLength(6)
    password: string;
}
