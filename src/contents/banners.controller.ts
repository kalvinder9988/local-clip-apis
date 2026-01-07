import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseInterceptors,
    UploadedFile,
    ParseIntPipe,
    BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { BannersService } from './banners.service';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';

@Controller('banners')
export class BannersController {
    constructor(private readonly bannersService: BannersService) { }

    @Post()
    create(@Body() createBannerDto: CreateBannerDto) {
        return this.bannersService.create(createBannerDto);
    }

    @Post('upload')
    @UseInterceptors(
        FileInterceptor('banner_image', {
            storage: diskStorage({
                destination: './uploads/banners',
                filename: (req, file, cb) => {
                    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                    const ext = extname(file.originalname);
                    cb(null, `banner-${uniqueSuffix}${ext}`);
                },
            }),
            fileFilter: (req, file, cb) => {
                console.log('File upload attempt:');
                console.log('- Original name:', file.originalname);
                console.log('- MIME type:', file.mimetype);
                console.log('- Field name:', file.fieldname);

                // Allow common image MIME types
                const allowedMimes = [
                    'image/jpeg',
                    'image/jpg',
                    'image/png',
                    'image/gif',
                    'image/webp',
                    'image/svg+xml',
                ];

                if (allowedMimes.includes(file.mimetype)) {
                    console.log('✅ File accepted');
                    cb(null, true);
                } else {
                    console.log('❌ File rejected - Invalid MIME type');
                    cb(new Error(`Only image files are allowed! Received: ${file.mimetype}`), false);
                }
            },
            limits: {
                fileSize: 5 * 1024 * 1024, // 5MB
            },
        }),
    )
    async uploadBanner(
        @UploadedFile() file: any,
        @Body() body: any,
    ) {
        if (!file) {
            throw new BadRequestException('No file uploaded');
        }

        console.log('Uploaded file:', file.filename);
        console.log('Request body:', body);

        const bannerData: CreateBannerDto = {
            banner_image: `banners/${file.filename}`, // Removed 'uploads/' prefix since static server adds it
            display_order: body.display_order ? parseInt(body.display_order, 10) : 0,
            status: body.status === 'true' || body.status === true || body.status === undefined ? true : false,
        };

        console.log('Banner data to save:', bannerData);

        try {
            const result = await this.bannersService.create(bannerData);
            console.log('Banner created successfully:', result);
            return result;
        } catch (error) {
            console.error('Error creating banner:', error);
            throw error;
        }
    }

    @Get()
    findAll() {
        return this.bannersService.findAll();
    }

    @Get('active')
    findAllActive() {
        return this.bannersService.findAllActive();
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.bannersService.findOne(id);
    }

    @Patch(':id')
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateBannerDto: UpdateBannerDto,
    ) {
        return this.bannersService.update(id, updateBannerDto);
    }

    @Patch(':id/display-order')
    updateDisplayOrder(
        @Param('id', ParseIntPipe) id: number,
        @Body('display_order', ParseIntPipe) display_order: number,
    ) {
        return this.bannersService.updateDisplayOrder(id, display_order);
    }

    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.bannersService.remove(id);
    }
}
