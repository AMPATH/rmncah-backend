import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, QueryFailedError, Repository } from 'typeorm';

import { PrimaryCareNetwork } from './entities/primary-care-network.entity.js';
import { FacilityPcnMembership } from './entities/facility-pcn-membership.entity.js';

import { Facility } from '../../facilities/entities/facility.entity.js';
import { SubCounty } from '../../locations/sub-counties/entities/sub-county.entity.js';

import { CreatePrimaryCareNetworkDto } from './dto/create-pcn.dto.js';
import { UpdatePrimaryCareNetworkDto } from './dto/update-pcn.dto.js';
import { ListPrimaryCareNetworksQueryDto } from './dto/list-primary-care-networks-query.dto.js';
import { AssignFacilityToPcnDto } from './dto/assign-facility-to-pcn.dto.js';

@Injectable()
export class PcnsService {
  constructor(
    @InjectRepository(PrimaryCareNetwork)
    private readonly pcnRepository: Repository<PrimaryCareNetwork>,

    @InjectRepository(FacilityPcnMembership)
    private readonly membershipRepository: Repository<FacilityPcnMembership>,

    @InjectRepository(Facility)
    private readonly facilityRepository: Repository<Facility>,

    @InjectRepository(SubCounty)
    private readonly subCountyRepository: Repository<SubCounty>,

    private readonly dataSource: DataSource,
  ) {}

  // Check whether a MySQL duplicate-entry error occurred.
  private isDuplicateEntryError(error: unknown): boolean {
    if (!(error instanceof QueryFailedError)) {
      return false;
    }

    const driverError = error.driverError as {
      code?: string;
      errno?: number;
    };

    return driverError.code === 'ER_DUP_ENTRY' || driverError.errno === 1062;
  }

  // CREATE PCN
  async create(dto: CreatePrimaryCareNetworkDto): Promise<PrimaryCareNetwork> {
    const subCounty = await this.subCountyRepository.findOne({
      where: { id: dto.subCountyId },
    });

    if (!subCounty) {
      throw new NotFoundException('Sub-county not found');
    }

    const pcn = this.pcnRepository.create({
      subCountyId: dto.subCountyId,
      name: dto.name.trim(),
      code: dto.code?.trim() || null,
      isActive: true,
    });

    try {
      return await this.pcnRepository.save(pcn);
    } catch (error) {
      if (this.isDuplicateEntryError(error)) {
        throw new ConflictException(
          'A PCN with this name in the sub-county or this code already exists',
        );
      }

      throw error;
    }
  }

