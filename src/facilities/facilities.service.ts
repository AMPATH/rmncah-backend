import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Facility } from './entities/facility.entity.js';
import { SubCounty } from '../locations/sub-counties/entities/sub-county.entity.js';

import { CreateFacilityDto } from './dto/create-facility.dto.js';
import { UpdateFacilityDto } from './dto/update-facility.dto.js';
import { ListFacilitiesQueryDto } from './dto/list-facilities-query.dto.js';

@Injectable()
export class FacilitiesService {
  constructor(
    @InjectRepository(Facility)
    private readonly facilityRepository: Repository<Facility>,

    @InjectRepository(SubCounty)
    private readonly subCountyRepository: Repository<SubCounty>,
  ) {}

  // Check MySQL duplicate-entry errors.
  private isUniqueConstraintError(error: unknown): boolean {
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

    return (
      dbError.code === 'ER_DUP_ENTRY' ||
      dbError.errno === 1062 ||
      dbError.driverError?.code === 'ER_DUP_ENTRY' ||
      dbError.driverError?.errno === 1062
    );
  }

  // CREATE FACILITY
  async create(createFacilityDto: CreateFacilityDto) {
    const { subCountyId, name, mflCode, level, type, ownership, isActive } =
      createFacilityDto;

    const normalizedName = name.trim();
    const normalizedMflCode = mflCode.trim();

    if (!normalizedName || !normalizedMflCode) {
      throw new BadRequestException(
        'Facility name and MFL code cannot be empty',
      );
    }

    // Verify that the sub-county exists.
    const subCounty = await this.subCountyRepository.findOne({
      where: { id: subCountyId },
    });

    if (!subCounty) {
      throw new NotFoundException(
        `Sub-county with ID ${subCountyId} not found`,
      );
    }

    // Check for an existing MFL code.
    const existingFacility = await this.facilityRepository.findOne({
      where: { mflCode: normalizedMflCode },
    });

    if (existingFacility) {
      throw new ConflictException(
        `A facility with MFL code ${normalizedMflCode} already exists`,
      );
    }

    const facility = this.facilityRepository.create({
      subCountyId,
      name: normalizedName,
      mflCode: normalizedMflCode,
      level,
      type,
      ownership,
      isActive: isActive ?? true,
    });

    try {
      return await this.facilityRepository.save(facility);
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException(
          `A facility with MFL code ${normalizedMflCode} already exists`,
        );
      }

      throw error;
    }
  }

  // LIST FACILITIES
  async findAll(query: ListFacilitiesQueryDto) {
    const page = Math.max(Number(query.page) || 1, 1);

    const limit = Math.min(Math.max(Number(query.limit) || 10, 1), 100);

    // Allowed sorting columns.
    const allowedSortFields = [
      'name',
      'mflCode',
      'level',
      'type',
      'ownership',
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

    const queryBuilder = this.facilityRepository
      .createQueryBuilder('facility')
      .leftJoinAndSelect('facility.subCounty', 'subCounty')
      .leftJoinAndSelect('subCounty.county', 'county');

    // Search by facility name or MFL code.
    if (query.search?.trim()) {
      queryBuilder.andWhere(
        `(
          LOWER(facility.name) LIKE LOWER(:search)
          OR LOWER(facility.mflCode) LIKE LOWER(:search)
        )`,
        {
          search: `%${query.search.trim()}%`,
        },
      );
    }

    // Filter by sub-county.
    if (query.subCountyId) {
      queryBuilder.andWhere('facility.subCountyId = :subCountyId', {
        subCountyId: query.subCountyId,
      });
    }

    // Filter by active/inactive status.
    if (query.isActive !== undefined) {
      queryBuilder.andWhere('facility.isActive = :isActive', {
        isActive: query.isActive === 'true',
      });
    }

    // Filter by facility level.
    if (query.level) {
      queryBuilder.andWhere('facility.level = :level', {
        level: query.level,
      });
    }

    // Filter by facility type.
    if (query.type) {
      queryBuilder.andWhere('facility.type = :type', {
        type: query.type,
      });
    }

    // Filter by ownership.
    if (query.ownership) {
      queryBuilder.andWhere('facility.ownership = :ownership', {
        ownership: query.ownership,
      });
    }

    queryBuilder
      .orderBy(`facility.${sortBy}`, sortOrder)
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

  // GET ONE FACILITY
  async findOne(id: string) {
    const facility = await this.facilityRepository
      .createQueryBuilder('facility')
      .leftJoinAndSelect('facility.subCounty', 'subCounty')
      .leftJoinAndSelect('subCounty.county', 'county')
      .where('facility.id = :id', { id })
      .getOne();

    if (!facility) {
      throw new NotFoundException(`Facility with ID ${id} not found`);
    }

    return facility;
  }

  // UPDATE FACILITY
  async update(id: string, updateFacilityDto: UpdateFacilityDto) {
    const facility = await this.facilityRepository.findOne({
      where: { id },
    });

    if (!facility) {
      throw new NotFoundException(`Facility with ID ${id} not found`);
    }

    const { subCountyId, name, mflCode, level, type, ownership, isActive } =
      updateFacilityDto;

    // Validate and update sub-county.
    if (subCountyId !== undefined && subCountyId !== facility.subCountyId) {
      const subCounty = await this.subCountyRepository.findOne({
        where: { id: subCountyId },
      });

      if (!subCounty) {
        throw new NotFoundException(
          `Sub-county with ID ${subCountyId} not found`,
        );
      }

      facility.subCountyId = subCountyId;
    }

    // Validate and update facility name.
    if (name !== undefined) {
      const normalizedName = name.trim();

      if (!normalizedName) {
        throw new BadRequestException('Facility name cannot be empty');
      }

      facility.name = normalizedName;
    }

    // Validate and update MFL code.
    if (mflCode !== undefined) {
      const normalizedMflCode = mflCode.trim();

      if (!normalizedMflCode) {
        throw new BadRequestException('MFL code cannot be empty');
      }

      if (normalizedMflCode !== facility.mflCode) {
        const existingFacility = await this.facilityRepository.findOne({
          where: { mflCode: normalizedMflCode },
        });

        if (existingFacility) {
          throw new ConflictException(
            `A facility with MFL code ${normalizedMflCode} already exists`,
          );
        }

        facility.mflCode = normalizedMflCode;
      }
    }

    // Update facility level.
    if (level !== undefined) {
      facility.level = level;
    }

    // Update facility type.
    if (type !== undefined) {
      facility.type = type;
    }

    // Update facility ownership.
    if (ownership !== undefined) {
      facility.ownership = ownership;
    }

    // Update active status.
    if (isActive !== undefined) {
      facility.isActive = isActive;
    }

    try {
      return await this.facilityRepository.save(facility);
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException(
          'A facility with this MFL code already exists',
        );
      }

      throw error;
    }
  }
}
