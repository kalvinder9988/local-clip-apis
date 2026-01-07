import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ConveniencesService } from './conveniences.service';
import { CreateConvenienceDto } from './dto/create-convenience.dto';
import { UpdateConvenienceDto } from './dto/update-convenience.dto';

@ApiTags('Conveniences')
@ApiBearerAuth()
@Controller('conveniences')
export class ConveniencesController {
  constructor(private readonly conveniencesService: ConveniencesService) { }

  @Post()
  @ApiOperation({ summary: 'Create a new convenience' })
  @ApiResponse({ status: 201, description: 'Convenience created successfully' })
  create(@Body() createConvenienceDto: CreateConvenienceDto) {
    return this.conveniencesService.create(createConvenienceDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all conveniences' })
  @ApiResponse({ status: 200, description: 'List of conveniences' })
  findAll() {
    return this.conveniencesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get convenience by ID' })
  @ApiResponse({ status: 200, description: 'Convenience details' })
  @ApiResponse({ status: 404, description: 'Convenience not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.conveniencesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update convenience' })
  @ApiResponse({ status: 200, description: 'Convenience updated successfully' })
  @ApiResponse({ status: 404, description: 'Convenience not found' })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateConvenienceDto: UpdateConvenienceDto) {
    return this.conveniencesService.update(id, updateConvenienceDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete convenience' })
  @ApiResponse({ status: 200, description: 'Convenience deleted successfully' })
  @ApiResponse({ status: 404, description: 'Convenience not found' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.conveniencesService.remove(id);
  }
}
