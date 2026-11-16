import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../rbac/authorization/guards/permissions.guard.js';

import type { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface.js';

import { UserOrganizationAssignmentsController } from './user-organization-assignments.controller.js';
import { UserOrganizationAssignmentsService } from './user-organization-assignments.service.js';
import { CreateUserOrganizationAssignmentDto } from './dto/create-user-organization-assignment.dto.js';

describe('UserOrganizationAssignmentsController', () => {
  let controller: UserOrganizationAssignmentsController;

  const assignmentsService = {
    create: vi.fn(),
    findAll: vi.fn(),
    findByUser: vi.fn(),
    findOne: vi.fn(),
    end: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserOrganizationAssignmentsController],
      providers: [
        {
          provide: UserOrganizationAssignmentsService,
          useValue: assignmentsService,
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

    controller = module.get<UserOrganizationAssignmentsController>(
      UserOrganizationAssignmentsController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create an organization assignment with the authenticated administrator as assignedBy', async () => {
      const dto: CreateUserOrganizationAssignmentDto = {
        userId: '11111111-1111-4111-8111-111111111111',
        level: 'COUNTY' as CreateUserOrganizationAssignmentDto['level'],
        countyId: '22222222-2222-4222-8222-222222222222',
      };

      const authenticatedUser = {
        id: 'admin-uuid',
      } as AuthenticatedUser;

      const result = {
        id: 'assignment-1',
        ...dto,
        assignedBy: authenticatedUser.id,
      };

      assignmentsService.create.mockResolvedValue(result);

      await expect(controller.create(dto, authenticatedUser)).resolves.toEqual(
        result,
      );

      expect(assignmentsService.create).toHaveBeenCalledWith(
        dto,
        authenticatedUser.id,
      );
    });
  });

  describe('findAll', () => {
    it('should return all organization assignments', async () => {
      const result = [{ id: 'assignment-1' }];

      assignmentsService.findAll.mockResolvedValue(result);

      await expect(controller.findAll()).resolves.toEqual(result);

      expect(assignmentsService.findAll).toHaveBeenCalledOnce();
    });
  });

  describe('findByUser', () => {
    it('should return assignments for a user', async () => {
      const userId = '11111111-1111-4111-8111-111111111111';
      const result = [{ id: 'assignment-1', userId }];

      assignmentsService.findByUser.mockResolvedValue(result);

      await expect(controller.findByUser(userId)).resolves.toEqual(result);

      expect(assignmentsService.findByUser).toHaveBeenCalledWith(userId);
    });
  });

  describe('findOne', () => {
    it('should return one organization assignment', async () => {
      const id = '22222222-2222-4222-8222-222222222222';
      const result = { id };

      assignmentsService.findOne.mockResolvedValue(result);

      await expect(controller.findOne(id)).resolves.toEqual(result);

      expect(assignmentsService.findOne).toHaveBeenCalledWith(id);
    });
  });

  describe('end', () => {
    it('should end an organization assignment', async () => {
      const id = '22222222-2222-4222-8222-222222222222';
      const result = { id, endDate: new Date() };

      assignmentsService.end.mockResolvedValue(result);

      await expect(controller.end(id)).resolves.toEqual(result);

      expect(assignmentsService.end).toHaveBeenCalledWith(id);
    });
  });
});
