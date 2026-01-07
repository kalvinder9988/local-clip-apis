import { Controller, Post, Body, HttpCode, HttpStatus, Res, Req, UnauthorizedException, Get, Param, Patch, Delete, ParseIntPipe } from '@nestjs/common';
import { Response, Request } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { AdminUsersService } from './admin-users.service';
import { LoginAdminDto } from './dto/login-admin.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { Public } from '../common/decorators/public.decorator';
import { AdminUser } from './entities/admin-user.entity';

@ApiTags('Admin Authentication')
@Controller('admin-users')
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) { }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Admin login',
    description: 'Authenticates an admin user and sets secure HttpOnly cookies with JWT tokens',
  })
  @ApiBody({ type: LoginAdminDto })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: LoginResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid credentials',
  })
  async login(
    @Body() loginAdminDto: LoginAdminDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ user: LoginResponseDto['user']; access_token: string }> {
    const result = await this.adminUsersService.login(loginAdminDto);

    // Set HttpOnly cookie with access token
    response.cookie('access_token', result.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // true in production (HTTPS)
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    });

    // Return user info AND token (for Bearer authorization)
    return { user: result.user, access_token: result.access_token };
  }

  @ApiBearerAuth()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Admin logout',
    description: 'Clears authentication cookies',
  })
  @ApiResponse({
    status: 200,
    description: 'Logout successful',
  })
  async logout(@Res({ passthrough: true }) response: Response): Promise<{ message: string }> {
    response.clearCookie('access_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });

    return { message: 'Logged out successfully' };
  }

  @Public()
  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify authentication',
    description: 'Verifies if the user is authenticated by checking the cookie',
  })
  @ApiResponse({
    status: 200,
    description: 'User is authenticated',
  })
  @ApiResponse({
    status: 401,
    description: 'User is not authenticated',
  })
  async verify(@Req() request: Request): Promise<{ user: LoginResponseDto['user'] }> {
    const token = request.cookies?.access_token;

    if (!token) {
      throw new UnauthorizedException('Not authenticated');
    }

    const user = await this.adminUsersService.verifyToken(token);
    return { user };
  }

  @ApiBearerAuth()
  @Get('profile/me')
  @ApiOperation({
    summary: 'Get current user profile',
    description: 'Retrieves the profile of the currently authenticated admin user',
  })
  @ApiResponse({
    status: 200,
    description: 'Profile retrieved successfully',
    type: AdminUser,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async getProfile(@Req() request: Request): Promise<AdminUser> {
    const token = request.cookies?.access_token || request.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      throw new UnauthorizedException('Not authenticated');
    }

    const user = await this.adminUsersService.verifyToken(token);
    const fullProfile = await this.adminUsersService.findOne(user.id);

    if (!fullProfile) {
      throw new UnauthorizedException('User not found');
    }

    return fullProfile;
  }

  @ApiBearerAuth()
  @Patch('profile/me')
  @ApiOperation({
    summary: 'Update current user profile',
    description: 'Updates the profile of the currently authenticated admin user',
  })
  @ApiBody({ type: UpdateProfileDto })
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully',
    type: AdminUser,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized or invalid current password',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Email already exists',
  })
  async updateProfile(
    @Req() request: Request,
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<AdminUser> {
    const token = request.cookies?.access_token || request.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      throw new UnauthorizedException('Not authenticated');
    }

    const user = await this.adminUsersService.verifyToken(token);
    return await this.adminUsersService.updateProfile(user.id, updateProfileDto);
  }

  @ApiBearerAuth()
  @Post('profile/change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Change password',
    description: 'Changes the password for the currently authenticated admin user',
  })
  @ApiBody({ type: ChangePasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Password changed successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized or invalid current password',
  })
  async changePassword(
    @Req() request: Request,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    const token = request.cookies?.access_token || request.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      throw new UnauthorizedException('Not authenticated');
    }

    const user = await this.adminUsersService.verifyToken(token);
    await this.adminUsersService.changePassword(
      user.id,
      changePasswordDto.current_password,
      changePasswordDto.new_password,
    );

    return { message: 'Password changed successfully' };
  }

  @ApiBearerAuth()
  @Get()
  @ApiOperation({
    summary: 'Get all admin users',
    description: 'Retrieves a list of all admin users',
  })
  @ApiResponse({
    status: 200,
    description: 'List of admin users retrieved successfully',
    type: [AdminUser],
  })
  async findAll(): Promise<AdminUser[]> {
    return await this.adminUsersService.findAll();
  }

  @ApiBearerAuth()
  @Get(':id')
  @ApiOperation({
    summary: 'Get admin user by ID',
    description: 'Retrieves a single admin user by ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Admin user retrieved successfully',
    type: AdminUser,
  })
  @ApiResponse({
    status: 404,
    description: 'Admin user not found',
  })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<AdminUser> {
    const user = await this.adminUsersService.findOne(id);
    if (!user) {
      throw new UnauthorizedException('Admin user not found');
    }
    return user;
  }

  @ApiBearerAuth()
  @Post('create')
  @ApiOperation({
    summary: 'Create new admin user',
    description: 'Creates a new admin user',
  })
  @ApiBody({ type: CreateAdminUserDto })
  @ApiResponse({
    status: 201,
    description: 'Admin user created successfully',
    type: AdminUser,
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Email already exists',
  })
  async create(@Body() createAdminUserDto: CreateAdminUserDto): Promise<AdminUser> {
    return await this.adminUsersService.create(createAdminUserDto);
  }

  @ApiBearerAuth()
  @Patch(':id')
  @ApiOperation({
    summary: 'Update admin user',
    description: 'Updates an existing admin user',
  })
  @ApiBody({ type: UpdateAdminUserDto })
  @ApiResponse({
    status: 200,
    description: 'Admin user updated successfully',
    type: AdminUser,
  })
  @ApiResponse({
    status: 404,
    description: 'Admin user not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Email already exists',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAdminUserDto: UpdateAdminUserDto,
  ): Promise<AdminUser> {
    return await this.adminUsersService.update(id, updateAdminUserDto);
  }

  @ApiBearerAuth()
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete admin user',
    description: 'Deletes an admin user',
  })
  @ApiResponse({
    status: 204,
    description: 'Admin user deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Admin user not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Cannot delete default admin user',
  })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.adminUsersService.remove(id);
  }
}

