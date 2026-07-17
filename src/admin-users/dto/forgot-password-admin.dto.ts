import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordAdminDto {
  @ApiProperty({ example: 'merchant@localclip.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
