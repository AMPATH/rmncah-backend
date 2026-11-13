import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';

import { RolePermissionsService } from './role-permissions.service.js';
import { RolePermission } from './entities/role-permission.entity.js';
import { Role } from '../roles/entities/role.entity.js';
import { Permission } from '../permissions/entities/permission.entity.js';

describe('RolePermissionsService', () => {
  let service: RolePermissionsService;

  // Mock repositories to avoid connecting to the database.
  const mockRolePermissionRepository = {
    find: vi.fn(),
    create: vi.fn((data) => data),
    save: vi.fn(),
    delete: vi.fn(),
  };

  const mockRoleRepository = {
    findOne: vi.fn(),
  };

  const mockPermissionRepository = {
    find: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolePermissionsService,
        {
          provide: getRepositoryToken(RolePermission),
          useValue: mockRolePermissionRepository,
        },
        {
          provide: getRepositoryToken(Role),
          useValue: mockRoleRepository,
        },
        {
          provide: getRepositoryToken(Permission),
          useValue: mockPermissionRepository,
        },
      ],
    }).compile();

    service = module.get<RolePermissionsService>(RolePermissionsService);

    // Reset mocks before every test.
    vi.resetAllMocks();

    // Restore the create mock implementation after resetting.
    mockRolePermissionRepository.create.mockImplementation((data) => data);
  });

  describe('initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });
  });

  describe('findRolePermissions', () => {
    it('should return permissions assigned to a role', async () => {
      const role = { id: 'role-id' };

      const assignments = [
        { roleId: 'role-id', permissionId: 'permission-id' },
      ];

      mockRoleRepository.findOne.mockResolvedValue(role);

      mockRolePermissionRepository.find.mockResolvedValue(assignments);

      await expect(service.findRolePermissions('role-id')).resolves.toEqual(
        assignments,
      );

      expect(mockRolePermissionRepository.find).toHaveBeenCalledWith({
        where: { roleId: 'role-id' },
        relations: { permission: true },
      });
    });

    it('should throw NotFoundException when the role does not exist', async () => {
      mockRoleRepository.findOne.mockResolvedValue(null);

      await expect(
        service.findRolePermissions('role-id'),
      ).rejects.toThrow(NotFoundException);

      expect(mockRolePermissionRepository.find).not.toHaveBeenCalled();
    });
  });

  describe('assignPermissions', () => {
    it('should assign new permissions to a role', async () => {
      const role = {
        id: 'role-id',
        code: 'FACILITY_CHAIR',
        module: 'MPDSR',
      };

      const permission = {
        id: 'permission-id',
        code: 'mpdsr.cases.read',
        module: 'MPDSR',
      };

      const assignments = [
        { roleId: 'role-id', permissionId: 'permission-id' },
      ];

      mockRoleRepository.findOne.mockResolvedValue(role);

      mockPermissionRepository.find.mockResolvedValue([permission]);

      mockRolePermissionRepository.find
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce(assignments);

      mockRolePermissionRepository.save.mockResolvedValue(assignments);

      await expect(
        service.assignPermissions('role-id', {
          permissionIds: ['permission-id'],
        }),
      ).resolves.toEqual(assignments);

      expect(mockRolePermissionRepository.create).toHaveBeenCalledWith({
        roleId: 'role-id',
        permissionId: 'permission-id',
      });

      expect(mockRolePermissionRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should throw when the role does not exist', async () => {
      mockRoleRepository.findOne.mockResolvedValue(null);

      await expect(
        service.assignPermissions('role-id', {
          permissionIds: ['permission-id'],
        }),
      ).rejects.toThrow(NotFoundException);

      expect(mockPermissionRepository.find).not.toHaveBeenCalled();
    });

    it('should throw when no permission IDs are supplied', async () => {
      mockRoleRepository.findOne.mockResolvedValue({
        id: 'role-id',
        code: 'FACILITY_CHAIR',
        module: 'MPDSR',
      });

      await expect(
        service.assignPermissions('role-id', {
          permissionIds: [],
        }),
      ).rejects.toThrow('At least one permission must be supplied.');

      expect(mockPermissionRepository.find).not.toHaveBeenCalled();
    });

    it('should throw when a permission does not exist', async () => {
      mockRoleRepository.findOne.mockResolvedValue({
        id: 'role-id',
        code: 'FACILITY_CHAIR',
        module: 'MPDSR',
      });

      mockPermissionRepository.find.mockResolvedValue([]);

      await expect(
        service.assignPermissions('role-id', {
          permissionIds: ['permission-id'],
        }),
      ).rejects.toThrow(NotFoundException);

      expect(mockRolePermissionRepository.save).not.toHaveBeenCalled();
    });

    it('should reject permissions belonging to another module', async () => {
      mockRoleRepository.findOne.mockResolvedValue({
        id: 'role-id',
        code: 'FACILITY_CHAIR',
        module: 'MPDSR',
      });

      mockPermissionRepository.find.mockResolvedValue([
        {
          id: 'permission-id',
          code: 'emonc.modules.read',
          module: 'EMONC',
        },
      ]);

      await expect(
        service.assignPermissions('role-id', {
          permissionIds: ['permission-id'],
        }),
      ).rejects.toThrow(/cannot receive permissions from another module/);

      expect(mockRolePermissionRepository.save).not.toHaveBeenCalled();
    });

    it('should ignore duplicate permission IDs in the request', async () => {
      const role = {
        id: 'role-id',
        code: 'FACILITY_CHAIR',
        module: 'MPDSR',
      };

      const permission = {
        id: 'permission-id',
        code: 'mpdsr.cases.read',
        module: 'MPDSR',
      };

      const assignments = [
        { roleId: 'role-id', permissionId: 'permission-id' },
      ];

      mockRoleRepository.findOne.mockResolvedValue(role);

      mockPermissionRepository.find.mockResolvedValue([permission]);

      mockRolePermissionRepository.find
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce(assignments);

      mockRolePermissionRepository.save.mockResolvedValue(assignments);

      await service.assignPermissions('role-id', {
        permissionIds: [
          'permission-id',
          'permission-id',
        ],
      });

      expect(mockPermissionRepository.find).toHaveBeenCalledWith({
        where: {
          id: expect.anything(),
        },
      });

      expect(mockRolePermissionRepository.create).toHaveBeenCalledTimes(1);

      expect(mockRolePermissionRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should not create duplicate permission assignments', async () => {
      const existing = [
        { roleId: 'role-id', permissionId: 'permission-id' },
      ];

      mockRoleRepository.findOne.mockResolvedValue({
        id: 'role-id',
        code: 'FACILITY_CHAIR',
        module: 'MPDSR',
      });

      mockPermissionRepository.find.mockResolvedValue([
        {
          id: 'permission-id',
          code: 'mpdsr.cases.read',
          module: 'MPDSR',
        },
      ]);

      mockRolePermissionRepository.find
        .mockResolvedValueOnce(existing)
        .mockResolvedValueOnce(existing);

      await service.assignPermissions('role-id', {
        permissionIds: ['permission-id'],
      });

      expect(mockRolePermissionRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('removePermission', () => {
    it('should remove a permission assignment', async () => {
      mockRoleRepository.findOne.mockResolvedValue({
        id: 'role-id',
      });

      mockRolePermissionRepository.delete.mockResolvedValue({
        affected: 1,
      });

      await expect(
        service.removePermission('role-id', 'permission-id'),
      ).resolves.toBeUndefined();

      expect(mockRoleRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'role-id' },
      });

      expect(mockRolePermissionRepository.delete).toHaveBeenCalledWith({
        roleId: 'role-id',
        permissionId: 'permission-id',
      });
    });

    it('should throw when the role does not exist', async () => {
      mockRoleRepository.findOne.mockResolvedValue(null);

      await expect(
        service.removePermission('role-id', 'permission-id'),
      ).rejects.toThrow('Role not found.');

      expect(mockRolePermissionRepository.delete).not.toHaveBeenCalled();
    });

    it('should throw when the permission assignment does not exist', async () => {
      mockRoleRepository.findOne.mockResolvedValue({
        id: 'role-id',
      });

      mockRolePermissionRepository.delete.mockResolvedValue({
        affected: 0,
      });

      await expect(
        service.removePermission('role-id', 'permission-id'),
      ).rejects.toThrow(
        'Permission assignment not found for this role.',
      );
    });
  });
});
