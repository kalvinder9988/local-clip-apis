import { ApiProperty } from '@nestjs/swagger';
import { AdminRole } from '../entities/admin-user.entity';

export class LoginResponseDto {
    @ApiProperty({
        description: 'JWT access token for authentication',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    })
    access_token: string;

    @ApiProperty({
        description: 'Admin user information',
        example: {
            id: 1,
            name: 'Admin User',
            email: 'admin@localclip.com',
            role: 'admin',
        },
    })
    user: {
        id: number;
        name: string;
        email: string;
        role: AdminRole;
        phone: string;
    };
}
