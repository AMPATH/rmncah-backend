import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Repository } from 'typeorm';

import { Role } from './entities/role.entity.js';
import { RolesService } from './roles.service.js';
import { SystemModule } from '../enum/system-module.enum.js';

describe('RolesService', () => {
  let service: RolesService;

  const mockRoleRepository = {
    find: vi.fn(),
    findOne: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    service = new RolesService(
      mockRoleRepository as unknown as Repository<Role>,
    );
  });

  describe('findAll', () => {
    it('should return all active roles with permissions', async () => {
      const roles = [
        {
          id: '1',
          code: 'FACILITY_REPORTER',
          module: SystemModule.MPDSR,
          isActive: true,
          permissions: [],
        },
        {
          id: '2',
          code: 'MENTOR',
          module: SystemModule.EMONC,
          isActive: true,
          permissions: [],
        },
      ];

      mockRoleRepository.find.mockResolvedValue(roles);

      const result = await service.findAll();

      expect(result).toEqual(roles);
      expect(mockRoleRepository.find).toHaveBeenCalledWith({
        where: { isActive: true },
        relations: {
          permissions: {
            permission: true,
          },
        },
        order: {
          module: 'ASC',
          name: 'ASC',
        },
      });
    });

    it('should filter active roles by module', async () => {
      const roles = [
        {
          id: '1',
          code: 'FACILITY_REPORTER',
          module: SystemModule.MPDSR,
          isActive: true,
          permissions: [],
        },
      ];

      mockRoleRepository.find.mockResolvedValue(roles);

      const result = await service.findAll(SystemModule.MPDSR);

      expect(result).toEqual(roles);
      expect(mockRoleRepository.find).toHaveBeenCalledWith({
        where: {
          module: SystemModule.MPDSR,
          isActive: true,
        },
        relations: {
          permissions: {
            permission: true,
          },
        },
        order: {
          module: 'ASC',
          name: 'ASC',
        },
      });
    });
  });

  describe('findByCode', () => {
    it('should return an active role with permissions when found', async () => {
      const role = {
        id: '1',
        code: 'FACILITY_REPORTER',
        isActive: true,
        permissions: [],
      };

      mockRoleRepository.findOne.mockResolvedValue(role);

      const result = await service.findByCode('FACILITY_REPORTER');

      expect(result).toEqual(role);
      expect(mockRoleRepository.findOne).toHaveBeenCalledWith({
        where: {
          code: 'FACILITY_REPORTER',
          isActive: true,
        },
        relations: {
          permissions: {
            permission: true,
          },
        },
      });
    });

    it('should return null when role is not found', async () => {
      mockRoleRepository.findOne.mockResolvedValue(null);

      const result = await service.findByCode('UNKNOWN_ROLE');

      expect(result).toBeNull();
    });
  });
});
