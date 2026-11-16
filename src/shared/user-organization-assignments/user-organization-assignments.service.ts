import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, QueryFailedError, Repository } from 'typeorm';

import { User } from '../users/entities/user.entity.js';
import { County } from '../../locations/counties/entities/county.entity.js';
import { SubCounty } from '../../locations/sub-counties/entities/sub-county.entity.js';
import { PrimaryCareNetwork } from '../../mpdsr/pcns/entities/primary-care-network.entity.js';
import { Facility } from '../../facilities/entities/facility.entity.js';
import { CommunityUnit } from '../../locations/community-units/entities/community-unit.entity.js';

import { UserOrganizationAssignment } from './entities/user-organization-assignment.entity.js';
import { CreateUserOrganizationAssignmentDto } from './dto/create-user-organization-assignment.dto.js';
import { OrganizationLevel } from './enum/organization-level.enum.js';

type OrganizationField =
  'countyId' | 'subCountyId' | 'pcnId' | 'facilityId' | 'communityUnitId';

@Injectable()
export class UserOrganizationAssignmentsService {
  constructor(
    @InjectRepository(UserOrganizationAssignment)
    private readonly assignmentRepository: Repository<UserOrganizationAssignment>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(County)
    private readonly countyRepository: Repository<County>,

    @InjectRepository(SubCounty)
    private readonly subCountyRepository: Repository<SubCounty>,

    @InjectRepository(PrimaryCareNetwork)
    private readonly pcnRepository: Repository<PrimaryCareNetwork>,

    @InjectRepository(Facility)
    private readonly facilityRepository: Repository<Facility>,

    @InjectRepository(CommunityUnit)
    private readonly communityUnitRepository: Repository<CommunityUnit>,
  ) {}

  private getOrganizationTarget(dto: CreateUserOrganizationAssignmentDto): {
    field: OrganizationField;
    id: string;
  } {
    const targets: { field: OrganizationField; id?: string }[] = [
      { field: 'countyId', id: dto.countyId },
      { field: 'subCountyId', id: dto.subCountyId },
      { field: 'pcnId', id: dto.pcnId },
      { field: 'facilityId', id: dto.facilityId },
      { field: 'communityUnitId', id: dto.communityUnitId },
    ];

    const suppliedTargets = targets.filter((target) => target.id);

    if (suppliedTargets.length !== 1) {
      throw new BadRequestException(
        'Exactly one organization ID must be provided',
      );
    }

    const target = suppliedTargets[0];

    const expectedFields: Record<OrganizationLevel, OrganizationField> = {
      [OrganizationLevel.COUNTY]: 'countyId',
      [OrganizationLevel.SUB_COUNTY]: 'subCountyId',
      [OrganizationLevel.PCN]: 'pcnId',
      [OrganizationLevel.FACILITY]: 'facilityId',
      [OrganizationLevel.COMMUNITY]: 'communityUnitId',
    };

    if (target.field !== expectedFields[dto.level]) {
      throw new BadRequestException(
        'The organization ID does not match the selected organization level',
      );
    }

    return { field: target.field, id: target.id! };
  }

  private async validateOrganization(
    field: OrganizationField,
    id: string,
  ): Promise<void> {
    let exists = false;

    switch (field) {
      case 'countyId':
        exists = !!(await this.countyRepository.findOne({
          where: { id },
        }));
        break;

      case 'subCountyId':
        exists = !!(await this.subCountyRepository.findOne({
          where: { id },
        }));
        break;

      case 'pcnId':
        exists = !!(await this.pcnRepository.findOne({
          where: { id, isActive: true },
        }));
        break;

      case 'facilityId':
        exists = !!(await this.facilityRepository.findOne({
          where: { id, isActive: true },
        }));
        break;

      case 'communityUnitId':
        exists = !!(await this.communityUnitRepository.findOne({
          where: { id, isActive: true },
        }));
        break;
    }

    if (!exists) {
      throw new NotFoundException('Organization not found or inactive');
    }
  }

  async create(
    dto: CreateUserOrganizationAssignmentDto,
    assignedBy: string | null = null,
  ): Promise<UserOrganizationAssignment> {
    const user = await this.userRepository.findOne({
      where: { id: dto.userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const target = this.getOrganizationTarget(dto);

    await this.validateOrganization(target.field, target.id);

    const existingAssignment = await this.assignmentRepository
      .createQueryBuilder('assignment')
      .where('assignment.userId = :userId', { userId: dto.userId })
      .andWhere(`assignment.${target.field} = :organizationId`, {
        organizationId: target.id,
      })
      .andWhere('assignment.endDate IS NULL')
      .getOne();

    if (existingAssignment) {
      throw new ConflictException(
        'User already has an active assignment to this organization',
      );
    }

    const startDate = dto.startDate ? new Date(dto.startDate) : new Date();

    if (Number.isNaN(startDate.getTime())) {
      throw new BadRequestException('Invalid assignment start date');
    }

    const assignment = this.assignmentRepository.create({
      userId: dto.userId,
      level: dto.level,
      countyId: target.field === 'countyId' ? target.id : null,
      subCountyId: target.field === 'subCountyId' ? target.id : null,
      pcnId: target.field === 'pcnId' ? target.id : null,
      facilityId: target.field === 'facilityId' ? target.id : null,
      communityUnitId: target.field === 'communityUnitId' ? target.id : null,
      startDate,
      endDate: null,
      assignedBy,
    });

    try {
      return await this.assignmentRepository.save(assignment);
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error as QueryFailedError & { driverError?: { code?: string } })
          .driverError?.code === 'ER_DUP_ENTRY'
      ) {
        throw new ConflictException(
          'User already has an active assignment to this organization',
        );
      }

      throw error;
    }
  }

  async findAll(): Promise<UserOrganizationAssignment[]> {
    return this.assignmentRepository.find({
      relations: {
        user: true,
        county: true,
        subCounty: true,
        pcn: true,
        facility: true,
        communityUnit: true,
      },
      order: { createdAt: 'DESC' },
    });
  }

  async findByUser(userId: string): Promise<UserOrganizationAssignment[]> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.assignmentRepository.find({
      where: { userId },
      relations: {
        county: true,
        subCounty: true,
        pcn: true,
        facility: true,
        communityUnit: true,
      },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<UserOrganizationAssignment> {
    const assignment = await this.assignmentRepository.findOne({
      where: { id },
      relations: {
        user: true,
        county: true,
        subCounty: true,
        pcn: true,
        facility: true,
        communityUnit: true,
      },
    });

    if (!assignment) {
      throw new NotFoundException('Organization assignment not found');
    }

    return assignment;
  }

  async end(id: string, endDate?: string): Promise<UserOrganizationAssignment> {
    const assignment = await this.findOne(id);

    if (assignment.endDate) {
      throw new ConflictException('This assignment has already ended');
    }

    const effectiveEndDate = endDate ? new Date(endDate) : new Date();

    if (Number.isNaN(effectiveEndDate.getTime())) {
      throw new BadRequestException('Invalid assignment end date');
    }

    if (effectiveEndDate < assignment.startDate) {
      throw new BadRequestException(
        'Assignment end date cannot be before its start date',
      );
    }

    assignment.endDate = effectiveEndDate;

    return this.assignmentRepository.save(assignment);
  }
}
