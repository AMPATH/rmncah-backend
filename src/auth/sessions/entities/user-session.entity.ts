import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { User } from '../../../shared/users/entities/user.entity.js';

// Represents an active or revoked login session for a user.
@Entity('userSessions')
@Index('IDX_userSessions_userId', ['userId'])
@Index('IDX_userSessions_expiresAt', ['expiresAt'])
export class UserSession {
  // Unique identifier for each login session.
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Identifies the user who owns this session.
  @Column({
    name: 'userId',
    type: 'varchar',
    length: 36,
  })
  userId: string;

  // Links the session to its owning user.
  @ManyToOne(() => User, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: User;

  // Stores the IP address used when the session was created.
  @Column({
    name: 'ipAddress',
    type: 'varchar',
    length: 45,
    nullable: true,
  })
  ipAddress: string | null;

  // Stores browser or device information for session identification.
  @Column({
    name: 'userAgent',
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  userAgent: string | null;

  // Defines when the session expires.
  @Column({
    name: 'expiresAt',
    type: 'datetime',
  })
  expiresAt: Date;

  // Records the last time the session was used to refresh tokens.
  @Column({
    name: 'lastUsedAt',
    type: 'datetime',
    nullable: true,
  })
  lastUsedAt: Date | null;

  // Records when the session was revoked; null means it remains unrevoked.
  @Column({
    name: 'revokedAt',
    type: 'datetime',
    nullable: true,
  })
  revokedAt: Date | null;

  // Records when the session was created.
  @CreateDateColumn({
    name: 'createdAt',
    type: 'datetime',
    precision: 0,
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;
}
