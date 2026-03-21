import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFiles,
  UploadedFile,
  ParseIntPipe,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { FilesInterceptor, FileInterceptor, AnyFilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { MerchantBusinessesService } from './merchant-businesses.service';
import { CreateMerchantBusinessDto } from './dto/create-merchant-business.dto';
import { UpdateMerchantBusinessDto } from './dto/update-merchant-business.dto';

@ApiTags('Merchant Businesses')
@ApiBearerAuth()
@Controller('merchant-businesses')
export class MerchantBusinessesController {
  constructor(private readonly merchantBusinessesService: MerchantBusinessesService) { }

  @Post()
  @ApiOperation({ summary: 'Create merchant business with owner and all assets' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Merchant business created successfully' })
  @ApiResponse({ status: 409, description: 'Owner email already exists' })
  @ApiResponse({ status: 404, description: 'Category or Zipcode not found' })
  @UseInterceptors(
    AnyFilesInterceptor({
      storage: diskStorage({
        destination: (req, file, cb) => {
          let dest = './uploads/merchant-assets';
          if (file.fieldname === 'banner_image') {
            dest = './uploads/merchant-banners';
          } else if (file.fieldname === 'images') {
            dest = './uploads/merchant-images';
          } else if (file.fieldname === 'videos') {
            dest = './uploads/merchant-videos';
          } else if (file.fieldname === 'attachments') {
            dest = './uploads/merchant-attachments';
          }
          cb(null, dest);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        const allowedMimes = [
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
          'video/mp4',
          'video/mpeg',
          'video/quicktime',
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ];
        if (allowedMimes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Invalid file type'), false);
        }
      },
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB max file size
        files: 50, // Maximum 50 files
      },
    }),
  )
  async create(
    @Body() body: any,
    @UploadedFiles() files?: any[],
  ) {
    // Separate files by type
    const bannerImage = files?.find(f => f.fieldname === 'banner_image');
    const images = files?.filter(f => f.fieldname === 'images') || [];
    const videos = files?.filter(f => f.fieldname === 'videos') || [];
    const attachments = files?.filter(f => f.fieldname === 'attachments') || [];

    // Transform FormData fields to proper types
    const createDto: CreateMerchantBusinessDto = {
      owner_name: body.owner_name,
      owner_email: body.owner_email,
      owner_phone: body.owner_phone,
      business_name: body.business_name,
      business_tagline: body.business_tagline,
      website: body.website,
      phone: body.phone,
      banner_image: bannerImage ? `merchant-banners/${bannerImage.filename}` : body.banner_image, // Fixed path
      description: body.description,
      zipcode_id: parseInt(body.zipcode_id, 10),
      category_id: parseInt(body.category_id, 10),
      location: body.location,
      lat: body.lat ? parseFloat(body.lat) : undefined,
      lng: body.lng ? parseFloat(body.lng) : undefined,
      featured_savings: body.featured_savings === 'true' || body.featured_savings === true,
      more_great_savings: body.more_great_savings === 'true' || body.more_great_savings === true,
      convenience_ids: body['convenience_ids[]']
        ? Array.isArray(body['convenience_ids[]'])
          ? body['convenience_ids[]'].map((id: string) => parseInt(id, 10))
          : [parseInt(body['convenience_ids[]'], 10)]
        : undefined,
    };

    // Create the merchant business
    const merchantBusiness = await this.merchantBusinessesService.create(createDto);

    // If there are additional assets, upload them
    if (images.length > 0 || videos.length > 0 || attachments.length > 0) {
      // Format assets properly for the service - use filename instead of full path
      const formattedAssets = [
        ...images.map(file => ({
          asset_name: `merchant-images/${file.filename}`,
          asset_type: 'image' as const,
        })),
        ...videos.map(file => ({
          asset_name: `merchant-videos/${file.filename}`,
          asset_type: 'video' as const,
        })),
        ...attachments.map(file => ({
          asset_name: `merchant-attachments/${file.filename}`,
          asset_type: 'attachment' as const,
        })),
      ];

      await this.merchantBusinessesService.addAssets(merchantBusiness.id, formattedAssets);
    }

    return merchantBusiness;
  }

  @Post(':id/conveniences')
  @ApiOperation({ summary: 'Add conveniences to merchant business (Step 2)' })
  @ApiResponse({ status: 200, description: 'Conveniences added successfully' })
  @ApiResponse({ status: 404, description: 'Merchant business not found' })
  async addConveniences(
    @Param('id', ParseIntPipe) id: number,
    @Body('convenience_ids') convenienceIds: number[],
  ) {
    if (!convenienceIds || !Array.isArray(convenienceIds)) {
      throw new BadRequestException('convenience_ids must be an array of numbers');
    }
    return this.merchantBusinessesService.addConveniences(id, convenienceIds);
  }

  @Post(':id/assets')
  @ApiOperation({ summary: 'Upload assets for merchant business (Step 3)' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, description: 'Assets uploaded successfully' })
  @ApiResponse({ status: 404, description: 'Merchant business not found' })
  @UseInterceptors(
    FilesInterceptor('files', 30, {
      storage: diskStorage({
        destination: (req, file, cb) => {
          // Determine destination based on file type
          let dest = './uploads/merchant-assets';
          if (file.mimetype.startsWith('image/')) {
            dest = './uploads/merchant-images';
          } else if (file.mimetype.startsWith('video/')) {
            dest = './uploads/merchant-videos';
          } else {
            dest = './uploads/merchant-attachments';
          }
          cb(null, dest);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        // Accept images, videos, and common document formats
        const allowedMimes = [
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
          'video/mp4',
          'video/mpeg',
          'video/quicktime',
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ];

        if (allowedMimes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Invalid file type'), false);
        }
      },
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB max file size
      },
    }),
  )
  async addAssets(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFiles() files: any[],
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    // Determine asset type based on mimetype and construct proper path
    const assets = files.map((file) => {
      let asset_type: 'image' | 'video' | 'attachment' = 'attachment';
      let folder = 'merchant-attachments';

      if (file.mimetype.startsWith('image/')) {
        asset_type = 'image';
        folder = 'merchant-images';
      } else if (file.mimetype.startsWith('video/')) {
        asset_type = 'video';
        folder = 'merchant-videos';
      }

      return {
        asset_name: `${folder}/${file.filename}`, // Use relative path without 'uploads/' prefix
        asset_type,
      };
    });

    return this.merchantBusinessesService.addAssets(id, assets);
  }

  @Get()
  @ApiOperation({ summary: 'Get all merchant businesses' })
  @ApiResponse({ status: 200, description: 'List of merchant businesses' })
  findAll(@Query('merchant_id') merchantId?: string) {
    if (merchantId) {
      return this.merchantBusinessesService.findByMerchantUserId(+merchantId);
    }
    return this.merchantBusinessesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get merchant business by ID' })
  @ApiResponse({ status: 200, description: 'Merchant business details' })
  @ApiResponse({ status: 404, description: 'Merchant business not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.merchantBusinessesService.findOne(id);
  }

  @Get(':id/assets')
  @ApiOperation({ summary: 'Get assets for merchant business' })
  @ApiResponse({ status: 200, description: 'List of assets' })
  @ApiResponse({ status: 404, description: 'Merchant business not found' })
  getAssets(@Param('id', ParseIntPipe) id: number) {
    return this.merchantBusinessesService.getAssets(id);
  }

  @Post(':id/banner')
  @ApiOperation({ summary: 'Upload banner image for merchant business' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, description: 'Banner uploaded successfully' })
  @ApiResponse({ status: 404, description: 'Merchant business not found' })
  @UseInterceptors(
    FileInterceptor('banner_image', {
      storage: diskStorage({
        destination: './uploads/merchant-banners',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `banner-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (allowedMimes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Only image files are allowed for banner'), false);
        }
      },
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max
      },
    }),
  )
  async uploadBanner(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: any,
  ) {
    if (!file) {
      throw new BadRequestException('No banner image provided');
    }
    return this.merchantBusinessesService.updateBanner(id, `merchant-banners/${file.filename}`);
  }

  @Delete(':id/assets/:assetId')
  @ApiOperation({ summary: 'Delete an asset from merchant business' })
  @ApiResponse({ status: 200, description: 'Asset deleted successfully' })
  @ApiResponse({ status: 404, description: 'Asset not found' })
  async deleteAsset(
    @Param('id', ParseIntPipe) id: number,
    @Param('assetId', ParseIntPipe) assetId: number,
  ) {
    return this.merchantBusinessesService.deleteAsset(id, assetId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update merchant business' })
  @ApiResponse({ status: 200, description: 'Merchant business updated successfully' })
  @ApiResponse({ status: 404, description: 'Merchant business not found' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateMerchantBusinessDto: UpdateMerchantBusinessDto,
  ) {
    return this.merchantBusinessesService.update(id, updateMerchantBusinessDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete merchant business' })
  @ApiResponse({ status: 200, description: 'Merchant business deleted successfully' })
  @ApiResponse({ status: 404, description: 'Merchant business not found' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.merchantBusinessesService.remove(id);
  }
}
