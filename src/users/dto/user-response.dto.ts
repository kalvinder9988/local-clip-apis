import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';

export class UserResponseDto {
    @ApiProperty({ example: 1, description: 'The unique identifier of the user' })
    id: number;

    @ApiProperty({ example: 'John Doe', description: 'The name of the user' })
    name: string;

    @ApiProperty({ example: 'john.doe@example.com', description: 'The email address of the user' })
    email: string;

    @Exclude()
    password: string;

    @ApiProperty({ example: '12345', description: 'The zip code of the user' })
    zipcode: string;

    @ApiProperty({ example: '+1234567890', description: 'The phone number of the user' })
    phone: string;

    @ApiProperty({ example: '2024-12-24T10:00:00Z', description: 'The timestamp when the user was created' })
    created_at: Date;

    @ApiProperty({ example: '2024-12-24T10:00:00Z', description: 'The timestamp when the user was last updated' })
    updated_at: Date;

    constructor(partial: Partial<UserResponseDto>) {
        Object.assign(this, partial);
    }
}
