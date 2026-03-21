import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Query,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiQuery,
} from '@nestjs/swagger';
import { HomeService } from './home.service';
import { Public } from '../../common/decorators/public.decorator';
import { StaticPageType } from '../../contents/entities/static-page.entity';

@ApiTags('Web - Home')
@Public()
@Controller('web/home')
export class HomeController {
    constructor(private readonly homeService: HomeService) { }

    @Get('banners')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Get active banner slides',
        description: 'Retrieves all active banners for the home page hero carousel, ordered by display order',
    })
    @ApiResponse({
        status: 200,
        description: 'Banners retrieved successfully',
    })
    getBanners() {
        return this.homeService.getBanners();
    }

    @Get('categories')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Get active categories',
        description: 'Retrieves all active categories for the homepage category filter pills',
    })
    @ApiResponse({
        status: 200,
        description: 'Categories retrieved successfully',
    })
    getCategories() {
        return this.homeService.getCategories();
    }

    @Get('featured-deals')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Get featured savings deals',
        description: 'Retrieves merchant businesses marked as featured savings. Optionally filter by category slug.',
    })
    @ApiQuery({
        name: 'category',
        required: false,
        description: 'Category slug to filter deals (e.g. "food-dining"). Use "all" or omit for all categories.',
        example: 'food-dining',
    })
    @ApiResponse({
        status: 200,
        description: 'Featured deals retrieved successfully',
    })
    getFeaturedDeals(
        @Query('category') category?: string,
        @Query('limit') limit?: string,
    ) {
        return this.homeService.getFeaturedDeals(category, limit ? parseInt(limit, 10) : undefined);
    }

    @Get('more-deals')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Get more great savings deals',
        description: 'Retrieves merchant businesses marked as more great savings. Optionally filter by category slug.',
    })
    @ApiQuery({
        name: 'category',
        required: false,
        description: 'Category slug to filter deals (e.g. "saloon"). Use "all" or omit for all categories.',
        example: 'saloon',
    })
    @ApiResponse({
        status: 200,
        description: 'More deals retrieved successfully',
    })
    getMoreDeals(
        @Query('category') category?: string,
        @Query('limit') limit?: string,
    ) {
        return this.homeService.getMoreDeals(category, limit ? parseInt(limit, 10) : undefined);
    }

    @Get('search')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Search deals',
        description: 'Search merchant businesses by keyword (name, description, category) and/or zip code',
    })
    @ApiQuery({
        name: 'q',
        required: false,
        description: 'Keyword to search (business name, description, tagline, category)',
        example: 'pizza',
    })
    @ApiQuery({
        name: 'zipcode',
        required: false,
        description: 'Zip code to filter deals by location',
        example: '90001',
    })
    @ApiResponse({
        status: 200,
        description: 'Search results retrieved successfully',
    })
    searchDeals(
        @Query('q') keyword?: string,
        @Query('zipcode') zipcode?: string,
    ) {
        return this.homeService.searchDeals(keyword, zipcode);
    }

    @Get('all-deals')
    @HttpCode(HttpStatus.OK)
    getAllDeals(
        @Query('categories') categories?: string,
        @Query('zipcode') zipcode?: string,
        @Query('type') type?: 'featured' | 'more' | 'all',
    ) {
        return this.homeService.getAllDeals(categories, zipcode, type);
    }

    @Get('static-page/:type')
    @HttpCode(HttpStatus.OK)
    getStaticPage(@Param('type') type: StaticPageType) {
        return this.homeService.getStaticPage(type);
    }

    @Post('contact')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Submit contact form' })
    @ApiResponse({ status: 201, description: 'Message received successfully' })
    submitContact(
        @Body() body: {
            name: string;
            email: string;
            phone: string;
            subject: string;
            message: string;
            user_id?: number | null;
        },
    ) {
        return this.homeService.submitContact(body);
    }
}

