import { Controller, Get, Param, Patch, Body, Delete, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ContactInquiriesService } from './contact-inquiries.service';
import { ContactInquiryStatus } from '../web-apis/home/entities/contact-inquiry.entity';

@ApiTags('Contact Inquiries')
@ApiBearerAuth('JWT-auth')
@Controller('contact-inquiries')
export class ContactInquiriesController {
    constructor(private readonly service: ContactInquiriesService) { }

    @Get()
    @ApiOperation({ summary: 'Get all contact inquiries' })
    findAll() {
        return this.service.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a single contact inquiry' })
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.service.findOne(id);
    }

    @Patch(':id/status')
    @ApiOperation({ summary: 'Update inquiry status' })
    updateStatus(
        @Param('id', ParseIntPipe) id: number,
        @Body('status') status: ContactInquiryStatus,
    ) {
        return this.service.updateStatus(id, status);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a contact inquiry' })
    delete(@Param('id', ParseIntPipe) id: number) {
        return this.service.delete(id);
    }
}
