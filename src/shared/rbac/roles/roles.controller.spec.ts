import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';

import { RolesController } from './roles.controller.js';
import { RolesService } from './roles.service.js';
import { SystemModule } from '../enum/system-module.enum.js';

describe('RolesController', () => {
  let controller: RolesController;

  const mockRolesService = {
    findAll: vi.fn(),
    findByCode: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    controller = new RolesController(
      mockRolesService as unknown as RolesService,
    );
  });

  describe('findAll', () => {
    it('should return all active roles', async () => {
      const roles = [
        { id: '1', code: 'FACILITY_REPORTER' },
        { id: '2', code: 'MENTOR' },
      ];

      mockRolesService.findAll.mockResolvedValue(roles);

      const result = await controller.findAll();

      expect(result).toEqual(roles);
      expect(mockRolesService.findAll).toHaveBeenCalledWith(undefined);
    });

    it('should return roles filtered by module', async () => {
      const roles = [{ id: '1', code: 'FACILITY_REPORTER' }];

      mockRolesService.findAll.mockResolvedValue(roles);

      const result = await controller.findAll(SystemModule.MPDSR);

      expect(result).toEqual(roles);
      expect(mockRolesService.findAll).toHaveBeenCalledWith(SystemModule.MPDSR);
    });
  });

  describe('findByCode', () => {
    it('should return a role when found', async () => {
      const role = {
        id: '1',
        code: 'FACILITY_REPORTER',
      };

      mockRolesService.findByCode.mockResolvedValue(role);

      const result = await controller.findByCode('FACILITY_REPORTER');

      expect(result).toEqual(role);
    });

    it('should throw NotFoundException when role is not found', async () => {
      mockRolesService.findByCode.mockResolvedValue(null);

      await expect(controller.findByCode('UNKNOWN_ROLE')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
