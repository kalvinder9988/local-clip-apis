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
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PlansService } from './plans.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { PlanResponseDto } from './dto/plan-response.dto';

@ApiTags('Plans')
@ApiBearerAuth('JWT-auth')
@Controller('plans')
export class PlansController {
  constructor(private readonly plansService: PlansService) { }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new plan',
    description: 'Creates a new subscription plan',
  })
  @ApiBody({ type: CreatePlanDto })
  @ApiResponse({
    status: 201,
    description: 'Plan created successfully',
    type: PlanResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  create(@Body() createPlanDto: CreatePlanDto): Promise<PlanResponseDto> {
    return this.plansService.create(createPlanDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all plans',
    description: 'Retrieves all active plans (excluding soft-deleted)',
  })
  @ApiResponse({
    status: 200,
    description: 'Plans retrieved successfully',
    type: [PlanResponseDto],
  })
  findAll(): Promise<PlanResponseDto[]> {
    return this.plansService.findAll();
  }

  @Get('all-with-deleted')
  @ApiOperation({
    summary: 'Get all plans including deleted',
    description: 'Retrieves all plans including soft-deleted ones',
  })
  @ApiResponse({
    status: 200,
    description: 'All plans retrieved successfully',
    type: [PlanResponseDto],
  })
  findAllWithDeleted(): Promise<PlanResponseDto[]> {
    return this.plansService.findAllWithDeleted();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a plan by ID',
    description: 'Retrieves a single plan by its ID',
  })
  @ApiParam({ name: 'id', description: 'Plan ID', example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Plan retrieved successfully',
    type: PlanResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<PlanResponseDto> {
    return this.plansService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a plan',
    description: 'Updates an existing plan by its ID',
  })
  @ApiParam({ name: 'id', description: 'Plan ID', example: 1 })
  @ApiBody({ type: UpdatePlanDto })
  @ApiResponse({
    status: 200,
    description: 'Plan updated successfully',
    type: PlanResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePlanDto: UpdatePlanDto,
  ): Promise<PlanResponseDto> {
    return this.plansService.update(id, updatePlanDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Soft delete a plan',
    description: 'Marks a plan as deleted (soft delete)',
  })
  @ApiParam({ name: 'id', description: 'Plan ID', example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Plan deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  remove(@Param('id', ParseIntPipe) id: number): Promise<{ message: string }> {
    return this.plansService.remove(id);
  }

  @Delete(':id/hard')
  @ApiOperation({
    summary: 'Hard delete a plan',
    description: 'Permanently deletes a plan from the database',
  })
  @ApiParam({ name: 'id', description: 'Plan ID', example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Plan permanently deleted',
  })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  hardDelete(@Param('id', ParseIntPipe) id: number): Promise<{ message: string }> {
    return this.plansService.hardDelete(id);
  }

  @Patch(':id/restore')
  @ApiOperation({
    summary: 'Restore a soft-deleted plan',
    description: 'Restores a previously soft-deleted plan',
  })
  @ApiParam({ name: 'id', description: 'Plan ID', example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Plan restored successfully',
    type: PlanResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Deleted plan not found' })
  restore(@Param('id', ParseIntPipe) id: number): Promise<PlanResponseDto> {
    return this.plansService.restore(id);
  }
}
