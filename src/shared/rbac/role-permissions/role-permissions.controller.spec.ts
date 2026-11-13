import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';

import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../authorization/guards/permissions.guard.js';

import { RolePermissionsController } from './role-permissions.controller.js';
import { RolePermissionsService } from './role-permissions.service.js';

describe('RolePermissionsController', () => {
  let controller: RolePermissionsController;

  const mockRolePermissionsService = {
    findRolePermissions: vi.fn(),
    assignPermissions: vi.fn(),
    removePermission: vi.fn(),
  };

  beforeEach(async () => {
    vi.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RolePermissionsController],
      providers: [
        {
          provide: RolePermissionsService,
          useValue: mockRolePermissionsService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: vi.fn().mockReturnValue(true),
      })
      .overrideGuard(PermissionsGuard)
      .useValue({
        canActivate: vi.fn().mockReturnValue(true),
      })
      .compile();

    controller = module.get<RolePermissionsController>(
      RolePermissionsController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findRolePermissions', () => {
    it('should retrieve permissions assigned to a role', async () => {
      const assignments = [
        { roleId: 'role-id', permissionId: 'permission-id' },
      ];

      mockRolePermissionsService.findRolePermissions.mockResolvedValue(
        assignments,
      );

      await expect(controller.findRolePermissions('role-id')).resolves.toEqual(
        assignments,
      );

      expect(
        mockRolePermissionsService.findRolePermissions,
      ).toHaveBeenCalledWith('role-id');
    });
  });

  describe('assignPermissions', () => {
    it('should assign permissions to a role', async () => {
      const dto = { permissionIds: ['permission-id'] };

      mockRolePermissionsService.assignPermissions.mockResolvedValue([]);

      await controller.assignPermissions('role-id', dto);

      expect(mockRolePermissionsService.assignPermissions).toHaveBeenCalledWith(
        'role-id',
        dto,
      );
    });
  });

  describe('removePermission', () => {
    it('should remove a permission from a role', async () => {
      mockRolePermissionsService.removePermission.mockResolvedValue(undefined);

      await controller.removePermission('role-id', 'permission-id');

      expect(mockRolePermissionsService.removePermission).toHaveBeenCalledWith(
        'role-id',
        'permission-id',
      );
    });
  });
});
