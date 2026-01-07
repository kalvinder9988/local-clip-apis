import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ZipcodesService } from './zipcodes.service';
import { CreateZipcodeDto } from './dto/create-zipcode.dto';
import { UpdateZipcodeDto } from './dto/update-zipcode.dto';
import { ZipcodeResponseDto } from './dto/zipcode-response.dto';

@ApiTags('zipcodes')
@ApiBearerAuth()
@Controller('zipcodes')
export class ZipcodesController {
  constructor(private readonly zipcodesService: ZipcodesService) { }

  @Post()
  @ApiOperation({ summary: 'Create a new zipcode' })
  @ApiResponse({ status: 201, description: 'Zipcode created successfully', type: ZipcodeResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  create(@Body() createZipcodeDto: CreateZipcodeDto): Promise<ZipcodeResponseDto> {
    return this.zipcodesService.create(createZipcodeDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all zipcodes' })
  @ApiResponse({ status: 200, description: 'List of zipcodes', type: [ZipcodeResponseDto] })
  findAll(): Promise<ZipcodeResponseDto[]> {
    return this.zipcodesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a zipcode by ID' })
  @ApiResponse({ status: 200, description: 'Zipcode found', type: ZipcodeResponseDto })
  @ApiResponse({ status: 404, description: 'Zipcode not found' })
  findOne(@Param('id') id: string): Promise<ZipcodeResponseDto> {
    return this.zipcodesService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a zipcode' })
  @ApiResponse({ status: 200, description: 'Zipcode updated successfully', type: ZipcodeResponseDto })
  @ApiResponse({ status: 404, description: 'Zipcode not found' })
  update(@Param('id') id: string, @Body() updateZipcodeDto: UpdateZipcodeDto): Promise<ZipcodeResponseDto> {
    return this.zipcodesService.update(+id, updateZipcodeDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete a zipcode' })
  @ApiResponse({ status: 200, description: 'Zipcode deleted successfully' })
  @ApiResponse({ status: 404, description: 'Zipcode not found' })
  remove(@Param('id') id: string): Promise<{ message: string }> {
    return this.zipcodesService.remove(+id);
  }
}

