import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Repository } from 'typeorm';

import { Permission } from './entities/permission.entity.js';
import { PermissionsService } from './permissions.service.js';
import { SystemModule } from '../enum/system-module.enum.js';

describe('PermissionsService', () => {
  let service: PermissionsService;

  const mockPermissionRepository = {
    find: vi.fn(),
    findOne: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    service = new PermissionsService(
      mockPermissionRepository as unknown as Repository<Permission>,
    );
  });

  describe('findAll', () => {
    it('should return all permissions', async () => {
      const permissions = [
        { id: '1', code: 'mpdsr.incident.create' },
        { id: '2', code: 'emonc.cohort.manage' },
      ];

      mockPermissionRepository.find.mockResolvedValue(permissions);

      const result = await service.findAll();

      expect(result).toEqual(permissions);
      expect(mockPermissionRepository.find).toHaveBeenCalledWith({
        where: {},
        order: {
          module: 'ASC',
          code: 'ASC',
        },
      });
    });

    it('should filter permissions by module', async () => {
      const permissions = [{ id: '1', code: 'mpdsr.incident.create' }];

      mockPermissionRepository.find.mockResolvedValue(permissions);

      const result = await service.findAll(SystemModule.MPDSR);

      expect(result).toEqual(permissions);
      expect(mockPermissionRepository.find).toHaveBeenCalledWith({
        where: { module: SystemModule.MPDSR },
        order: {
          module: 'ASC',
          code: 'ASC',
        },
      });
    });
  });

  describe('findByCode', () => {
    it('should return a permission when found', async () => {
      const permission = {
        id: '1',
        code: 'mpdsr.incident.create',
      };

      mockPermissionRepository.findOne.mockResolvedValue(permission);

      const result = await service.findByCode('mpdsr.incident.create');

      expect(result).toEqual(permission);
      expect(mockPermissionRepository.findOne).toHaveBeenCalledWith({
        where: { code: 'mpdsr.incident.create' },
      });
    });

    it('should return null when permission is not found', async () => {
      mockPermissionRepository.findOne.mockResolvedValue(null);

      const result = await service.findByCode('unknown.permission');

      expect(result).toBeNull();
    });
  });
});
