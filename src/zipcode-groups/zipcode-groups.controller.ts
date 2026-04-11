import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ZipcodeGroupsService } from './zipcode-groups.service';
import { CreateZipcodeGroupDto } from './dto/create-zipcode-group.dto';
import { UpdateZipcodeGroupDto } from './dto/update-zipcode-group.dto';
import { ZipcodeGroupResponseDto } from './dto/zipcode-group-response.dto';

@ApiTags('zipcode-groups')
@ApiBearerAuth()
@Controller('zipcode-groups')
export class ZipcodeGroupsController {
    constructor(private readonly service: ZipcodeGroupsService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new zipcode group with multiple zipcodes' })
    @ApiResponse({ status: 201, type: ZipcodeGroupResponseDto })
    create(@Body() dto: CreateZipcodeGroupDto): Promise<ZipcodeGroupResponseDto> {
        return this.service.create(dto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all zipcode groups with their zipcodes' })
    @ApiResponse({ status: 200, type: [ZipcodeGroupResponseDto] })
    findAll(): Promise<ZipcodeGroupResponseDto[]> {
        return this.service.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a zipcode group by ID' })
    @ApiResponse({ status: 200, type: ZipcodeGroupResponseDto })
    findOne(@Param('id') id: string): Promise<ZipcodeGroupResponseDto> {
        return this.service.findOne(+id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a zipcode group' })
    @ApiResponse({ status: 200, type: ZipcodeGroupResponseDto })
    update(@Param('id') id: string, @Body() dto: UpdateZipcodeGroupDto): Promise<ZipcodeGroupResponseDto> {
        return this.service.update(+id, dto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a zipcode group' })
    @ApiResponse({ status: 200 })
    remove(@Param('id') id: string): Promise<{ message: string }> {
        return this.service.remove(+id);
    }
}
