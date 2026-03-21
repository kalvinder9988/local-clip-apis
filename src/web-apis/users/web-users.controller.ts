import {
    Controller,
    Post,
    Body,
    HttpCode,
    HttpStatus,
    UnauthorizedException,
    ConflictException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength, MaxLength, Matches, IsOptional } from 'class-validator';
import { Public } from '../../common/decorators/public.decorator';
import { UsersService } from '../../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

class WebRegisterDto {
    @IsString()
    @IsNotEmpty()
    @MinLength(2)
    @MaxLength(100)
    name: string;

    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(8)
    password: string;

    @IsString()
    @IsNotEmpty()
    phone: string;

    @IsString()
    @IsNotEmpty()
    zipcode: string;
}

class WebLoginDto {
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    password: string;
}

@ApiTags('Web - Users')
@Public()
@Controller('web/users')
export class WebUsersController {
    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
    ) { }

    @Post('register')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Register a new web user' })
    @ApiBody({ type: WebRegisterDto })
    @ApiResponse({ status: 201, description: 'User registered successfully' })
    @ApiResponse({ status: 409, description: 'Email already exists' })
    async register(@Body() dto: WebRegisterDto) {
        const user = await this.usersService.create({
            name: dto.name,
            email: dto.email,
            password: dto.password,
            phone: dto.phone,
            zipcode: dto.zipcode,
        });
        return { message: 'Registration successful', user };
    }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Sign in a web user' })
    @ApiBody({ type: WebLoginDto })
    @ApiResponse({ status: 200, description: 'Login successful' })
    @ApiResponse({ status: 401, description: 'Invalid credentials' })
    async login(@Body() dto: WebLoginDto) {
        const user = await this.usersService.findByEmail(dto.email);

        if (!user) {
            throw new UnauthorizedException('Invalid email or password');
        }

        const passwordMatch = await bcrypt.compare(dto.password, user.password);
        if (!passwordMatch) {
            throw new UnauthorizedException('Invalid email or password');
        }

        const payload = { sub: user.id, email: user.email, type: 'user' };
        const access_token = this.jwtService.sign(payload);

        const { password, ...userWithoutPassword } = user;
        return { access_token, user: userWithoutPassword };
    }
}
