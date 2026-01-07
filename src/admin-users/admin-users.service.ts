import { Injectable, UnauthorizedException, OnModuleInit, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AdminUser, AdminRole } from './entities/admin-user.entity';
import { LoginAdminDto } from './dto/login-admin.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class AdminUsersService implements OnModuleInit {
  constructor(
    @InjectRepository(AdminUser)
    private readonly adminUserRepository: Repository<AdminUser>,
    private readonly jwtService: JwtService,
  ) { }

  /**
   * Seed admin user on module initialization
   */
  async onModuleInit() {
    await this.seedAdminUser();
  }

  /**
   * Seed default admin user if not exists
   */
  private async seedAdminUser() {
    const adminEmail = 'admin@localclip.com';

    const existingAdmin = await this.adminUserRepository.findOne({
      where: { email: adminEmail },
    });

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('localclip@123', 10);

      const admin = this.adminUserRepository.create({
        name: 'Admin User',
        email: adminEmail,
        password: hashedPassword,
        phone: '0000000000',
        role: AdminRole.ADMIN,
      });

      await this.adminUserRepository.save(admin);
      console.log('✅ Default admin user created successfully');
      console.log('📧 Email: admin@localclip.com');
      console.log('🔑 Password: localclip@123');
    }
  }

  /**
   * Login admin user
   * @param loginAdminDto - Login credentials
   * @returns Access token and user info
   */
  async login(loginAdminDto: LoginAdminDto): Promise<LoginResponseDto> {
    const { email, password } = loginAdminDto;

    // Find admin user by email
    const adminUser = await this.adminUserRepository.findOne({
      where: { email },
    });

    if (!adminUser) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, adminUser.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT token
    const payload = {
      sub: adminUser.id,
      email: adminUser.email,
      role: adminUser.role
    };

    const access_token = await this.jwtService.signAsync(payload);

    // Return token and user info (excluding password)
    return {
      access_token,
      user: {
        id: adminUser.id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role,
        phone: adminUser.phone,
      },
    };
  }

  /**
   * Verify JWT token and return user info
   * @param token - JWT token from cookie
   * @returns User info without password
   */
  async verifyToken(token: string): Promise<LoginResponseDto['user']> {
    try {
      // Verify and decode token
      const payload = await this.jwtService.verifyAsync(token);

      // Find admin user
      const adminUser = await this.adminUserRepository.findOne({
        where: { id: payload.sub },
      });

      if (!adminUser) {
        throw new UnauthorizedException('User not found');
      }

      // Return user info (excluding password)
      return {
        id: adminUser.id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role,
        phone: adminUser.phone,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  /**
   * Find admin user by email (for authentication)
   */
  async findByEmail(email: string): Promise<AdminUser | null> {
    return await this.adminUserRepository.findOne({
      where: { email },
    });
  }

  /**
   * Validate admin user by ID (for JWT strategy)
   */
  async findOne(id: number): Promise<AdminUser | null> {
    return await this.adminUserRepository.findOne({
      where: { id },
      select: ['id', 'name', 'email', 'role', 'phone', 'created_at', 'updated_at'],
    });
  }

  /**
   * Get all admin users
   */
  async findAll(): Promise<AdminUser[]> {
    return await this.adminUserRepository.find({
      select: ['id', 'name', 'email', 'role', 'phone', 'created_at', 'updated_at'],
      order: { created_at: 'DESC' },
    });
  }

  /**
   * Create a new admin user
   */
  async create(createAdminUserDto: CreateAdminUserDto): Promise<AdminUser> {
    // Check if email already exists
    const existingUser = await this.adminUserRepository.findOne({
      where: { email: createAdminUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(createAdminUserDto.password, 10);

    // Create new admin user
    const adminUser = this.adminUserRepository.create({
      ...createAdminUserDto,
      password: hashedPassword,
      role: createAdminUserDto.role || AdminRole.ADMIN,
    });

    const savedUser = await this.adminUserRepository.save(adminUser);

    // Return without password
    const { password, ...result } = savedUser;
    return result as AdminUser;
  }

  /**
   * Update an admin user
   */
  async update(id: number, updateAdminUserDto: UpdateAdminUserDto): Promise<AdminUser> {
    const adminUser = await this.adminUserRepository.findOne({
      where: { id },
    });

    if (!adminUser) {
      throw new NotFoundException(`Admin user with ID ${id} not found`);
    }

    // Check if email is being updated and if it's already taken
    if (updateAdminUserDto.email && updateAdminUserDto.email !== adminUser.email) {
      const existingUser = await this.adminUserRepository.findOne({
        where: { email: updateAdminUserDto.email },
      });

      if (existingUser) {
        throw new ConflictException('Email already exists');
      }
    }

    // Hash password if provided
    if (updateAdminUserDto.password) {
      updateAdminUserDto.password = await bcrypt.hash(updateAdminUserDto.password, 10);
    }

    // Update admin user
    Object.assign(adminUser, updateAdminUserDto);
    const savedUser = await this.adminUserRepository.save(adminUser);

    // Return without password
    const { password, ...result } = savedUser;
    return result as AdminUser;
  }

  /**
   * Delete an admin user
   */
  async remove(id: number): Promise<void> {
    const adminUser = await this.adminUserRepository.findOne({
      where: { id },
    });

    if (!adminUser) {
      throw new NotFoundException(`Admin user with ID ${id} not found`);
    }

    // Prevent deleting the default admin user
    if (adminUser.email === 'admin@localclip.com') {
      throw new ConflictException('Cannot delete the default admin user');
    }

    await this.adminUserRepository.remove(adminUser);
  }

  /**
   * Update current user's profile
   */
  async updateProfile(userId: number, updateProfileDto: UpdateProfileDto): Promise<AdminUser> {
    const adminUser = await this.adminUserRepository.findOne({
      where: { id: userId },
    });

    if (!adminUser) {
      throw new NotFoundException('User not found');
    }

    // Check if email is being updated and if it's already taken
    if (updateProfileDto.email && updateProfileDto.email !== adminUser.email) {
      const existingUser = await this.adminUserRepository.findOne({
        where: { email: updateProfileDto.email },
      });

      if (existingUser) {
        throw new ConflictException('Email already exists');
      }
    }

    // Handle password change
    if (updateProfileDto.new_password) {
      // Verify current password
      if (!updateProfileDto.current_password) {
        throw new UnauthorizedException('Current password is required to change password');
      }

      const isPasswordValid = await bcrypt.compare(
        updateProfileDto.current_password,
        adminUser.password,
      );

      if (!isPasswordValid) {
        throw new UnauthorizedException('Current password is incorrect');
      }

      // Hash new password
      adminUser.password = await bcrypt.hash(updateProfileDto.new_password, 10);
    }

    // Update other fields
    if (updateProfileDto.name) adminUser.name = updateProfileDto.name;
    if (updateProfileDto.email) adminUser.email = updateProfileDto.email;
    if (updateProfileDto.phone) adminUser.phone = updateProfileDto.phone;

    const savedUser = await this.adminUserRepository.save(adminUser);

    // Return without password
    const { password, ...result } = savedUser;
    return result as AdminUser;
  }

  /**
   * Change current user's password
   */
  async changePassword(userId: number, currentPassword: string, newPassword: string): Promise<void> {
    const adminUser = await this.adminUserRepository.findOne({
      where: { id: userId },
    });

    if (!adminUser) {
      throw new NotFoundException('User not found');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, adminUser.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Hash and update new password
    adminUser.password = await bcrypt.hash(newPassword, 10);
    await this.adminUserRepository.save(adminUser);
  }
}
