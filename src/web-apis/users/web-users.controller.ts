import {
    Controller,
    Post,
    Get,
    Patch,
    Body,
    HttpCode,
    HttpStatus,
    UnauthorizedException,
    Req,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength, MaxLength, IsOptional, IsIn } from 'class-validator';
import { Public } from '../../common/decorators/public.decorator';
import { UsersService } from '../../users/users.service';
import { WebAccountService } from './web-account.service';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ChangePasswordDto } from '../../admin-users/dto/change-password.dto';
import { CouponReactionType } from '../../merchant-businesses/entities/user-coupon-reaction.entity';
import { MailService } from '../../mail/mail.service';
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

    @IsOptional()
    @IsIn(['en', 'es'])
    lang?: 'en' | 'es';
}

class WebLoginDto {
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    password: string;
}

class WebUpdateProfileDto {
    @IsOptional()
    @IsString()
    @MinLength(2)
    @MaxLength(100)
    name?: string;

    @IsOptional()
    @IsEmail()
    email?: string;

    @IsOptional()
    @IsString()
    phone?: string;

    @IsOptional()
    @IsString()
    zipcode?: string;
}

@ApiTags('Web - Users')
@Controller('web/users')
export class WebUsersController {
    constructor(
        private readonly usersService: UsersService,
        private readonly webAccountService: WebAccountService,
        private readonly jwtService: JwtService,
        private readonly mailService: MailService,
    ) { }

    @Public()
    @Post('register')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Register a new web user' })
    async register(@Body() dto: WebRegisterDto) {
        const user = await this.usersService.create({
            name: dto.name,
            email: dto.email,
            password: dto.password,
            phone: dto.phone,
            zipcode: dto.zipcode,
        });

        // Fire-and-forget welcome email in the selected UI language
        void this.mailService.sendWelcomeEmail({
            to: user.email,
            recipientName: user.name,
            language: dto.lang || 'en',
        });

        return { message: 'Registration successful', user };
    }

    @Public()
    @Post('login')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Sign in a web user' })
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

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Get('me')
    getProfile(@Req() req: any) {
        return this.webAccountService.getProfile(req.user.userId);
    }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Patch('me')
    updateProfile(@Req() req: any, @Body() dto: WebUpdateProfileDto) {
        return this.webAccountService.updateProfile(req.user.userId, dto);
    }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Post('change-password')
    @HttpCode(HttpStatus.OK)
    changePassword(@Req() req: any, @Body() dto: ChangePasswordDto) {
        return this.webAccountService.changePassword(
            req.user.userId,
            dto.current_password,
            dto.new_password,
        );
    }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Get('me/shared-coupons')
    getSharedCoupons(
        @Req() req: any,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        return this.webAccountService.getSharedCoupons(
            req.user.userId,
            page ? +page : 1,
            limit ? +limit : 10,
        );
    }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Get('me/coupon-reactions')
    getCouponReactions(
        @Req() req: any,
        @Query('type') type: 'like' | 'dislike',
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        const reactionType = type === 'dislike' ? CouponReactionType.DISLIKE : CouponReactionType.LIKE;
        return this.webAccountService.getCouponReactions(
            req.user.userId,
            reactionType,
            page ? +page : 1,
            limit ? +limit : 10,
        );
    }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Get('me/liked-businesses')
    getLikedBusinesses(
        @Req() req: any,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        return this.webAccountService.getLikedBusinesses(
            req.user.userId,
            page ? +page : 1,
            limit ? +limit : 10,
        );
    }
}
