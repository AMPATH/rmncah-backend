import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserSession } from './entities/user-session.entity.js';
import { UserSessionRefreshToken } from './entities/user-session-refresh-token.entity.js';
import { SessionsService } from './sessions.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([UserSession, UserSessionRefreshToken])],
  providers: [SessionsService],
  exports: [SessionsService],
})
export class SessionsModule {}
