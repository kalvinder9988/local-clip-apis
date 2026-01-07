import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateConvenienceDto {
    @ApiProperty({ example: 'Free WiFi' })
    @IsString()
    @IsNotEmpty()
    name: string;
}
