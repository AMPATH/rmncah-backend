import type { EntityManager } from 'typeorm';

import dataSource from '../data-source.js';

import * as argon2 from 'argon2';

//import { AccountStatus, User } from '../../shared/users/entities/user.entity.js';


import { Role } from '../../shared/rbac/roles/entities/role.entity.js';
import { UserRoleAssignment } from '../../shared/rbac/user-role-assignments/entities/user-role-assignment.entity.js';

import { SystemModule } from '../../shared/rbac/enum/system-module.enum.js';
import { User } from '../../shared/users/entities/user.entity.js';
import { AccountStatus } from '../../shared/users/enum/users.enum.js';

async function createProgramLead(
  manager: EntityManager,
): Promise<void> {
  const email = process.env.PROGRAM_LEAD_EMAIL?.trim().toLowerCase();
  const password = process.env.PROGRAM_LEAD_PASSWORD;
  const firstName = process.env.PROGRAM_LEAD_FIRST_NAME?.trim();
  const lastName = process.env.PROGRAM_LEAD_LAST_NAME?.trim();

  if (!email || !password || !firstName || !lastName) {
    throw new Error(
      'Set PROGRAM_LEAD_EMAIL, PROGRAM_LEAD_PASSWORD, PROGRAM_LEAD_FIRST_NAME and PROGRAM_LEAD_LAST_NAME in your .env file.',
    );
  }

  if (password.length < 12) {
    throw new Error('Program Lead password must be at least 12 characters.');
  }

  const userRepository = manager.getRepository(User);
  const roleRepository = manager.getRepository(Role);
  const assignmentRepository = manager.getRepository(UserRoleAssignment);

  // 1. Check whether the account already exists.
  const existingUser = await userRepository.findOne({
    where: { email },
  });

  if (existingUser) {
    throw new Error(
      `A user with email ${email} already exists. No account was modified.`,
    );
  }

  // 2. Find the existing EmONC Program Lead role.
  const programLeadRole = await roleRepository.findOne({
    where: {
      code: 'PROGRAM_LEAD',
      module: SystemModule.EMONC,
      isActive: true,
    },
  });

  if (!programLeadRole) {
    throw new Error(
      'Active PROGRAM_LEAD role not found. Run the RBAC seeder first.',
    );
  }

  // 3. Hash the password using Argon2id.
  const passwordHash = await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });

  // 4. Create an active user account.
  const user = userRepository.create({
    firstName,
    lastName,
    email,
    passwordHash,
    status: AccountStatus.ACTIVE,
    mustChangePassword: false,
    // invitationAcceptedAt: new Date(),
    cadreId: null,
    createdBy: null,
  });

  const savedUser = await userRepository.save(user);

  // 5. Check for an existing active, platform-wide role assignment.
  const now = new Date();

  const existingAssignment = await assignmentRepository
    .createQueryBuilder('assignment')
    .where('assignment.userId = :userId', {
      userId: savedUser.id,
    })
    .andWhere('assignment.roleId = :roleId', {
      roleId: programLeadRole.id,
    })
    .andWhere('assignment.organizationAssignmentId IS NULL')
    .andWhere('assignment.revokedAt IS NULL')
    .andWhere(
      '(assignment.expiresAt IS NULL OR assignment.expiresAt > :now)',
      { now },
    )
    .getOne();

  if (!existingAssignment) {
    const assignment = assignmentRepository.create({
      userId: savedUser.id,
      roleId: programLeadRole.id,
      organizationAssignmentId: null,
      assignedBy: null,
      assignedAt: now,
      expiresAt: null,
      revokedAt: null,
      revokedBy: null,
    });

    await assignmentRepository.save(assignment);
  }

  console.log('Program Lead account created successfully.');
  console.log(`Email: ${email}`);
  console.log(`User ID: ${savedUser.id}`);
  console.log('Role: PROGRAM_LEAD');
  console.log('Module: EMONC');
}

async function seedProgramLead(): Promise<void> {
  try {
    await dataSource.initialize();

    await dataSource.transaction(async (manager: EntityManager) => {
      console.log('Creating EmONC Program Lead account...');

      await createProgramLead(manager);
    });

    console.log('Program Lead seeding completed.');
  } catch (error: unknown) {
    console.error('Program Lead seeding failed:', error);
    process.exitCode = 1;
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

void seedProgramLead();