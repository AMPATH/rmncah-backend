import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';

import { User } from '../../users/entities/user.entity.js';

// Represents an email invitation to activate a system user account.
@Entity('invitations')
@Index('IDX_invitations_userId', ['userId'])
@Index('IDX_invitations_invitedByUserId', ['invitedByUserId'])
@Index('IDX_invitations_expiresAt', ['expiresAt'])
@Index('UQ_invitations_tokenHash', ['tokenHash'], { unique: true })
export class Invitation {
  // Unique identifier for the invitation.
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Identifies the user whose account is being activated.
  @Column({
    name: 'userId',
    type: 'varchar',
    length: 36,
  })
  userId: string;

  // Links the invitation to the recipient's user account.
  @ManyToOne(() => User, (user) => user.invitations, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: Relation<User>;

  // Identifies the administrator or existing user who created the account.
  @Column({
    name: 'invitedByUserId',
    type: 'varchar',
    length: 36,
    nullable: true,
  })
  invitedByUserId: string | null;

  // Links the invitation to the user who sent it.
  // If the administrator is deleted, preserve the invitation history.
  @ManyToOne(() => User, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'invitedByUserId' })
  invitedBy: Relation<User> | null;

  // Stores only the SHA-256 hash of the raw invitation token.
  @Column({
    name: 'tokenHash',
    type: 'char',
    length: 64,
  })
  tokenHash: string;

  // Defines when the invitation expires (24 hours after creation).
  @Column({
    name: 'expiresAt',
    type: 'datetime',
  })
  expiresAt: Date;

  // Records when the invitation was accepted.
  @Column({
    name: 'acceptedAt',
    type: 'datetime',
    nullable: true,
  })
  acceptedAt: Date | null;

  // Records when the invitation was revoked.
  @Column({
    name: 'revokedAt',
    type: 'datetime',
    nullable: true,
  })
  revokedAt: Date | null;

  // Records when the invitation was created.
  @CreateDateColumn({
    name: 'createdAt',
    type: 'datetime',
    precision: 0,
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;
}
