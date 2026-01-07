import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateZipcodeDto } from './dto/create-zipcode.dto';
import { UpdateZipcodeDto } from './dto/update-zipcode.dto';
import { Zipcode } from './entities/zipcode.entity';
import { ZipcodeResponseDto } from './dto/zipcode-response.dto';

@Injectable()
export class ZipcodesService {
  constructor(
    @InjectRepository(Zipcode)
    private readonly zipcodeRepository: Repository<Zipcode>,
  ) { }

  /**
   * Create a new zipcode
   */
  async create(createZipcodeDto: CreateZipcodeDto): Promise<ZipcodeResponseDto> {
    try {
      const zipcode = this.zipcodeRepository.create(createZipcodeDto);
      const savedZipcode = await this.zipcodeRepository.save(zipcode);
      return this.toResponseDto(savedZipcode);
    } catch (error) {
      throw new BadRequestException('Failed to create zipcode');
    }
  }

  /**
   * Find all zipcodes (excluding soft-deleted)
   */
  async findAll(): Promise<ZipcodeResponseDto[]> {
    const zipcodes = await this.zipcodeRepository.find({
      where: { deleted: false },
      order: { created_at: 'DESC' },
    });
    return zipcodes.map((zipcode) => this.toResponseDto(zipcode));
  }

  /**
   * Find one zipcode by ID
   */
  async findOne(id: number): Promise<ZipcodeResponseDto> {
    const zipcode = await this.zipcodeRepository.findOne({
      where: { id, deleted: false },
    });

    if (!zipcode) {
      throw new NotFoundException(`Zipcode with ID ${id} not found`);
    }

    return this.toResponseDto(zipcode);
  }

  /**
   * Update a zipcode
   */
  async update(id: number, updateZipcodeDto: UpdateZipcodeDto): Promise<ZipcodeResponseDto> {
    const zipcode = await this.zipcodeRepository.findOne({
      where: { id, deleted: false },
    });

    if (!zipcode) {
      throw new NotFoundException(`Zipcode with ID ${id} not found`);
    }

    Object.assign(zipcode, updateZipcodeDto);

    try {
      const updatedZipcode = await this.zipcodeRepository.save(zipcode);
      return this.toResponseDto(updatedZipcode);
    } catch (error) {
      throw new BadRequestException('Failed to update zipcode');
    }
  }

  /**
   * Soft delete a zipcode
   */
  async remove(id: number): Promise<{ message: string }> {
    const zipcode = await this.zipcodeRepository.findOne({
      where: { id, deleted: false },
    });

    if (!zipcode) {
      throw new NotFoundException(`Zipcode with ID ${id} not found`);
    }

    zipcode.deleted = true;
    await this.zipcodeRepository.save(zipcode);

    return { message: `Zipcode with ID ${id} has been deleted` };
  }

  /**
   * Convert Zipcode entity to response DTO
   */
  private toResponseDto(zipcode: Zipcode): ZipcodeResponseDto {
    return {
      id: zipcode.id,
      zipcode: zipcode.zipcode,
      location: zipcode.location,
      status: zipcode.status,
      deleted: zipcode.deleted,
      created_at: zipcode.created_at,
      updated_at: zipcode.updated_at,
    };
  }
}

