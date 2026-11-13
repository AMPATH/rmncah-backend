import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { UserSession } from './user-session.entity.js';

// Stores refresh-token history for rotation and reuse detection.
@Entity('userSessionRefreshTokens')
@Index('IDX_sessionRefreshTokens_sessionId', ['sessionId'])
@Index('UQ_sessionRefreshTokens_tokenHash', ['tokenHash'], {
  unique: true,
})
@Index('IDX_sessionRefreshTokens_expiresAt', ['expiresAt'])
export class UserSessionRefreshToken {
  // Unique identifier for each refresh token record.
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Identifies the session that owns this refresh token.
  @Column({
    name: 'sessionId',
    type: 'varchar',
    length: 36,
  })
  sessionId: string;

  // Links the refresh token record to its login session.
  @ManyToOne(() => UserSession, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'sessionId' })
  session: UserSession;

  // Stores the SHA-256 hash instead of the raw refresh token.
  @Column({
    name: 'tokenHash',
    type: 'char',
    length: 64,
  })
  tokenHash: string;

  // Defines when this refresh token expires.
  @Column({
    name: 'expiresAt',
    type: 'datetime',
  })
  expiresAt: Date;

  // Records when this token was used during rotation; null means unused.
  @Column({
    name: 'usedAt',
    type: 'datetime',
    nullable: true,
  })
  usedAt: Date | null;

  // Records when this token record was created.
  @CreateDateColumn({
    name: 'createdAt',
    type: 'datetime',
    precision: 0,
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;
}
