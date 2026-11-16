import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import type { Relation } from 'typeorm';

import { User } from '../../../users/entities/user.entity.js';
import { UserOrganizationAssignment } from '../../../user-organization-assignments/entities/user-organization-assignment.entity.js';
import { Role } from '../../roles/entities/role.entity.js';

@Entity('userRoleAssignments')
@Index(['userId', 'assignedAt'])
@Index([
  'userId',
  'roleId',
  'organizationAssignmentId',
  'revokedAt',
  'expiresAt',
])
export class UserRoleAssignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 36 })
  userId: string;

  @Column({ type: 'varchar', length: 36 })
  roleId: string;

  @Column({ type: 'varchar', length: 36, nullable: true })
  organizationAssignmentId: string | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  assignedBy: string | null;

  @Column({ type: 'datetime' })
  assignedAt: Date;

  @Column({ type: 'datetime', nullable: true })
  expiresAt: Date | null;

  @Column({ type: 'datetime', nullable: true })
  revokedAt: Date | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  revokedBy: string | null;

  // User receiving the role
  @ManyToOne(() => User, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: Relation<User>;

  // Role being assigned
  @ManyToOne(() => Role, (role) => role.userAssignments, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'roleId' })
  role: Relation<Role>;

  // Organizational scope; null for platform-wide roles
  @ManyToOne(() => UserOrganizationAssignment, {
    nullable: true,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'organizationAssignmentId' })
  organizationAssignment: Relation<UserOrganizationAssignment> | null;

  // User who assigned the role
  @ManyToOne(() => User, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'assignedBy' })
  assignedByUser: Relation<User> | null;

  // User who revoked the role
  @ManyToOne(() => User, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'revokedBy' })
  revokedByUser: Relation<User> | null;

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt: Date;
}
