import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { Plan } from './entities/plan.entity';
import { PlanResponseDto } from './dto/plan-response.dto';

@Injectable()
export class PlansService {
  constructor(
    @InjectRepository(Plan)
    private readonly planRepository: Repository<Plan>,
  ) { }

  /**
   * Create a new plan
   */
  async create(createPlanDto: CreatePlanDto): Promise<PlanResponseDto> {
    try {
      const plan = this.planRepository.create(createPlanDto);
      const savedPlan = await this.planRepository.save(plan);
      return this.toResponseDto(savedPlan);
    } catch (error) {
      throw new BadRequestException('Failed to create plan');
    }
  }

  /**
   * Find all plans (excluding soft-deleted)
   */
  async findAll(): Promise<PlanResponseDto[]> {
    const plans = await this.planRepository.find({
      where: { deleted: false },
      order: { created_at: 'DESC' },
    });
    return plans.map((plan) => this.toResponseDto(plan));
  }

  /**
   * Find all plans including soft-deleted
   */
  async findAllWithDeleted(): Promise<PlanResponseDto[]> {
    const plans = await this.planRepository.find({
      order: { created_at: 'DESC' },
    });
    return plans.map((plan) => this.toResponseDto(plan));
  }

  /**
   * Find one plan by ID
   */
  async findOne(id: number): Promise<PlanResponseDto> {
    const plan = await this.planRepository.findOne({
      where: { id, deleted: false },
    });

    if (!plan) {
      throw new NotFoundException(`Plan with ID ${id} not found`);
    }

    return this.toResponseDto(plan);
  }

  /**
   * Update a plan
   */
  async update(id: number, updatePlanDto: UpdatePlanDto): Promise<PlanResponseDto> {
    const plan = await this.planRepository.findOne({
      where: { id, deleted: false },
    });

    if (!plan) {
      throw new NotFoundException(`Plan with ID ${id} not found`);
    }

    Object.assign(plan, updatePlanDto);

    try {
      const updatedPlan = await this.planRepository.save(plan);
      return this.toResponseDto(updatedPlan);
    } catch (error) {
      throw new BadRequestException('Failed to update plan');
    }
  }

  /**
   * Soft delete a plan
   */
  async remove(id: number): Promise<{ message: string }> {
    const plan = await this.planRepository.findOne({
      where: { id, deleted: false },
    });

    if (!plan) {
      throw new NotFoundException(`Plan with ID ${id} not found`);
    }

    plan.deleted = true;
    await this.planRepository.save(plan);

    return { message: `Plan with ID ${id} has been deleted` };
  }

  /**
   * Hard delete a plan (permanent)
   */
  async hardDelete(id: number): Promise<{ message: string }> {
    const plan = await this.planRepository.findOne({ where: { id } });

    if (!plan) {
      throw new NotFoundException(`Plan with ID ${id} not found`);
    }

    await this.planRepository.remove(plan);
    return { message: `Plan with ID ${id} has been permanently deleted` };
  }

  /**
   * Restore a soft-deleted plan
   */
  async restore(id: number): Promise<PlanResponseDto> {
    const plan = await this.planRepository.findOne({
      where: { id, deleted: true },
    });

    if (!plan) {
      throw new NotFoundException(`Deleted plan with ID ${id} not found`);
    }

    plan.deleted = false;
    const restoredPlan = await this.planRepository.save(plan);
    return this.toResponseDto(restoredPlan);
  }

  /**
   * Convert Plan entity to response DTO
   */
  private toResponseDto(plan: Plan): PlanResponseDto {
    return {
      id: plan.id,
      name: plan.name,
      description: plan.description,
      duration: plan.duration,
      amount: Number(plan.amount),
      status: plan.status,
      deleted: plan.deleted,
      created_at: plan.created_at,
      updated_at: plan.updated_at,
    };
  }
}