  // LIST AND SEARCH PCNs
  async findAll(query: ListPrimaryCareNetworksQueryDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    const sortColumns: Record<string, string> = {
      name: 'pcn.name',
      code: 'pcn.code',
      createdAt: 'pcn.createdAt',
      updatedAt: 'pcn.updatedAt',
    };

    const sortBy = sortColumns[query.sortBy ?? 'createdAt']
      ? (query.sortBy ?? 'createdAt')
      : 'createdAt';

    const sortOrder = query.sortOrder === 'ASC' ? 'ASC' : 'DESC';

    const queryBuilder = this.pcnRepository
      .createQueryBuilder('pcn')
      .leftJoinAndSelect('pcn.subCounty', 'subCounty');

    if (query.subCountyId) {
      queryBuilder.andWhere('pcn.subCountyId = :subCountyId', {
        subCountyId: query.subCountyId,
      });
    }

    if (query.isActive !== undefined) {
      queryBuilder.andWhere('pcn.isActive = :isActive', {
        isActive: query.isActive === 'true',
      });
    }

    if (query.search?.trim()) {
      queryBuilder.andWhere(
        `(LOWER(pcn.name) LIKE LOWER(:search)
          OR LOWER(pcn.code) LIKE LOWER(:search))`,
        { search: `%${query.search.trim()}%` },
      );
    }

    queryBuilder.orderBy(sortColumns[sortBy], sortOrder).skip(skip).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // GET ONE PCN
  async findOne(id: string): Promise<PrimaryCareNetwork> {
    const pcn = await this.pcnRepository
      .createQueryBuilder('pcn')
      .leftJoinAndSelect('pcn.subCounty', 'subCounty')
      .leftJoinAndSelect(
        'pcn.facilityMemberships',
        'membership',
        'membership.endedAt IS NULL',
      )
      .leftJoinAndSelect('membership.facility', 'facility')
      .where('pcn.id = :id', { id })
      .getOne();

    if (!pcn) {
      throw new NotFoundException('Primary Care Network not found');
    }

    return pcn;
  }

  // UPDATE PCN
  async update(
    id: string,
    dto: UpdatePrimaryCareNetworkDto,
  ): Promise<PrimaryCareNetwork> {
    const pcn = await this.pcnRepository.findOne({
      where: { id },
    });

    if (!pcn) {
      throw new NotFoundException('Primary Care Network not found');
    }

    if (dto.subCountyId && dto.subCountyId !== pcn.subCountyId) {
      const subCounty = await this.subCountyRepository.findOne({
        where: { id: dto.subCountyId },
      });

      if (!subCounty) {
        throw new NotFoundException('Sub-county not found');
      }

      const activeMembershipCount = await this.membershipRepository.count({
        where: {
          pcnId: id,
          endedAt: IsNull(),
        },
      });

      if (activeMembershipCount > 0) {
        throw new BadRequestException(
          'Transfer all facilities out of this PCN before changing its sub-county',
        );
      }

      pcn.subCountyId = dto.subCountyId;
    }

    if (dto.name !== undefined) {
      pcn.name = dto.name.trim();
    }

    if (dto.code !== undefined) {
      pcn.code = dto.code.trim() || null;
    }

    if (dto.isActive !== undefined) {
      if (!dto.isActive) {
        const activeMembershipCount = await this.membershipRepository.count({
          where: {
            pcnId: id,
            endedAt: IsNull(),
          },
        });

        if (activeMembershipCount > 0) {
          throw new BadRequestException(
            'Transfer all facilities out of this PCN before deactivating it',
          );
        }
      }

      pcn.isActive = dto.isActive;
    }

    try {
      await this.pcnRepository.save(pcn);
      return this.findOne(id);
    } catch (error) {
      if (this.isDuplicateEntryError(error)) {
        throw new ConflictException(
          'A PCN with this name in the sub-county or this code already exists',
        );
      }

      throw error;
    }
  }

  // ASSIGN OR TRANSFER A FACILITY TO A PCN
  async assignFacility(
    dto: AssignFacilityToPcnDto,
  ): Promise<FacilityPcnMembership> {
    let membershipId: string;

    try {
      membershipId = await this.dataSource.transaction(async (manager) => {
        const facilityRepo = manager.getRepository(Facility);
        const pcnRepo = manager.getRepository(PrimaryCareNetwork);
        const membershipRepo = manager.getRepository(FacilityPcnMembership);

        // Lock the facility row to prevent simultaneous assignments.
        const facility = await facilityRepo.findOne({
          where: { id: dto.facilityId },
          lock: { mode: 'pessimistic_write' },
        });

        if (!facility) {
          throw new NotFoundException('Facility not found');
        }

        if (!facility.isActive) {
          throw new BadRequestException(
            'Cannot assign an inactive facility to a PCN',
          );
        }

        const pcn = await pcnRepo.findOne({
          where: { id: dto.pcnId },
        });

        if (!pcn) {
          throw new NotFoundException('Primary Care Network not found');
        }

        if (!pcn.isActive) {
          throw new BadRequestException(
            'Cannot assign a facility to an inactive PCN',
          );
        }

        if (facility.subCountyId !== pcn.subCountyId) {
          throw new BadRequestException(
            'The facility and PCN must belong to the same sub-county',
          );
        }

        const currentMembership = await membershipRepo.findOne({
          where: {
            facilityId: dto.facilityId,
            endedAt: IsNull(),
          },
        });

        if (currentMembership?.pcnId === dto.pcnId) {
          throw new ConflictException(
            'This facility is already assigned to this PCN',
          );
        }

        // Close the previous membership when transferring.
        if (currentMembership) {
          currentMembership.endedAt = new Date();
          await membershipRepo.save(currentMembership);
        }

        // Create a new membership to preserve assignment history.
        const newMembership = membershipRepo.create({
          facilityId: dto.facilityId,
          pcnId: dto.pcnId,
          endedAt: null,
        });

        const savedMembership = await membershipRepo.save(newMembership);

        return savedMembership.id;
      });
    } catch (error) {
      if (this.isDuplicateEntryError(error)) {
        throw new ConflictException(
          'This facility already has an active PCN assignment',
        );
      }

      throw error;
    }

    const membership = await this.membershipRepository.findOne({
      where: { id: membershipId },
      relations: {
        facility: true,
        pcn: true,
      },
    });

    if (!membership) {
      throw new NotFoundException('Facility PCN membership not found');
    }

    return membership;
  }
}
