import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthorizationService } from './authorization.service.js';
import { Permission } from '../permissions/entities/permission.entity.js';
import { SystemModule } from '../enum/system-module.enum.js';

describe('AuthorizationService', () => {
  let service: AuthorizationService;

  const queryBuilderMock = {
    innerJoin: vi.fn(),
    leftJoin: vi.fn(),
    where: vi.fn(),
    andWhere: vi.fn(),
    distinct: vi.fn(),
    getMany: vi.fn(),
  };

  const permissionRepositoryMock = {
    createQueryBuilder: vi.fn(),
  };

  const mpdsrPermission: Permission = {
    id: 'permission-1',
    code: 'mpdsr.cases.create',
    name: 'Create MPDSR Case',
    description: 'Allows a user to create an MPDSR case.',
    module: SystemModule.MPDSR,
    createdAt: new Date(),
    updatedAt: new Date(),
    rolePermissions: [],
  };

  const platformPermission: Permission = {
    id: 'permission-2',
    code: 'platform.users.update',
    name: 'Update Platform Users',
    description: 'Allows a user to update platform users.',
    module: SystemModule.PLATFORM,
    createdAt: new Date(),
    updatedAt: new Date(),
    rolePermissions: [],
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    queryBuilderMock.innerJoin.mockReturnValue(queryBuilderMock);
    queryBuilderMock.leftJoin.mockReturnValue(queryBuilderMock);
    queryBuilderMock.where.mockReturnValue(queryBuilderMock);
    queryBuilderMock.andWhere.mockReturnValue(queryBuilderMock);
    queryBuilderMock.distinct.mockReturnValue(queryBuilderMock);

    permissionRepositoryMock.createQueryBuilder.mockReturnValue(
      queryBuilderMock,
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthorizationService,
        {
          provide: getRepositoryToken(Permission),
          useValue: permissionRepositoryMock,
        },
      ],
    }).compile();

    service = module.get<AuthorizationService>(AuthorizationService);
  });

  describe('getUserPermissions', () => {
    it('should retrieve permissions for an MPDSR organizational assignment', async () => {
      queryBuilderMock.getMany.mockResolvedValue([mpdsrPermission]);

      const result = await service.getUserPermissions(
        'user-1',
        SystemModule.MPDSR,
        'organization-assignment-1',
      );

      expect(result).toEqual([mpdsrPermission]);

      expect(permissionRepositoryMock.createQueryBuilder).toHaveBeenCalledWith(
        'permission',
      );

      expect(queryBuilderMock.andWhere).toHaveBeenCalledWith(
        'permission.module = :module',
        { module: SystemModule.MPDSR },
      );

      expect(queryBuilderMock.andWhere).toHaveBeenCalledWith(
        'role.module = :module',
        { module: SystemModule.MPDSR },
      );

      expect(queryBuilderMock.andWhere).toHaveBeenCalledWith(
        'assignment.revokedAt IS NULL',
      );

      expect(queryBuilderMock.andWhere).toHaveBeenCalledWith(
        'assignment.organizationAssignmentId = :organizationAssignmentId',
        {
          organizationAssignmentId: 'organization-assignment-1',
        },
      );

      expect(queryBuilderMock.distinct).toHaveBeenCalledWith(true);
      expect(queryBuilderMock.getMany).toHaveBeenCalled();
    });

    it('should retrieve platform permissions without an organizational assignment', async () => {
      queryBuilderMock.getMany.mockResolvedValue([platformPermission]);

      const result = await service.getUserPermissions(
        'user-1',
        SystemModule.PLATFORM,
      );

      expect(result).toEqual([platformPermission]);

      expect(queryBuilderMock.andWhere).toHaveBeenCalledWith(
        'assignment.organizationAssignmentId IS NULL',
      );
    });

    it('should reject platform permission checks with an organizational assignment', async () => {
      await expect(
        service.getUserPermissions(
          'user-1',
          SystemModule.PLATFORM,
          'organization-assignment-1',
        ),
      ).rejects.toThrow(BadRequestException);

      expect(
        permissionRepositoryMock.createQueryBuilder,
      ).not.toHaveBeenCalled();
    });

    it('should reject module permission checks without an organizational assignment', async () => {
      await expect(
        service.getUserPermissions('user-1', SystemModule.MPDSR),
      ).rejects.toThrow(BadRequestException);

      expect(
        permissionRepositoryMock.createQueryBuilder,
      ).not.toHaveBeenCalled();
    });

    it('should exclude revoked role assignments', async () => {
      queryBuilderMock.getMany.mockResolvedValue([]);

      await service.getUserPermissions(
        'user-1',
        SystemModule.MPDSR,
        'organization-assignment-1',
      );

      expect(queryBuilderMock.andWhere).toHaveBeenCalledWith(
        'assignment.revokedAt IS NULL',
      );
    });

    it('should exclude expired role assignments', async () => {
      queryBuilderMock.getMany.mockResolvedValue([]);

      await service.getUserPermissions(
        'user-1',
        SystemModule.MPDSR,
        'organization-assignment-1',
      );

      expect(queryBuilderMock.andWhere).toHaveBeenCalledWith(
        '(assignment.expiresAt IS NULL OR assignment.expiresAt > :now)',
        {
          now: expect.any(Date),
        },
      );
    });

    it('should exclude inactive roles', async () => {
      queryBuilderMock.getMany.mockResolvedValue([]);

      await service.getUserPermissions(
        'user-1',
        SystemModule.MPDSR,
        'organization-assignment-1',
      );

      expect(queryBuilderMock.andWhere).toHaveBeenCalledWith(
        'role.isActive = :isActive',
        { isActive: true },
      );
    });

    it('should require an active organizational assignment', async () => {
      queryBuilderMock.getMany.mockResolvedValue([]);

      await service.getUserPermissions(
        'user-1',
        SystemModule.MPDSR,
        'organization-assignment-1',
      );

      expect(queryBuilderMock.andWhere).toHaveBeenCalledWith(
        'organizationAssignment.endDate IS NULL',
      );

      expect(queryBuilderMock.andWhere).toHaveBeenCalledWith(
        'organizationAssignment.startDate <= :now',
        {
          now: expect.any(Date),
        },
      );

      expect(queryBuilderMock.andWhere).toHaveBeenCalledWith(
        'organizationAssignment.userId = :userId',
        { userId: 'user-1' },
      );
    });

    it('should return an empty array when the user has no permissions', async () => {
      queryBuilderMock.getMany.mockResolvedValue([]);

      const result = await service.getUserPermissions(
        'user-1',
        SystemModule.MPDSR,
        'organization-assignment-1',
      );

      expect(result).toEqual([]);
    });
  });

  describe('hasPermission', () => {
    it('should return true when the user has the requested permission', async () => {
      queryBuilderMock.getMany.mockResolvedValue([mpdsrPermission]);

      const result = await service.hasPermission(
        'user-1',
        'mpdsr.cases.create',
        SystemModule.MPDSR,
        'organization-assignment-1',
      );

      expect(result).toBe(true);
    });

    it('should return false when the user does not have the requested permission', async () => {
      queryBuilderMock.getMany.mockResolvedValue([]);

      const result = await service.hasPermission(
        'user-1',
        'mpdsr.cases.create',
        SystemModule.MPDSR,
        'organization-assignment-1',
      );

      expect(result).toBe(false);
    });
  });

  describe('hasAnyPermission', () => {
    it('should return true when the user has at least one requested permission', async () => {
      queryBuilderMock.getMany.mockResolvedValue([mpdsrPermission]);

      const result = await service.hasAnyPermission(
        'user-1',
        ['mpdsr.cases.create', 'mpdsr.cases.delete'],
        SystemModule.MPDSR,
        'organization-assignment-1',
      );

      expect(result).toBe(true);
    });

    it('should return false when the user has none of the requested permissions', async () => {
      queryBuilderMock.getMany.mockResolvedValue([]);

      const result = await service.hasAnyPermission(
        'user-1',
        ['mpdsr.cases.create', 'mpdsr.cases.delete'],
        SystemModule.MPDSR,
        'organization-assignment-1',
      );

      expect(result).toBe(false);
    });

    it('should return false when the permission list is empty', async () => {
      const result = await service.hasAnyPermission(
        'user-1',
        [],
        SystemModule.MPDSR,
        'organization-assignment-1',
      );

      expect(result).toBe(false);

      expect(
        permissionRepositoryMock.createQueryBuilder,
      ).not.toHaveBeenCalled();
    });
  });

  describe('hasAllPermissions', () => {
    it('should return true when the user has every requested permission', async () => {
      const secondPermission: Permission = {
        ...mpdsrPermission,
        id: 'permission-3',
        code: 'mpdsr.cases.read',
      };

      queryBuilderMock.getMany.mockResolvedValue([
        mpdsrPermission,
        secondPermission,
      ]);

      const result = await service.hasAllPermissions(
        'user-1',
        ['mpdsr.cases.create', 'mpdsr.cases.read'],
        SystemModule.MPDSR,
        'organization-assignment-1',
      );

      expect(result).toBe(true);
    });

    it('should return false when the user is missing one requested permission', async () => {
      queryBuilderMock.getMany.mockResolvedValue([mpdsrPermission]);

      const result = await service.hasAllPermissions(
        'user-1',
        ['mpdsr.cases.create', 'mpdsr.cases.delete'],
        SystemModule.MPDSR,
        'organization-assignment-1',
      );

      expect(result).toBe(false);
    });

    it('should return false when the permission list is empty', async () => {
      const result = await service.hasAllPermissions(
        'user-1',
        [],
        SystemModule.MPDSR,
        'organization-assignment-1',
      );

      expect(result).toBe(false);

      expect(
        permissionRepositoryMock.createQueryBuilder,
      ).not.toHaveBeenCalled();
    });
  });
});
