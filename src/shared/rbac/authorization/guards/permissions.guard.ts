import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { AuthorizationService } from '../authorization.service.js';
import {
  REQUIRED_PERMISSIONS_KEY,
  RequiredPermissionsMetadata,
} from '../decorators/permissions.decorator.js';

interface AuthenticatedUser {
  id: string;
}

interface AuthenticatedRequest {
  user?: AuthenticatedUser;
  headers: {
    'x-organization-assignment-id'?: string | string[];
  };
}

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions =
      this.reflector.getAllAndOverride<RequiredPermissionsMetadata>(
        REQUIRED_PERMISSIONS_KEY,
        [context.getHandler(), context.getClass()],
      );

    if (!requiredPermissions) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    const user = request.user;

    if (!user?.id) {
      throw new UnauthorizedException('Authentication is required.');
    }

    const { module, permissions } = requiredPermissions;

    const assignmentHeader = request.headers['x-organization-assignment-id'];

    if (Array.isArray(assignmentHeader)) {
      throw new ForbiddenException(
        'Only one organizational assignment can be selected.',
      );
    }

    const organizationAssignmentId = assignmentHeader?.trim() || undefined;

    if (module !== 'PLATFORM' && !organizationAssignmentId) {
      throw new ForbiddenException(
        'An organizational assignment is required for this module.',
      );
    }

    if (module === 'PLATFORM' && organizationAssignmentId) {
      throw new ForbiddenException(
        'Platform permissions cannot use an organizational assignment.',
      );
    }

    const hasAllPermissions = await this.authorizationService.hasAllPermissions(
      user.id,
      permissions,
      module,
      organizationAssignmentId,
    );

    if (!hasAllPermissions) {
      throw new ForbiddenException(
        'You do not have the required permissions to perform this action.',
      );
    }

    return true;
  }
}
