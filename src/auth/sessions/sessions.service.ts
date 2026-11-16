import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, randomBytes } from 'node:crypto';
import { DataSource, IsNull, Repository } from 'typeorm';

import { UserSession } from './entities/user-session.entity.js';
import { UserSessionRefreshToken } from './entities/user-session-refresh-token.entity.js';

const SESSION_DURATION_DAYS = 7;

@Injectable()
export class SessionsService {
  constructor(
    @InjectRepository(UserSession)
    private readonly sessionsRepository: Repository<UserSession>,
    private readonly dataSource: DataSource,
  ) {}

  // Generates a cryptographically secure refresh token.
  private generateRefreshToken(): string {
    return randomBytes(64).toString('base64url');
  }

  // Stores only the SHA-256 hash of a refresh token.
  private hashRefreshToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  // Creates a session and its initial refresh token.
  async createSession(
    userId: string,
    ipAddress: string | null,
    userAgent: string | null,
  ): Promise<{ session: UserSession; refreshToken: string }> {
    const refreshToken = this.generateRefreshToken();

    const expiresAt = new Date(
      Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000,
    );

    return this.dataSource.transaction(async (manager) => {
      const sessionsRepository = manager.getRepository(UserSession);
      const tokensRepository = manager.getRepository(UserSessionRefreshToken);

      const session = sessionsRepository.create({
        userId,
        ipAddress,
        userAgent,
        expiresAt,
        lastUsedAt: null,
        revokedAt: null,
      });

      const savedSession = await sessionsRepository.save(session);

      const refreshTokenRecord = tokensRepository.create({
        sessionId: savedSession.id,
        tokenHash: this.hashRefreshToken(refreshToken),
        expiresAt,
        usedAt: null,
      });

      await tokensRepository.save(refreshTokenRecord);

      return {
        session: savedSession,
        refreshToken,
      };
    });
  }

  // Rotates a refresh token and detects reuse of an already-used token.
  async rotateRefreshToken(
    currentRefreshToken: string,
  ): Promise<{ session: UserSession; refreshToken: string }> {
    const tokenHash = this.hashRefreshToken(currentRefreshToken);

    const result = await this.dataSource.transaction(async (manager) => {
      const tokensRepository = manager.getRepository(UserSessionRefreshToken);
      const sessionsRepository = manager.getRepository(UserSession);

      const tokenRecord = await tokensRepository.findOne({
        where: { tokenHash },
        relations: { session: true },
        lock: { mode: 'pessimistic_write' },
      });

      if (!tokenRecord) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const session = tokenRecord.session;
      const now = new Date();

      if (tokenRecord.usedAt) {
        // Revokes the session if an already-rotated token is reused.
        if (!session.revokedAt) {
          session.revokedAt = now;
          await sessionsRepository.save(session);
        }

        return null;
      }

      if (
        tokenRecord.expiresAt <= now ||
        session.expiresAt <= now ||
        session.revokedAt
      ) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const newRefreshToken = this.generateRefreshToken();

      tokenRecord.usedAt = now;
      await tokensRepository.save(tokenRecord);

      const newTokenRecord = tokensRepository.create({
        sessionId: session.id,
        tokenHash: this.hashRefreshToken(newRefreshToken),
        expiresAt: session.expiresAt,
        usedAt: null,
      });

      await tokensRepository.save(newTokenRecord);

      session.lastUsedAt = now;
      await sessionsRepository.save(session);

      return {
        session,
        refreshToken: newRefreshToken,
      };
    });

    if (!result) {
      throw new UnauthorizedException('Refresh token reuse detected');
    }

    return result;
  }

  // Retrieves all login sessions belonging to a user.
  async findUserSessions(userId: string): Promise<UserSession[]> {
    return this.sessionsRepository.find({
      where: { userId },
      select: {
        id: true,
        userId: true,
        ipAddress: true,
        userAgent: true,
        createdAt: true,
        lastUsedAt: true,
        expiresAt: true,
        revokedAt: true,
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  // Checks whether a session is active and belongs to the specified user.
  async isSessionActive(sessionId: string, userId: string): Promise<boolean> {
    const session = await this.sessionsRepository.findOne({
      where: { id: sessionId, userId },
    });

    return !!session && !session.revokedAt && session.expiresAt > new Date();
  }

  // Revokes a session belonging to the specified user.
  async revokeSession(sessionId: string, userId: string): Promise<void> {
    await this.sessionsRepository.update(
      {
        id: sessionId,
        userId,
        revokedAt: IsNull(),
      },
      {
        revokedAt: new Date(),
      },
    );
  }

  // Revokes all active sessions belonging to a user.
  async revokeAllSessions(userId: string): Promise<void> {
    await this.sessionsRepository.update(
      {
        userId,
        revokedAt: IsNull(),
      },
      {
        revokedAt: new Date(),
      },
    );
  }
}
