import {
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

import { User } from '../../../shared/users/entities/user.entity.js';

// Stores hashed, single-use password-reset tokens.
@Entity('passwordResets')
@Index('IDX_passwordResets_userId', ['userId'])
@Index('IDX_passwordResets_expiresAt', ['expiresAt'])
@Index('UQ_passwordResets_tokenHash', ['tokenHash'], { unique: true })
export class PasswordReset {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // User account requesting the password reset.
  @Column({
    name: 'userId',
    type: 'varchar',
    length: 36,
  })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'userId',
    foreignKeyConstraintName: 'FK_password_resets_userId',
  })
  user: User;

  // SHA-256 hash of the reset token; the raw token is never stored.
  @Column({
    name: 'tokenHash',
    type: 'char',
    length: 64,
  })
  tokenHash: string;

  // Reset links expire after a short period.
  @Column({
    name: 'expiresAt',
    type: 'datetime',
  })
  expiresAt: Date;

  // Set when the reset token has been successfully used.
  @Column({
    name: 'usedAt',
    type: 'datetime',
    nullable: true,
  })
  usedAt: Date | null;

  // Set when a reset token is invalidated before use.
  @Column({
    name: 'revokedAt',
    type: 'datetime',
    nullable: true,
  })
  revokedAt: Date | null;

  @CreateDateColumn({
    name: 'createdAt',
    type: 'datetime',
    precision: 0,
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;
}
