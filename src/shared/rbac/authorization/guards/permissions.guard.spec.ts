import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SystemModule } from '../../enum/system-module.enum.js';
import { AuthorizationService } from '../authorization.service.js';
import {
  REQUIRED_PERMISSIONS_KEY,
  RequiredPermissionsMetadata,
} from '../decorators/permissions.decorator.js';
import { PermissionsGuard } from './permissions.guard.js';

describe('PermissionsGuard', () => {
  let guard: PermissionsGuard;
  let reflector: Reflector;

  const mockHasAllPermissions = vi.fn();

  const createMockContext = (
    user?: { id: string },
    assignmentId?: string | string[],
  ): ExecutionContext => {
    return {
      getHandler: vi.fn(),
      getClass: vi.fn(),
      switchToHttp: vi.fn().mockReturnValue({
        getRequest: vi.fn().mockReturnValue({
          user,
          headers: {
            'x-organization-assignment-id': assignmentId,
          },
        }),
      }),
    } as unknown as ExecutionContext;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    reflector = {
      getAllAndOverride: vi.fn(),
    } as unknown as Reflector;

    const authorizationService = {
      hasAllPermissions: mockHasAllPermissions,
    } as unknown as AuthorizationService;

    guard = new PermissionsGuard(reflector, authorizationService);
  });

  describe('canActivate', () => {
    it('should allow access when no permission metadata exists', async () => {
      vi.mocked(reflector.getAllAndOverride).mockReturnValue(undefined);

      await expect(guard.canActivate(createMockContext())).resolves.toBe(true);

      expect(mockHasAllPermissions).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when no user is authenticated', async () => {
      vi.mocked(reflector.getAllAndOverride).mockReturnValue({
        module: SystemModule.MPDSR,
        permissions: ['mpdsr.cases.create'],
      } satisfies RequiredPermissionsMetadata);

      await expect(guard.canActivate(createMockContext())).rejects.toThrow(
        UnauthorizedException,
      );

      expect(mockHasAllPermissions).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when user ID is missing', async () => {
      vi.mocked(reflector.getAllAndOverride).mockReturnValue({
        module: SystemModule.MPDSR,
        permissions: ['mpdsr.cases.create'],
      } satisfies RequiredPermissionsMetadata);

      await expect(
        guard.canActivate(createMockContext({ id: '' }, 'assignment-uuid')),
      ).rejects.toThrow(UnauthorizedException);

      expect(mockHasAllPermissions).not.toHaveBeenCalled();
    });

    it('should require an organization assignment for MPDSR', async () => {
      vi.mocked(reflector.getAllAndOverride).mockReturnValue({
        module: SystemModule.MPDSR,
        permissions: ['mpdsr.cases.create'],
      } satisfies RequiredPermissionsMetadata);

      await expect(
        guard.canActivate(createMockContext({ id: 'user-uuid' })),
      ).rejects.toThrow(ForbiddenException);

      expect(mockHasAllPermissions).not.toHaveBeenCalled();
    });

    it('should pass the selected MPDSR assignment from the header to the authorization service', async () => {
      vi.mocked(reflector.getAllAndOverride).mockReturnValue({
        module: SystemModule.MPDSR,
        permissions: ['mpdsr.cases.create'],
      } satisfies RequiredPermissionsMetadata);

      mockHasAllPermissions.mockResolvedValue(true);

      await expect(
        guard.canActivate(
          createMockContext({ id: 'user-uuid' }, 'assignment-uuid'),
        ),
      ).resolves.toBe(true);

      expect(mockHasAllPermissions).toHaveBeenCalledWith(
        'user-uuid',
        ['mpdsr.cases.create'],
        SystemModule.MPDSR,
        'assignment-uuid',
      );
    });

    it('should require an organization assignment for EMONC', async () => {
      vi.mocked(reflector.getAllAndOverride).mockReturnValue({
        module: SystemModule.EMONC,
        permissions: ['emonc.cohorts.create'],
      } satisfies RequiredPermissionsMetadata);

      await expect(
        guard.canActivate(createMockContext({ id: 'mentor-uuid' })),
      ).rejects.toThrow(ForbiddenException);

      expect(mockHasAllPermissions).not.toHaveBeenCalled();
    });

    it('should pass the selected EMONC assignment to the authorization service', async () => {
      vi.mocked(reflector.getAllAndOverride).mockReturnValue({
        module: SystemModule.EMONC,
        permissions: ['emonc.cohorts.create'],
      } satisfies RequiredPermissionsMetadata);

      mockHasAllPermissions.mockResolvedValue(true);

      await expect(
        guard.canActivate(
          createMockContext({ id: 'mentor-uuid' }, 'emonc-assignment-uuid'),
        ),
      ).resolves.toBe(true);

      expect(mockHasAllPermissions).toHaveBeenCalledWith(
        'mentor-uuid',
        ['emonc.cohorts.create'],
        SystemModule.EMONC,
        'emonc-assignment-uuid',
      );
    });

    it('should allow PLATFORM permission checks without an organization assignment', async () => {
      vi.mocked(reflector.getAllAndOverride).mockReturnValue({
        module: SystemModule.PLATFORM,
        permissions: ['platform.users.read'],
      } satisfies RequiredPermissionsMetadata);

      mockHasAllPermissions.mockResolvedValue(true);

      await expect(
        guard.canActivate(createMockContext({ id: 'admin-uuid' })),
      ).resolves.toBe(true);

      expect(mockHasAllPermissions).toHaveBeenCalledWith(
        'admin-uuid',
        ['platform.users.read'],
        SystemModule.PLATFORM,
        undefined,
      );
    });

    it('should reject PLATFORM requests containing an organization assignment', async () => {
      vi.mocked(reflector.getAllAndOverride).mockReturnValue({
        module: SystemModule.PLATFORM,
        permissions: ['platform.users.read'],
      } satisfies RequiredPermissionsMetadata);

      await expect(
        guard.canActivate(
          createMockContext({ id: 'admin-uuid' }, 'assignment-uuid'),
        ),
      ).rejects.toThrow(ForbiddenException);

      expect(mockHasAllPermissions).not.toHaveBeenCalled();
    });

    it('should reject multiple organization assignment header values', async () => {
      vi.mocked(reflector.getAllAndOverride).mockReturnValue({
        module: SystemModule.MPDSR,
        permissions: ['mpdsr.cases.create'],
      } satisfies RequiredPermissionsMetadata);

      await expect(
        guard.canActivate(
          createMockContext({ id: 'user-uuid' }, [
            'assignment-one',
            'assignment-two',
          ]),
        ),
      ).rejects.toThrow(ForbiddenException);

      expect(mockHasAllPermissions).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when the user lacks required permissions', async () => {
      vi.mocked(reflector.getAllAndOverride).mockReturnValue({
        module: SystemModule.MPDSR,
        permissions: ['mpdsr.cases.create'],
      } satisfies RequiredPermissionsMetadata);

      mockHasAllPermissions.mockResolvedValue(false);

      await expect(
        guard.canActivate(
          createMockContext({ id: 'user-uuid' }, 'assignment-uuid'),
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should check all permissions declared by the decorator', async () => {
      const permissions = ['mpdsr.cases.create', 'mpdsr.cases.read'];

      vi.mocked(reflector.getAllAndOverride).mockReturnValue({
        module: SystemModule.MPDSR,
        permissions,
      } satisfies RequiredPermissionsMetadata);

      mockHasAllPermissions.mockResolvedValue(true);

      await expect(
        guard.canActivate(
          createMockContext({ id: 'user-uuid' }, 'assignment-uuid'),
        ),
      ).resolves.toBe(true);

      expect(mockHasAllPermissions).toHaveBeenCalledWith(
        'user-uuid',
        permissions,
        SystemModule.MPDSR,
        'assignment-uuid',
      );
    });

    it('should propagate authorization service errors', async () => {
      vi.mocked(reflector.getAllAndOverride).mockReturnValue({
        module: SystemModule.MPDSR,
        permissions: ['mpdsr.cases.create'],
      } satisfies RequiredPermissionsMetadata);

      mockHasAllPermissions.mockRejectedValue(
        new Error('Authorization service error'),
      );

      await expect(
        guard.canActivate(
          createMockContext({ id: 'user-uuid' }, 'assignment-uuid'),
        ),
      ).rejects.toThrow('Authorization service error');
    });
  });
});
