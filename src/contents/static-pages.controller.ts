import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    HttpCode,
    HttpStatus,
    UseGuards,
    ParseIntPipe,
} from '@nestjs/common';
import { StaticPagesService } from './static-pages.service';
import { CreateStaticPageDto } from './dto/create-static-page.dto';
import { UpdateStaticPageDto } from './dto/update-static-page.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { StaticPageType } from './entities/static-page.entity';

@Controller('static-pages')
export class StaticPagesController {
    constructor(private readonly staticPagesService: StaticPagesService) { }

    /**
     * Create a new static page
     */
    @Post()
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.CREATED)
    create(@Body() createStaticPageDto: CreateStaticPageDto) {
        return this.staticPagesService.create(createStaticPageDto);
    }

    /**
     * Get all static pages
     */
    @Get()
    findAll() {
        return this.staticPagesService.findAll();
    }

    /**
     * Get static page by ID
     */
    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.staticPagesService.findOne(id);
    }

    /**
     * Get static page by type
     */
    @Get('type/:type')
    findByType(@Param('type') type: StaticPageType) {
        return this.staticPagesService.findByType(type);
    }

    /**
     * Get static page by slug
     */
    @Get('slug/:slug')
    findBySlug(@Param('slug') slug: string) {
        return this.staticPagesService.findBySlug(slug);
    }

    /**
     * Update a static page
     */
    @Patch(':id')
    @UseGuards(JwtAuthGuard)
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateStaticPageDto: UpdateStaticPageDto,
    ) {
        return this.staticPagesService.update(id, updateStaticPageDto);
    }

    /**
     * Toggle static page status
     */
    @Patch(':id/toggle-status')
    @UseGuards(JwtAuthGuard)
    toggleStatus(@Param('id', ParseIntPipe) id: number) {
        return this.staticPagesService.toggleStatus(id);
    }

    /**
     * Delete a static page
     */
    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.staticPagesService.remove(id);
    }
}
