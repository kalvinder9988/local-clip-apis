import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ZipcodeGroup } from './entities/zipcode-group.entity';
import { Zipcode } from '../zipcodes/entities/zipcode.entity';
import { CreateZipcodeGroupDto } from './dto/create-zipcode-group.dto';
import { UpdateZipcodeGroupDto } from './dto/update-zipcode-group.dto';
import { ZipcodeGroupResponseDto } from './dto/zipcode-group-response.dto';

@Injectable()
export class ZipcodeGroupsService {
    constructor(
        @InjectRepository(ZipcodeGroup)
        private readonly groupRepository: Repository<ZipcodeGroup>,
        @InjectRepository(Zipcode)
        private readonly zipcodeRepository: Repository<Zipcode>,
    ) { }

    async create(dto: CreateZipcodeGroupDto): Promise<ZipcodeGroupResponseDto> {
        try {
            const group = this.groupRepository.create({
                name: dto.name,
                status: dto.status ?? true,
            });
            const savedGroup = await this.groupRepository.save(group);

            if (dto.zipcodes && dto.zipcodes.length > 0) {
                const zipcodeEntities = dto.zipcodes.map((z) =>
                    this.zipcodeRepository.create({
                        zipcode: z.zipcode,
                        location: z.location,
                        status: true,
                        zipcode_group_id: savedGroup.id,
                    }),
                );
                await this.zipcodeRepository.save(zipcodeEntities);
            }

            return this.findOne(savedGroup.id);
        } catch (error) {
            throw new BadRequestException('Failed to create zipcode group');
        }
    }

    async findAll(): Promise<ZipcodeGroupResponseDto[]> {
        const groups = await this.groupRepository.find({
            where: { deleted: false },
            relations: ['zipcodes'],
            order: { created_at: 'DESC' },
        });
        return groups.map((g) => this.toResponseDto(g));
    }

    async findOne(id: number): Promise<ZipcodeGroupResponseDto> {
        const group = await this.groupRepository.findOne({
            where: { id, deleted: false },
            relations: ['zipcodes'],
        });
        if (!group) throw new NotFoundException(`Zipcode group with ID ${id} not found`);
        return this.toResponseDto(group);
    }

    async update(id: number, dto: UpdateZipcodeGroupDto): Promise<ZipcodeGroupResponseDto> {
        const group = await this.groupRepository.findOne({
            where: { id, deleted: false },
            relations: ['zipcodes'],
        });
        if (!group) throw new NotFoundException(`Zipcode group with ID ${id} not found`);

        if (dto.name !== undefined) group.name = dto.name;
        if (dto.status !== undefined) group.status = dto.status;

        await this.groupRepository.save(group);

        // If zipcodes are provided, replace existing ones
        if (dto.zipcodes !== undefined) {
            // Soft-delete existing zipcodes for this group
            await this.zipcodeRepository
                .createQueryBuilder()
                .update(Zipcode)
                .set({ deleted: true, zipcode_group_id: null })
                .where('zipcode_group_id = :groupId AND deleted = false', { groupId: id })
                .execute();

            // Create new zipcodes
            if (dto.zipcodes.length > 0) {
                const newZipcodes = dto.zipcodes.map((z) =>
                    this.zipcodeRepository.create({
                        zipcode: z.zipcode,
                        location: z.location,
                        status: true,
                        zipcode_group_id: id,
                    }),
                );
                await this.zipcodeRepository.save(newZipcodes);
            }
        }

        return this.findOne(id);
    }

    async remove(id: number): Promise<{ message: string }> {
        const group = await this.groupRepository.findOne({ where: { id, deleted: false } });
        if (!group) throw new NotFoundException(`Zipcode group with ID ${id} not found`);

        // Unlink zipcodes from this group
        await this.zipcodeRepository
            .createQueryBuilder()
            .update(Zipcode)
            .set({ zipcode_group_id: null })
            .where('zipcode_group_id = :groupId', { groupId: id })
            .execute();

        group.deleted = true;
        await this.groupRepository.save(group);

        return { message: `Zipcode group with ID ${id} has been deleted` };
    }

    private toResponseDto(group: ZipcodeGroup): ZipcodeGroupResponseDto {
        return {
            id: group.id,
            name: group.name,
            status: group.status,
            deleted: group.deleted,
            zipcodes: (group.zipcodes || [])
                .filter((z) => !z.deleted)
                .map((z) => ({
                    id: z.id,
                    zipcode: z.zipcode,
                    location: z.location,
                    status: z.status,
                    created_at: z.created_at,
                    updated_at: z.updated_at,
                })),
            created_at: group.created_at,
            updated_at: group.updated_at,
        };
    }
}
