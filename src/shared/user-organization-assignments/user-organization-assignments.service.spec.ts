import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { UserOrganizationAssignmentsService } from './user-organization-assignments.service.js';
import { UserOrganizationAssignment } from './entities/user-organization-assignment.entity.js';
import { CreateUserOrganizationAssignmentDto } from './dto/create-user-organization-assignment.dto.js';
import { OrganizationLevel } from './enum/organization-level.enum.js';

import { User } from '../users/entities/user.entity.js';
import { County } from '../../locations/counties/entities/county.entity.js';
import { SubCounty } from '../../locations/sub-counties/entities/sub-county.entity.js';
import { PrimaryCareNetwork } from '../../mpdsr/pcns/entities/primary-care-network.entity.js';
import { Facility } from '../../facilities/entities/facility.entity.js';
import { CommunityUnit } from '../../locations/community-units/entities/community-unit.entity.js';

describe('UserOrganizationAssignmentsService', () => {
  let service: UserOrganizationAssignmentsService;

  const assignmentRepository = {
    create: vi.fn(),
    save: vi.fn(),
    find: vi.fn(),
    findOne: vi.fn(),
    createQueryBuilder: vi.fn(),
  };

  const userRepository = {
    findOne: vi.fn(),
  };

  const countyRepository = {
    findOne: vi.fn(),
  };

  const subCountyRepository = {
    findOne: vi.fn(),
  };

  const pcnRepository = {
    findOne: vi.fn(),
  };

  const facilityRepository = {
    findOne: vi.fn(),
  };

  const communityUnitRepository = {
    findOne: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserOrganizationAssignmentsService,
        {
          provide: getRepositoryToken(UserOrganizationAssignment),
          useValue: assignmentRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: userRepository,
        },
        {
          provide: getRepositoryToken(County),
          useValue: countyRepository,
        },
        {
          provide: getRepositoryToken(SubCounty),
          useValue: subCountyRepository,
        },
        {
          provide: getRepositoryToken(PrimaryCareNetwork),
          useValue: pcnRepository,
        },
        {
          provide: getRepositoryToken(Facility),
          useValue: facilityRepository,
        },
        {
          provide: getRepositoryToken(CommunityUnit),
          useValue: communityUnitRepository,
        },
      ],
    }).compile();

    service = module.get<UserOrganizationAssignmentsService>(
      UserOrganizationAssignmentsService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const dto: CreateUserOrganizationAssignmentDto = {
      userId: '11111111-1111-4111-8111-111111111111',
      level: OrganizationLevel.COUNTY,
      countyId: '22222222-2222-4222-8222-222222222222',
    };

    it('should create a county assignment successfully', async () => {
      const user = { id: dto.userId };
      const county = { id: dto.countyId };

      const createdAssignment = {
        userId: dto.userId,
        level: dto.level,
        countyId: dto.countyId,
        subCountyId: null,
        pcnId: null,
        facilityId: null,
        communityUnitId: null,
        endDate: null,
      };

      userRepository.findOne.mockResolvedValue(user);
      countyRepository.findOne.mockResolvedValue(county);

      assignmentRepository.createQueryBuilder.mockReturnValue({
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        getOne: vi.fn().mockResolvedValue(null),
      });

      assignmentRepository.create.mockReturnValue(createdAssignment);
      assignmentRepository.save.mockResolvedValue(createdAssignment);

      const result = await service.create(dto);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: dto.userId },
      });

      expect(countyRepository.findOne).toHaveBeenCalledWith({
        where: { id: dto.countyId },
      });

      expect(assignmentRepository.create).toHaveBeenCalled();
      expect(assignmentRepository.save).toHaveBeenCalledWith(createdAssignment);
      expect(result).toEqual(createdAssignment);
    });

    it('should reject assignment when the user does not exist', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.create(dto)).rejects.toThrow('User not found');

      expect(countyRepository.findOne).not.toHaveBeenCalled();
    });

    it('should reject when the organization ID does not match the level', async () => {
      userRepository.findOne.mockResolvedValue({ id: dto.userId });

      const invalidDto = {
        ...dto,
        level: OrganizationLevel.FACILITY,
      };

      await expect(service.create(invalidDto)).rejects.toThrow(
        'The organization ID does not match the selected organization level',
      );
    });

    it('should reject when the county does not exist', async () => {
      userRepository.findOne.mockResolvedValue({ id: dto.userId });
      countyRepository.findOne.mockResolvedValue(null);

      await expect(service.create(dto)).rejects.toThrow(
        'Organization not found or inactive',
      );

      expect(assignmentRepository.save).not.toHaveBeenCalled();
    });

    it('should reject when the user already has an active assignment', async () => {
      userRepository.findOne.mockResolvedValue({ id: dto.userId });
      countyRepository.findOne.mockResolvedValue({ id: dto.countyId });

      assignmentRepository.createQueryBuilder.mockReturnValue({
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        getOne: vi.fn().mockResolvedValue({
          id: 'existing-assignment',
        }),
      });

      await expect(service.create(dto)).rejects.toThrow(
        'User already has an active assignment to this organization',
      );

      expect(assignmentRepository.save).not.toHaveBeenCalled();
    });
  });
});
