import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { AccountStatus } from '../enum/users.enum.js';

import { Invitation } from '../../invitations/entities/invitation.entity.js';
import { UserOrganizationAssignment } from '../../user-organization-assignments/entities/user-organization-assignment.entity.js';

@Entity('users')
@Index('IDX_users_email', ['email'], { unique: true })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // User's first name.
  @Column({
    name: 'firstName',
    type: 'varchar',
    length: 255,
  })
  firstName: string;

  // User's last name.
  @Column({
    name: 'lastName',
    type: 'varchar',
    length: 255,
  })
  lastName: string;

  // User's email address.
  @Column({
    name: 'email',
    type: 'varchar',
    length: 255,
  })
  email: string;

  // User's phone number.
  @Column({
    name: 'phoneNumber',
    type: 'varchar',
    length: 20,
    unique: true,
    nullable: true,
  })
  phoneNumber: string | null;

  // Records when the user accepted their account invitation.
  @Column({
    name: 'invitationAcceptedAt',
    type: 'datetime',
    nullable: true,
  })
  invitationAcceptedAt: Date | null;

  // Stores the hashed user password.
  @Column({
    name: 'passwordHash',
    type: 'varchar',
    length: 255,
    select: false,
    nullable: true,
  })
  passwordHash: string | null;

  // Indicates whether the user must change their password.
  @Column({
    name: 'mustChangePassword',
    type: 'boolean',
    default: true,
  })
  mustChangePassword: boolean;

  // Identifies the user's professional cadre.
  @Column({
    name: 'cadreId',
    type: 'char',
    length: 36,
    nullable: true,
  })
  cadreId: string | null;

  // Tracks the user's account status.
  @Column({
    name: 'status',
    type: 'enum',
    enum: AccountStatus,
    default: AccountStatus.PENDING,
  })
  status: AccountStatus;

  // Records the user's last successful login.
  @Column({
    name: 'lastLoginAt',
    type: 'datetime',
    nullable: true,
  })
  lastLoginAt: Date | null;

  // Identifies the user who created this account.
  @Column({
    name: 'createdBy',
    type: 'char',
    length: 36,
    nullable: true,
  })
  createdBy: string | null;

  // Records when the user account was created.
  @CreateDateColumn({
    name: 'createdAt',
    type: 'datetime',
    precision: 0,
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;

  // Records the last time the user account was updated.
  @UpdateDateColumn({
    name: 'updatedAt',
    type: 'datetime',
    precision: 0,
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  // Supports soft deletion of user accounts.
  @DeleteDateColumn({
    name: 'deletedAt',
    type: 'datetime',
    precision: 0,
    nullable: true,
  })
  deletedAt: Date | null;

  // Invitations received by this user's account.
  @OneToMany(() => Invitation, (invitation) => invitation.user)
  invitations: Invitation[];

  // Organizational assignments belonging to this user.
  @OneToMany(() => UserOrganizationAssignment, (assignment) => assignment.user)
  organizationAssignments: UserOrganizationAssignment[];
}
