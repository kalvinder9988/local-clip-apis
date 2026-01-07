import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
    @ApiProperty({
        example: 'CurrentPassword123!',
        description: 'Current password for verification',
    })
    @IsString()
    current_password: string;

    @ApiProperty({
        example: 'NewPassword123!',
        description: 'New password (minimum 8 characters)',
    })
    @IsString()
    @MinLength(8, { message: 'New password must be at least 8 characters long' })
    new_password: string;
}
