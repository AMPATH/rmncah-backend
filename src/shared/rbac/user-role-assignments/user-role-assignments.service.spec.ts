import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { User } from '../../users/entities/user.entity.js';
import { UserOrganizationAssignment } from '../../user-organization-assignments/entities/user-organization-assignment.entity.js';
import { OrganizationLevel } from '../../user-organization-assignments/enum/organization-level.enum.js';

import { Role } from '../roles/entities/role.entity.js';
import { SystemModule } from '../enum/system-module.enum.js';

import { UserRoleAssignment } from './entities/user-role-assignment.entity.js';
import { CreateUserRoleAssignmentDto } from './dto/create-user-role-assignment.dto.js';
import { UserRoleAssignmentsService } from './user-role-assignments.service.js';

describe('UserRoleAssignmentsService', () => {
  let service: UserRoleAssignmentsService;

  let assignmentRepository: {
    create: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
    find: ReturnType<typeof vi.fn>;
    findOne: ReturnType<typeof vi.fn>;
    createQueryBuilder: ReturnType<typeof vi.fn>;
  };

  let userRepository: {
    findOne: ReturnType<typeof vi.fn>;
  };

  let roleRepository: {
    findOne: ReturnType<typeof vi.fn>;
  };

  let organizationAssignmentRepository: {
    findOne: ReturnType<typeof vi.fn>;
  };

  let queryBuilder: {
    where: ReturnType<typeof vi.fn>;
    andWhere: ReturnType<typeof vi.fn>;
    getOne: ReturnType<typeof vi.fn>;
  };

  const userId = '11111111-1111-4111-8111-111111111111';
  const assignedBy = '99999999-9999-4999-8999-999999999999';
  const roleId = '22222222-2222-4222-8222-222222222222';
  const organizationAssignmentId = '33333333-3333-4333-8333-333333333333';
  const assignmentId = '44444444-4444-4444-8444-444444444444';

  const dto: CreateUserRoleAssignmentDto = {
    userId,
    roleId,
    organizationAssignmentId,
  };

  const user = {
    id: userId,
  } as User;

  const facilityRole = {
    id: roleId,
    code: 'FACILITY_REPORTER',
    name: 'Facility Reporter',
    module: SystemModule.MPDSR,
    isActive: true,
  } as Role;

  const organizationAssignment = {
    id: organizationAssignmentId,
    userId,
    level: OrganizationLevel.FACILITY,
    startDate: new Date('2025-01-01T00:00:00.000Z'),
    endDate: null,
  } as UserOrganizationAssignment;

  beforeEach(async () => {
    queryBuilder = {
      where: vi.fn(),
      andWhere: vi.fn(),
      getOne: vi.fn(),
    };

    queryBuilder.where.mockReturnValue(queryBuilder);
    queryBuilder.andWhere.mockReturnValue(queryBuilder);
    queryBuilder.getOne.mockResolvedValue(null);

    assignmentRepository = {
      create: vi.fn((data) => data),
      save: vi.fn(),
      find: vi.fn(),
      findOne: vi.fn(),
      createQueryBuilder: vi.fn().mockReturnValue(queryBuilder),
    };

    userRepository = {
      findOne: vi.fn(),
    };

    roleRepository = {
      findOne: vi.fn(),
    };

    organizationAssignmentRepository = {
      findOne: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserRoleAssignmentsService,
        {
          provide: getRepositoryToken(UserRoleAssignment),
          useValue: assignmentRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: userRepository,
        },
        {
          provide: getRepositoryToken(Role),
          useValue: roleRepository,
        },
        {
          provide: getRepositoryToken(UserOrganizationAssignment),
          useValue: organizationAssignmentRepository,
        },
      ],
    }).compile();

    service = module.get<UserRoleAssignmentsService>(
      UserRoleAssignmentsService,
    );

    userRepository.findOne.mockResolvedValue(user);
    roleRepository.findOne.mockResolvedValue(facilityRole);
    organizationAssignmentRepository.findOne.mockResolvedValue(
      organizationAssignment,
    );

    assignmentRepository.save.mockImplementation(async (data) => data);
  });

  describe('assignRole', () => {
    it('should assign a facility role successfully', async () => {
      const result = await service.assignRole(dto, assignedBy);

      expect(result).toMatchObject({
        userId,
        roleId,
        organizationAssignmentId,
        assignedBy,
        expiresAt: null,
      });

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: userId },
      });

      expect(roleRepository.findOne).toHaveBeenCalledWith({
        where: { id: roleId },
      });

      expect(organizationAssignmentRepository.findOne).toHaveBeenCalledWith({
        where: { id: organizationAssignmentId },
      });

      expect(assignmentRepository.save).toHaveBeenCalled();
    });

    it('should prevent a user from assigning a role to themselves', async () => {
      await expect(
        service.assignRole(
          {
            ...dto,
            userId: assignedBy,
          },
          assignedBy,
        ),
      ).rejects.toThrow(BadRequestException);

      expect(userRepository.findOne).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when the target user does not exist', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.assignRole(dto, assignedBy)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when the role does not exist', async () => {
      roleRepository.findOne.mockResolvedValue(null);

      await expect(service.assignRole(dto, assignedBy)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should reject an inactive role', async () => {
      roleRepository.findOne.mockResolvedValue({
        ...facilityRole,
        isActive: false,
      });

      await expect(service.assignRole(dto, assignedBy)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should reject a role without a configured scope rule', async () => {
      roleRepository.findOne.mockResolvedValue({
        ...facilityRole,
        code: 'UNKNOWN_ROLE',
      });

      await expect(service.assignRole(dto, assignedBy)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should reject a role assigned under the wrong module', async () => {
      roleRepository.findOne.mockResolvedValue({
        ...facilityRole,
        module: SystemModule.EMONC,
      });

      await expect(service.assignRole(dto, assignedBy)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should reject an operational role without an organizational assignment', async () => {
      const { organizationAssignmentId: omitted, ...dtoWithoutOrganization } =
        dto;

      await expect(
        service.assignRole(dtoWithoutOrganization, assignedBy),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject a platform role with an organizational assignment', async () => {
      roleRepository.findOne.mockResolvedValue({
        id: roleId,
        code: 'SYSTEM_ADMIN',
        module: SystemModule.PLATFORM,
        isActive: true,
      });

      await expect(service.assignRole(dto, assignedBy)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should allow a platform role without an organizational assignment', async () => {
      roleRepository.findOne.mockResolvedValue({
        id: roleId,
        code: 'SYSTEM_ADMIN',
        module: SystemModule.PLATFORM,
        isActive: true,
      });

      const { organizationAssignmentId: omitted, ...platformDto } = dto;

      const result = await service.assignRole(platformDto, assignedBy);

      expect(result).toMatchObject({
        userId,
        roleId,
        organizationAssignmentId: null,
        assignedBy,
      });

      expect(organizationAssignmentRepository.findOne).not.toHaveBeenCalled();
    });

    it('should reject a missing organizational assignment', async () => {
      organizationAssignmentRepository.findOne.mockResolvedValue(null);

      await expect(service.assignRole(dto, assignedBy)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should reject an organizational assignment belonging to another user', async () => {
      organizationAssignmentRepository.findOne.mockResolvedValue({
        ...organizationAssignment,
        userId: assignedBy,
      });

      await expect(service.assignRole(dto, assignedBy)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should reject an organizational assignment with the wrong level', async () => {
      organizationAssignmentRepository.findOne.mockResolvedValue({
        ...organizationAssignment,
        level: OrganizationLevel.COUNTY,
      });

      await expect(service.assignRole(dto, assignedBy)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should reject an ended organizational assignment', async () => {
      organizationAssignmentRepository.findOne.mockResolvedValue({
        ...organizationAssignment,
        endDate: new Date('2026-01-01T00:00:00.000Z'),
      });

      await expect(service.assignRole(dto, assignedBy)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should reject an organizational assignment that has not started', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);

      organizationAssignmentRepository.findOne.mockResolvedValue({
        ...organizationAssignment,
        startDate: futureDate,
      });

      await expect(service.assignRole(dto, assignedBy)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should reject an expiry date in the past', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      await expect(
        service.assignRole(
          {
            ...dto,
            expiresAt: pastDate.toISOString(),
          },
          assignedBy,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject an expiry date equal to the current time', async () => {
      const pastDate = new Date(Date.now() - 1000);

      await expect(
        service.assignRole(
          {
            ...dto,
            expiresAt: pastDate.toISOString(),
          },
          assignedBy,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject a duplicate active role assignment', async () => {
      queryBuilder.getOne.mockResolvedValue({
        id: assignmentId,
      });

      await expect(service.assignRole(dto, assignedBy)).rejects.toThrow(
        ConflictException,
      );

      expect(assignmentRepository.save).not.toHaveBeenCalled();
    });

    it('should check duplicate assignments using the same organizational scope', async () => {
      await service.assignRole(dto, assignedBy);

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'assignment.organizationAssignmentId = :organizationAssignmentId',
        { organizationAssignmentId },
      );
    });

    it('should check duplicate platform assignments with a null organizational scope', async () => {
      roleRepository.findOne.mockResolvedValue({
        id: roleId,
        code: 'SYSTEM_ADMIN',
        module: SystemModule.PLATFORM,
        isActive: true,
      });

      const { organizationAssignmentId: omitted, ...platformDto } = dto;

      await service.assignRole(platformDto, assignedBy);

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'assignment.organizationAssignmentId IS NULL',
      );
    });

    it('should save an assignment with an expiry date', async () => {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      const result = await service.assignRole(
        {
          ...dto,
          expiresAt: expiresAt.toISOString(),
        },
        assignedBy,
      );

      expect(result.expiresAt).toEqual(expiresAt);
      expect(assignmentRepository.save).toHaveBeenCalled();
    });

    it('should query only non-revoked and non-expired duplicate assignments', async () => {
      await service.assignRole(dto, assignedBy);

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'assignment.revokedAt IS NULL',
      );

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        '(assignment.expiresAt IS NULL OR assignment.expiresAt > :now)',
        expect.objectContaining({
          now: expect.any(Date),
        }),
      );
    });
  });

  describe('findAll', () => {
    it('should return all role assignments with their relations', async () => {
      const assignments = [{ id: assignmentId }];
      assignmentRepository.find.mockResolvedValue(assignments);

      const result = await service.findAll();

      expect(result).toEqual(assignments);
      expect(assignmentRepository.find).toHaveBeenCalledWith({
        relations: {
          user: true,
          role: true,
          organizationAssignment: true,
        },
        order: {
          assignedAt: 'DESC',
        },
      });
    });
  });

  describe('findOne', () => {
    it('should return one role assignment', async () => {
      const assignment = { id: assignmentId };
      assignmentRepository.findOne.mockResolvedValue(assignment);

      const result = await service.findOne(assignmentId);

      expect(result).toEqual(assignment);
    });

    it('should throw NotFoundException when the assignment does not exist', async () => {
      assignmentRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(assignmentId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findUserAssignments', () => {
    it('should return assignments belonging to a user', async () => {
      const assignments = [{ id: assignmentId, userId }];
      assignmentRepository.find.mockResolvedValue(assignments);

      const result = await service.findUserAssignments(userId);

      expect(result).toEqual(assignments);

      expect(assignmentRepository.find).toHaveBeenCalledWith({
        where: { userId },
        relations: {
          role: true,
          organizationAssignment: true,
        },
        order: {
          assignedAt: 'DESC',
        },
      });
    });

    it('should throw NotFoundException when the user does not exist', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.findUserAssignments(userId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('revokeRole', () => {
    it('should revoke an existing role assignment', async () => {
      const assignment = {
        id: assignmentId,
        revokedAt: null,
        revokedBy: null,
      };

      vi.spyOn(service, 'findOne').mockResolvedValue(
        assignment as UserRoleAssignment,
      );

      assignmentRepository.save.mockImplementation(async (data) => data);

      const result = await service.revokeRole(assignmentId, assignedBy);

      expect(result.revokedBy).toBe(assignedBy);
      expect(result.revokedAt).toBeInstanceOf(Date);
      expect(assignmentRepository.save).toHaveBeenCalledWith(assignment);
    });

    it('should reject an assignment that has already been revoked', async () => {
      const assignment = {
        id: assignmentId,
        revokedAt: new Date(),
        revokedBy: assignedBy,
      };

      vi.spyOn(service, 'findOne').mockResolvedValue(
        assignment as UserRoleAssignment,
      );

      await expect(
        service.revokeRole(assignmentId, assignedBy),
      ).rejects.toThrow(ConflictException);

      expect(assignmentRepository.save).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when the assignment does not exist', async () => {
      vi.spyOn(service, 'findOne').mockRejectedValue(
        new NotFoundException('Role assignment not found'),
      );

      await expect(
        service.revokeRole(assignmentId, assignedBy),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
