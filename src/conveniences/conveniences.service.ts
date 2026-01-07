import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateConvenienceDto } from './dto/create-convenience.dto';
import { UpdateConvenienceDto } from './dto/update-convenience.dto';
import { Convenience } from '../merchant-businesses/entities/convenience.entity';

@Injectable()
export class ConveniencesService {
  constructor(
    @InjectRepository(Convenience)
    private readonly convenienceRepository: Repository<Convenience>,
  ) { }

  async create(createConvenienceDto: CreateConvenienceDto) {
    const convenience = this.convenienceRepository.create(createConvenienceDto);
    return this.convenienceRepository.save(convenience);
  }

  async findAll() {
    return this.convenienceRepository.find({
      order: { name: 'ASC' },
    });
  }

  async findOne(id: number) {
    const convenience = await this.convenienceRepository.findOne({
      where: { id },
    });

    if (!convenience) {
      throw new NotFoundException(`Convenience with ID ${id} not found`);
    }

    return convenience;
  }

  async update(id: number, updateConvenienceDto: UpdateConvenienceDto) {
    const convenience = await this.findOne(id);
    Object.assign(convenience, updateConvenienceDto);
    return this.convenienceRepository.save(convenience);
  }

  async remove(id: number) {
    const convenience = await this.findOne(id);
    await this.convenienceRepository.remove(convenience);
    return { message: 'Convenience deleted successfully' };
  }
}
