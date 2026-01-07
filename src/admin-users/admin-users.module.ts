import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AdminUsersService } from './admin-users.service';
import { AdminUsersController } from './admin-users.controller';
import { AdminUser } from './entities/admin-user.entity';
import { JwtStrategy } from '../common/strategies/jwt.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([AdminUser]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'localclip-secret-key-2025',
        signOptions: {
          expiresIn: '7d' as const
        },
      }),
    }),
  ],
  controllers: [AdminUsersController],
  providers: [AdminUsersService, JwtStrategy],
  exports: [AdminUsersService, JwtStrategy, PassportModule, JwtModule],
})
export class AdminUsersModule { }

