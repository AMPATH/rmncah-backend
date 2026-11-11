import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';

import { County } from './entities/county.entity.js';
import { SubCounty } from '../sub-counties/entities/sub-county.entity.js';

import { CreateCountyDto } from './dto/create-county.dto.js';
import { UpdateCountyDto } from './dto/update-county.dto.js';
import { ListCountiesQueryDto } from './dto/list-counties-query.dto.js';

@Injectable()
export class CountiesService {
  constructor(
    @InjectRepository(County)
    private readonly countyRepository: Repository<County>,

    @InjectRepository(SubCounty)
    private readonly subCountyRepository: Repository<SubCounty>,
  ) {}

  /**
   * Create a county
   */
  async create(createCountyDto: CreateCountyDto): Promise<County> {
    const name = createCountyDto.name.trim();
    const code = createCountyDto.code.trim();

    // Check duplicate county name
    const existingByName = await this.countyRepository.findOne({
      where: {
        name: ILike(name),
      },
    });

    if (existingByName) {
      throw new ConflictException('County with this name already exists');
    }

    // Check duplicate official county code
    const existingByCode = await this.countyRepository.findOne({
      where: { code },
    });

    if (existingByCode) {
      throw new ConflictException('County with this code already exists');
    }

    const county = this.countyRepository.create({
      name,
      code,
    });

    return this.countyRepository.save(county);
  }

  /**
   * List counties with pagination, search and sorting
   */
  async findAll(query: ListCountiesQueryDto) {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = query;

    // Whitelist sortable columns
    const allowedSortFields = ['name', 'code', 'createdAt', 'updatedAt'];

    const orderBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';

    const direction: 'ASC' | 'DESC' = sortOrder === 'ASC' ? 'ASC' : 'DESC';

    const where = search?.trim()
      ? [
          { name: ILike(`%${search.trim()}%`) },
          { code: ILike(`%${search.trim()}%`) },
        ]
      : {};

    const [data, total] = await this.countyRepository.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      order: {
        [orderBy]: direction,
      },
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Find one county
   */
  async findOne(id: string): Promise<County> {
    const county = await this.countyRepository.findOne({
      where: { id },
    });

    if (!county) {
      throw new NotFoundException('County not found');
    }

    return county;
  }

  /**
   * Update county
   */
  async update(id: string, updateCountyDto: UpdateCountyDto): Promise<County> {
    const county = await this.findOne(id);

    const name = updateCountyDto.name?.trim();
    const code = updateCountyDto.code?.trim();

    // Check county name uniqueness
    if (name !== undefined) {
      const existingByName = await this.countyRepository.findOne({
        where: {
          name: ILike(name),
        },
      });

      if (existingByName && existingByName.id !== id) {
        throw new ConflictException('County with this name already exists');
      }
    }

    // Check county code uniqueness
    if (code !== undefined) {
      const existingByCode = await this.countyRepository.findOne({
        where: { code },
      });

      if (existingByCode && existingByCode.id !== id) {
        throw new ConflictException('County with this code already exists');
      }
    }

    Object.assign(county, {
      ...(name !== undefined && { name }),
      ...(code !== undefined && { code }),
    });

    return this.countyRepository.save(county);
  }

  /**
   * Soft-delete county
   */
  async remove(id: string): Promise<{ message: string }> {
    await this.findOne(id);

    // Prevent deletion while active sub-counties exist
    const activeSubCounties = await this.subCountyRepository.count({
      where: { countyId: id },
    });

    if (activeSubCounties > 0) {
      throw new ConflictException(
        'Cannot delete county because it has active sub-counties',
      );
    }

    await this.countyRepository.softDelete(id);

    return {
      message: 'County deleted successfully',
    };
  }
}
