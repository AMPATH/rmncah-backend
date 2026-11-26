
import {
  Controller,
  Get,
  Req,
  UseGuards,
} from '@nestjs/common';

import type { Request } from 'express';

import { ProgressService } from './progress.service.js';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../shared/rbac/roles/guards/roles.guard.js';
import { Roles } from '../../shared/rbac/roles/decorators/roles.decorator.js';
import { SystemModule } from '../../shared/rbac/enum/system-module.enum.js';


interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
  };
}

@Controller('emonc/progress')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProgressController {
  constructor(
    private readonly progressService: ProgressService,
  ) {}

  // GET /emonc/progress/mentees
  @Get('mentees')
  @Roles(SystemModule.EMONC, 'MENTEE')
  async findMenteeProgress(
    @Req() req: AuthenticatedRequest,
  ) {
    return this.progressService.findMenteeProgress(
      req.user.id,
    );
  }

  // GET /emonc/progress/mentor
  @Get('mentor')
  @Roles(SystemModule.EMONC, 'MENTOR')
  async findMentorProgress(
    @Req() req: AuthenticatedRequest,
  ) {
    return this.progressService.findMentorProgress(
      req.user.id,
    );
  }

  // GET /emonc/progress/county
  @Get('county')
  @Roles(SystemModule.EMONC, 'COUNTY_MENTOR_RH')
  async findCountyProgress(
    @Req() req: AuthenticatedRequest,
  ) {
    return this.progressService.findCountyProgress(
      req.user.id,
    );
  }
}
