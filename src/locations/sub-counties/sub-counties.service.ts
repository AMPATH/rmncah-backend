import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';

import { SubCounty } from './entities/sub-county.entity.js';
import { County } from '../counties/entities/county.entity.js';

import { CreateSubCountyDto } from './dto/create-sub-county.dto.js';
import { UpdateSubCountyDto } from './dto/update-sub-county.dto.js';
import { ListSubCountiesQueryDto } from './dto/list-sub-counties-query.dto.js';

@Injectable()
export class SubCountiesService {
  constructor(
    @InjectRepository(SubCounty)
    private readonly subCountyRepository: Repository<SubCounty>,

    @InjectRepository(County)
    private readonly countyRepository: Repository<County>,
  ) {}

  /**
   * Create a new sub-county
   */
  async create(createSubCountyDto: CreateSubCountyDto): Promise<SubCounty> {
    const name = createSubCountyDto.name.trim();
    const code = createSubCountyDto.code.trim();

    // Verify county exists
    const county = await this.countyRepository.findOne({
      where: { id: createSubCountyDto.countyId },
    });

    if (!county) {
      throw new NotFoundException('County not found');
    }

    // Check duplicate name within the same county
    const existingByName = await this.subCountyRepository.findOne({
      where: {
        countyId: createSubCountyDto.countyId,
        name: ILike(name),
      },
    });

    if (existingByName) {
      throw new ConflictException(
        'Sub-county with this name already exists in the county',
      );
    }

    // Check globally unique official IEBC code
    const existingByCode = await this.subCountyRepository.findOne({
      where: { code },
    });

    if (existingByCode) {
      throw new ConflictException('Sub-county with this code already exists');
    }

    const subCounty = this.subCountyRepository.create({
      name,
      code,
      countyId: county.id,
    });

    return this.subCountyRepository.save(subCounty);
  }

  /**
   * List sub-counties with pagination, search, filtering and sorting
   */
  async findAll(query: ListSubCountiesQueryDto) {
    const {
      page = 1,
      limit = 10,
      search,
      countyId,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = query;

    // Whitelist sortable columns
    const allowedSortFields = ['name', 'code', 'createdAt', 'updatedAt'];

    const orderBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';

    const direction: 'ASC' | 'DESC' = sortOrder === 'ASC' ? 'ASC' : 'DESC';

    const queryBuilder = this.subCountyRepository
      .createQueryBuilder('subCounty')
      .leftJoinAndSelect('subCounty.county', 'county');

    // Filter by county
    if (countyId) {
      queryBuilder.andWhere('subCounty.countyId = :countyId', {
        countyId,
      });
    }

    // Search by name or official code
    if (search?.trim()) {
      queryBuilder.andWhere(
        '(subCounty.name ILIKE :search OR subCounty.code ILIKE :search)',
        { search: `%${search.trim()}%` },
      );
    }

    const [data, total] = await queryBuilder
      .orderBy(`subCounty.${orderBy}`, direction)
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get one sub-county by ID
   */
  async findOne(id: string): Promise<SubCounty> {
    const subCounty = await this.subCountyRepository.findOne({
      where: { id },
      relations: {
        county: true,
      },
    });

    if (!subCounty) {
      throw new NotFoundException('Sub-county not found');
    }

    return subCounty;
  }

  /**
   * Update a sub-county
   */
  async update(
    id: string,
    updateSubCountyDto: UpdateSubCountyDto,
  ): Promise<SubCounty> {
    const subCounty = await this.findOne(id);

    const name = updateSubCountyDto.name?.trim();
    const code = updateSubCountyDto.code?.trim();

    const countyId = updateSubCountyDto.countyId ?? subCounty.countyId;

    // Verify new county if county assignment changes
    if (
      updateSubCountyDto.countyId &&
      updateSubCountyDto.countyId !== subCounty.countyId
    ) {
      const county = await this.countyRepository.findOne({
        where: { id: updateSubCountyDto.countyId },
      });

      if (!county) {
        throw new NotFoundException('County not found');
      }
    }

    // Check name uniqueness within the target county
    if (name) {
      const existingByName = await this.subCountyRepository.findOne({
        where: {
          countyId,
          name: ILike(name),
        },
      });

      if (existingByName && existingByName.id !== id) {
        throw new ConflictException(
          'Sub-county with this name already exists in the county',
        );
      }
    }

    // Check global code uniqueness
    if (code) {
      const existingByCode = await this.subCountyRepository.findOne({
        where: { code },
      });

      if (existingByCode && existingByCode.id !== id) {
        throw new ConflictException('Sub-county with this code already exists');
      }
    }

    Object.assign(subCounty, {
      ...updateSubCountyDto,
      ...(name !== undefined && { name }),
      ...(code !== undefined && { code }),
      countyId,
    });

    return this.subCountyRepository.save(subCounty);
  }

  /**
   * Soft-delete a sub-county
   */
  async remove(id: string): Promise<{ message: string }> {
    await this.findOne(id);

    await this.subCountyRepository.softDelete(id);

    return {
      message: 'Sub-county deleted successfully',
    };
  }
}
