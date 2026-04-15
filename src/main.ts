import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import * as fs from 'fs';
import * as path from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Serve static files from uploads directory
  // Use absolute path to uploads directory (works in both dev and prod)
  const uploadsPath = path.join(process.cwd(), 'uploads');
  console.log('📁 Serving static files from:', uploadsPath);
  app.useStaticAssets(uploadsPath, {
    prefix: '/uploads/',
  });

  // Create upload directories if they don't exist
  const uploadDirs = [
    './uploads/banners',
    './uploads/merchant-banners',
    './uploads/merchant-images',
    './uploads/merchant-videos',
    './uploads/merchant-attachments',
    './uploads/merchant-assets',
  ];

  uploadDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`✅ Created directory: ${dir}`);
    }
  });

  // Enable cookie parser
  app.use(cookieParser());

  // Enable CORS with credentials for cookie-based authentication
  const extraOrigins = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',').map(o => o.trim())
    : [];

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, same-origin SSR)
      if (!origin) return callback(null, true);

      const isLocalhost = /^https?:\/\/localhost(:\d+)?$/.test(origin);
      // Private network ranges: 10.x, 172.16-31.x, 192.168.x
      const isPrivateNetwork = /^https?:\/\/(10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|192\.168\.\d+\.\d+)(:\d+)?$/.test(origin);
      const isExtraOrigin = extraOrigins.includes(origin);
      const isProductionOrigin = [
        'http://163.227.92.134:3002',
        'http://163.227.92.134:3003',
      ].includes(origin);

      if (isLocalhost || isPrivateNetwork || isExtraOrigin || isProductionOrigin) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin '${origin}' not allowed`));
      }
    },
    credentials: true,
  });

  // Enable validation pipe globally
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger documentation setup
  const config = new DocumentBuilder()
    .setTitle('Local Clip API')
    .setDescription('API documentation for Local Clip - A platform for managing local businesses, coupons, and users. Use the "Authorize" button to set your Bearer token.')
    .setVersion('1.0')
    .addTag('Admin Authentication', 'Admin login and authentication endpoints')
    .addTag('Plans', 'Subscription plans management')
    .addTag('Users', 'User management endpoints')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth', // This name will be used in @ApiBearerAuth()
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`📚 Swagger documentation: http://localhost:${port}/api/docs`);
}
bootstrap();
