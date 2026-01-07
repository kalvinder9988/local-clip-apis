import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { CouponsService } from './coupons.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';

@Controller('coupons')
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) { }

  /**
   * Multer file filter for image uploads
   */
  private static imageFileFilter = (req: any, file: any, cb: any) => {
    // Log file info for debugging
    console.log('File upload attempt:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
    });

    // Check file extension (case-insensitive) and mimetype
    const allowedExtensions = /\.(jpg|jpeg|png|gif|webp)$/i;
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

    const hasValidExtension = file.originalname.match(allowedExtensions);
    const hasValidMimeType = allowedMimeTypes.includes(file.mimetype);

    console.log('Validation result:', {
      hasValidExtension: !!hasValidExtension,
      hasValidMimeType,
      willAccept: hasValidExtension || hasValidMimeType,
    });

    if (hasValidExtension || hasValidMimeType) {
      cb(null, true);
    } else {
      cb(new Error(`Only image files (jpg, jpeg, png, gif, webp) are allowed! Got: ${file.originalname} (${file.mimetype})`), false);
    }
  };

  /**
   * Multer storage configuration for image uploads
   */
  private static imageStorage = diskStorage({
    destination: './uploads',
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = extname(file.originalname);
      cb(null, `coupon-${uniqueSuffix}${ext}`);
    },
  });

  /**
   * Helper method to transform FormData string values to proper types
   */
  private transformCouponDto(dto: any): any {
    const transformed: any = { ...dto };

    // Transform merchant_business_id to number
    if (transformed.merchant_business_id !== undefined) {
      transformed.merchant_business_id = parseInt(transformed.merchant_business_id, 10);
    }

    // Transform coupon_value to number
    if (transformed.coupon_value !== undefined) {
      transformed.coupon_value = parseFloat(transformed.coupon_value);
    }

    // Transform status to boolean
    if (transformed.status !== undefined) {
      transformed.status = transformed.status === 'true' || transformed.status === true;
    }

    // Transform total_likes, total_dislikes, total_shared to numbers if present
    if (transformed.total_likes !== undefined) {
      transformed.total_likes = parseInt(transformed.total_likes, 10);
    }
    if (transformed.total_dislikes !== undefined) {
      transformed.total_dislikes = parseInt(transformed.total_dislikes, 10);
    }
    if (transformed.total_shared !== undefined) {
      transformed.total_shared = parseInt(transformed.total_shared, 10);
    }

    return transformed;
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('coupon_image', {
      storage: CouponsController.imageStorage,
      fileFilter: CouponsController.imageFileFilter,
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  create(
    @Body() createCouponDto: CreateCouponDto,
    @UploadedFile() file?: any,
  ) {
    // Transform FormData string values to proper types
    const transformedDto = this.transformCouponDto(createCouponDto);
    return this.couponsService.create(transformedDto, file);
  }

  @Get()
  findAll(@Query('merchant_business_id') merchantBusinessId?: string) {
    if (merchantBusinessId) {
      return this.couponsService.findByMerchantBusiness(+merchantBusinessId);
    }
    return this.couponsService.findAll();
  }

  @Get('code/:code')
  findByCouponCode(@Param('code') code: string) {
    return this.couponsService.findByCouponCode(code);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.couponsService.findOne(+id);
  }

  @Patch(':id')
  @UseInterceptors(
    FileInterceptor('coupon_image', {
      storage: CouponsController.imageStorage,
      fileFilter: CouponsController.imageFileFilter,
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  update(
    @Param('id') id: string,
    @Body() updateCouponDto: UpdateCouponDto,
    @UploadedFile() file?: any,
  ) {
    // Transform FormData string values to proper types
    const transformedDto = this.transformCouponDto(updateCouponDto);
    return this.couponsService.update(+id, transformedDto, file);
  }

  @Patch(':id/like')
  @HttpCode(HttpStatus.OK)
  incrementLikes(@Param('id') id: string) {
    return this.couponsService.incrementLikes(+id);
  }

  @Patch(':id/dislike')
  @HttpCode(HttpStatus.OK)
  incrementDislikes(@Param('id') id: string) {
    return this.couponsService.incrementDislikes(+id);
  }

  @Patch(':id/share')
  @HttpCode(HttpStatus.OK)
  incrementShared(@Param('id') id: string) {
    return this.couponsService.incrementShared(+id);
  }

  @Patch(':id/toggle-status')
  @HttpCode(HttpStatus.OK)
  toggleStatus(@Param('id') id: string) {
    return this.couponsService.toggleStatus(+id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.couponsService.remove(+id);
  }
}
