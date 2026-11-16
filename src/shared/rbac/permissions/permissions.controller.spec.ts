import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';

import { PermissionsController } from './permissions.controller.js';
import { PermissionsService } from './permissions.service.js';
import { SystemModule } from '../enum/system-module.enum.js';

describe('PermissionsController', () => {
  let controller: PermissionsController;

  const mockPermissionsService = {
    findAll: vi.fn(),
    findByCode: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    controller = new PermissionsController(
      mockPermissionsService as unknown as PermissionsService,
    );
  });

  describe('findAll', () => {
    it('should return all permissions', async () => {
      const permissions = [
        { id: '1', code: 'mpdsr.incident.create' },
        { id: '2', code: 'emonc.cohort.manage' },
      ];

      mockPermissionsService.findAll.mockResolvedValue(permissions);

      const result = await controller.findAll();

      expect(result).toEqual(permissions);
      expect(mockPermissionsService.findAll).toHaveBeenCalledWith(undefined);
    });

    it('should return permissions filtered by module', async () => {
      const permissions = [{ id: '1', code: 'mpdsr.incident.create' }];

      mockPermissionsService.findAll.mockResolvedValue(permissions);

      const result = await controller.findAll(SystemModule.MPDSR);

      expect(result).toEqual(permissions);
      expect(mockPermissionsService.findAll).toHaveBeenCalledWith(
        SystemModule.MPDSR,
      );
    });
  });

  describe('findByCode', () => {
    it('should return a permission when found', async () => {
      const permission = {
        id: '1',
        code: 'mpdsr.incident.create',
      };

      mockPermissionsService.findByCode.mockResolvedValue(permission);

      const result = await controller.findByCode('mpdsr.incident.create');

      expect(result).toEqual(permission);
    });

    it('should throw NotFoundException when permission is not found', async () => {
      mockPermissionsService.findByCode.mockResolvedValue(null);

      await expect(controller.findByCode('unknown.permission')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
