
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Reflector } from '@nestjs/core';
import { Repository } from 'typeorm';



import {
  ROLES_KEY,
  RolesMetadata,
} from '../decorators/roles.decorator.js';
import { UserRoleAssignment } from '../../user-role-assignments/entities/user-role-assignment.entity.js';

interface RequestWithUser {
  user?: {
    id: string;
  };
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,

    @InjectRepository(UserRoleAssignment)
    private readonly userRoleAssignmentRepository: Repository<UserRoleAssignment>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requirements =
      this.reflector.getAllAndOverride<RolesMetadata>(
        ROLES_KEY,
        [context.getHandler(), context.getClass()],
      );

    // No role requirements: allow access.
    if (!requirements || requirements.roles.length === 0) {
      return true;
    }

    const request =
      context.switchToHttp().getRequest<RequestWithUser>();

    const user = request.user;

    if (!user?.id) {
      throw new UnauthorizedException(
        'Authenticated user information is missing',
      );
    }

    const { module, roles } = requirements;

    const now = new Date();

    const assignment =
      await this.userRoleAssignmentRepository
        .createQueryBuilder('assignment')
        .innerJoinAndSelect('assignment.role', 'role')
        .where('assignment.userId = :userId', {
          userId: user.id,
        })
        .andWhere('assignment.revokedAt IS NULL')
        .andWhere(
          '(assignment.expiresAt IS NULL OR assignment.expiresAt > :now)',
          { now },
        )
        .andWhere('role.isActive = :isActive', {
          isActive: true,
        })
        .andWhere('role.module = :module', {
          module,
        })
        .andWhere('role.code IN (:...roles)', {
          roles,
        })
        .getOne();

    if (!assignment) {
      throw new ForbiddenException(
        'You do not have the required role to access this resource',
      );
    }

    return true;
  }
}
