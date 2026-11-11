import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CommunityUnit } from './entities/community-unit.entity.js';

import { CreateCommunityUnitDto } from './dto/create-community-unit.dto.js';
import { UpdateCommunityUnitDto } from './dto/update-community-unit.dto.js';
import { ListCommunityUnitsQueryDto } from './dto/list-community-units-query.dto.js';
import { Facility } from '../../facilities/entities/facility.entity.js';

@Injectable()
export class CommunityUnitsService {
  constructor(
    @InjectRepository(CommunityUnit)
    private readonly communityUnitRepository: Repository<CommunityUnit>,

    @InjectRepository(Facility)
    private readonly facilityRepository: Repository<Facility>,
  ) {}

  // Detect MySQL duplicate-entry errors.
  private isDuplicateEntryError(error: unknown): boolean {
    if (typeof error !== 'object' || error === null) {
      return false;
    }

    const dbError = error as {
      code?: string;
      errno?: number;
      driverError?: {
        code?: string;
        errno?: number;
      };
    };

    const driverError = dbError.driverError ?? dbError;

    return driverError.code === 'ER_DUP_ENTRY' || driverError.errno === 1062;
  }

  // Validate that a facility exists and is active.
  private async validateFacility(facilityId: string) {
    const facility = await this.facilityRepository.findOne({
      where: {
        id: facilityId,
        isActive: true,
      },
    });

    if (!facility) {
      throw new NotFoundException('Facility not found or is inactive');
    }

    return facility;
  }

  // CREATE COMMUNITY UNIT
  async create(dto: CreateCommunityUnitDto) {
    const facility = await this.validateFacility(dto.facilityId);

    const name = dto.name.trim();
    const code = dto.code?.trim() || null;

    if (!name) {
      throw new BadRequestException('Community Unit name cannot be empty');
    }

    const existingUnit = await this.communityUnitRepository.findOne({
      where: {
        facilityId: facility.id,
        name,
      },
    });

    if (existingUnit) {
      throw new ConflictException(
        `Community Unit "${name}" already exists under this facility`,
      );
    }

    const communityUnit = this.communityUnitRepository.create({
      facilityId: facility.id,
      name,
      code,
      isActive: true,
    });

    try {
      return await this.communityUnitRepository.save(communityUnit);
    } catch (error) {
      if (this.isDuplicateEntryError(error)) {
        throw new ConflictException(
          `Community Unit "${name}" already exists under this facility`,
        );
      }

      throw error;
    }
  }

  // LIST COMMUNITY UNITS
  async findAll(query: ListCommunityUnitsQueryDto) {
    const page = Math.max(Number(query.page) || 1, 1);

    const limit = Math.min(Math.max(Number(query.limit) || 10, 1), 100);

    const allowedSortFields = [
      'name',
      'code',
      'isActive',
      'createdAt',
      'updatedAt',
    ];

    const sortBy = query.sortBy ?? 'createdAt';

    if (!allowedSortFields.includes(sortBy)) {
      throw new BadRequestException(
        `Invalid sort field. Allowed fields: ${allowedSortFields.join(', ')}`,
      );
    }

    const sortOrder = query.sortOrder?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const queryBuilder = this.communityUnitRepository
      .createQueryBuilder('communityUnit')
      .leftJoinAndSelect('communityUnit.facility', 'facility')
      .leftJoinAndSelect('facility.subCounty', 'subCounty')
      .leftJoinAndSelect('subCounty.county', 'county');

    // Search by Community Unit name or code.
    if (query.search?.trim()) {
      queryBuilder.andWhere(
        `(
          LOWER(communityUnit.name) LIKE LOWER(:search)
          OR LOWER(communityUnit.code) LIKE LOWER(:search)
        )`,
        {
          search: `%${query.search.trim()}%`,
        },
      );
    }

    // Filter by facility.
    if (query.facilityId) {
      queryBuilder.andWhere('communityUnit.facilityId = :facilityId', {
        facilityId: query.facilityId,
      });
    }

    // Filter by active status.
    if (query.isActive !== undefined) {
      queryBuilder.andWhere('communityUnit.isActive = :isActive', {
        isActive: query.isActive === 'true',
      });
    }

    queryBuilder
      .orderBy(`communityUnit.${sortBy}`, sortOrder)
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // GET ONE COMMUNITY UNIT
  async findOne(id: string) {
    const communityUnit = await this.communityUnitRepository
      .createQueryBuilder('communityUnit')
      .leftJoinAndSelect('communityUnit.facility', 'facility')
      .leftJoinAndSelect('facility.subCounty', 'subCounty')
      .leftJoinAndSelect('subCounty.county', 'county')
      .where('communityUnit.id = :id', { id })
      .getOne();

    if (!communityUnit) {
      throw new NotFoundException(`Community Unit with ID ${id} not found`);
    }

    return communityUnit;
  }

  // UPDATE COMMUNITY UNIT
  async update(id: string, dto: UpdateCommunityUnitDto) {
    const communityUnit = await this.communityUnitRepository.findOne({
      where: { id },
    });

    if (!communityUnit) {
      throw new NotFoundException(`Community Unit with ID ${id} not found`);
    }

    // Update facility assignment.
    if (
      dto.facilityId !== undefined &&
      dto.facilityId !== communityUnit.facilityId
    ) {
      await this.validateFacility(dto.facilityId);

      communityUnit.facilityId = dto.facilityId;
    }

    // Update Community Unit name.
    if (dto.name !== undefined) {
      const name = dto.name.trim();

      if (!name) {
        throw new BadRequestException('Community Unit name cannot be empty');
      }

      communityUnit.name = name;
    }

    // Update Community Unit code.
    if (dto.code !== undefined) {
      communityUnit.code = dto.code.trim() || null;
    }

    // Update operational status.
    if (dto.isActive !== undefined) {
      communityUnit.isActive = dto.isActive;
    }

    try {
      return await this.communityUnitRepository.save(communityUnit);
    } catch (error) {
      if (this.isDuplicateEntryError(error)) {
        throw new ConflictException(
          'A Community Unit with this name already exists under this facility',
        );
      }

      throw error;
    }
  }

  // SOFT DELETE COMMUNITY UNIT
  async remove(id: string) {
    const communityUnit = await this.communityUnitRepository.findOne({
      where: { id },
    });

    if (!communityUnit) {
      throw new NotFoundException(`Community Unit with ID ${id} not found`);
    }

    await this.communityUnitRepository.softDelete(id);

    return {
      message: 'Community Unit deleted successfully',
      id,
    };
  }
}
