import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AuthenticatedUser } from '../../../auth/interfaces/authenticated-user.interface.js';

import { CreateUserRoleAssignmentDto } from './dto/create-user-role-assignment.dto.js';
import { UserRoleAssignmentsController } from './user-role-assignments.controller.js';
import { UserRoleAssignmentsService } from './user-role-assignments.service.js';

describe('UserRoleAssignmentsController', () => {
  let controller: UserRoleAssignmentsController;

  const userRoleAssignmentsService = {
    assignRole: vi.fn(),
    findAll: vi.fn(),
    findOne: vi.fn(),
    findUserAssignments: vi.fn(),
    revokeRole: vi.fn(),
  };

  const userId = '11111111-1111-4111-8111-111111111111';
  const roleId = '22222222-2222-4222-8222-222222222222';
  const assignmentId = '44444444-4444-4444-8444-444444444444';
  const authenticatedUserId = '55555555-5555-4555-8555-555555555555';

  const dto: CreateUserRoleAssignmentDto = {
    userId,
    roleId,
    organizationAssignmentId: '33333333-3333-4333-8333-333333333333',
  };

  const authenticatedUser = {
    id: authenticatedUserId,
  } as AuthenticatedUser;

  beforeEach(() => {
    vi.resetAllMocks();

    controller = new UserRoleAssignmentsController(
      userRoleAssignmentsService as unknown as UserRoleAssignmentsService,
    );
  });

  describe('assignRole', () => {
    it('should assign a role to a user', async () => {
      const assignment = { id: assignmentId };

      userRoleAssignmentsService.assignRole.mockResolvedValue(assignment);

      const result = await controller.assignRole(dto, authenticatedUser);

      expect(result).toEqual(assignment);

      expect(userRoleAssignmentsService.assignRole).toHaveBeenCalledWith(
        dto,
        authenticatedUserId,
      );
    });
  });

  describe('findAll', () => {
    it('should return all role assignments', async () => {
      const assignments = [{ id: assignmentId }];

      userRoleAssignmentsService.findAll.mockResolvedValue(assignments);

      const result = await controller.findAll();

      expect(result).toEqual(assignments);
      expect(userRoleAssignmentsService.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return one role assignment', async () => {
      const assignment = { id: assignmentId };

      userRoleAssignmentsService.findOne.mockResolvedValue(assignment);

      const result = await controller.findOne(assignmentId);

      expect(result).toEqual(assignment);
      expect(userRoleAssignmentsService.findOne).toHaveBeenCalledWith(
        assignmentId,
      );
    });
  });

  describe('findUserAssignments', () => {
    it('should return assignments belonging to a user', async () => {
      const assignments = [{ id: assignmentId, userId }];

      userRoleAssignmentsService.findUserAssignments.mockResolvedValue(
        assignments,
      );

      const result = await controller.findUserAssignments(userId);

      expect(result).toEqual(assignments);

      expect(
        userRoleAssignmentsService.findUserAssignments,
      ).toHaveBeenCalledWith(userId);
    });
  });

  describe('revokeRole', () => {
    it('should revoke a role assignment', async () => {
      const revokedAssignment = {
        id: assignmentId,
        revokedBy: authenticatedUserId,
      };

      userRoleAssignmentsService.revokeRole.mockResolvedValue(
        revokedAssignment,
      );

      const result = await controller.revokeRole(
        assignmentId,
        authenticatedUser,
      );

      expect(result).toEqual(revokedAssignment);

      expect(userRoleAssignmentsService.revokeRole).toHaveBeenCalledWith(
        assignmentId,
        authenticatedUserId,
      );
    });
  });
});
