
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';

import { Request } from 'express';

import { MenteesService } from './mentees.service.js';

import { CreateMenteeDto } from './dto/create-mentee.dto.js';

import { AccountStatus } from '../../shared/users/enum/users.enum.js';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
    role?: string;
  };
}

@Controller('emonc/mentees')
@UseGuards(JwtAuthGuard)
export class MenteesController {
  constructor(
    private readonly menteesService: MenteesService,
  ) {}

  /**
   * Create a mentee account.
   * POST /emonc/mentees
   */
  @Post()
  async create(
    @Body() createMenteeDto: CreateMenteeDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.menteesService.create(
      createMenteeDto,
      req.user.userId,
    );
  }

  /**
   * Get all mentees.
   * GET /emonc/mentees
   */
  @Get()
  async findAll(
    @Query('search') search?: string,
    @Query('status') status?: AccountStatus,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.menteesService.findAll({
      search,
      status,
      page: Number(page) || 1,
      limit: Number(limit) || 20,
    });
  }

  /**
   * Get mentee statistics.
   * GET /emonc/mentees/statistics
   */
  @Get('statistics')
  async getStatistics() {
    return this.menteesService.getStatistics();
  }

  /**
   * Get eligible mentees.
   * GET /emonc/mentees/eligible
   */
  @Get('eligible')
  async findEligible() {
    return this.menteesService.findEligible();
  }

  /**
   * Get the logged-in mentee's dashboard.
   * GET /emonc/mentees/me/dashboard
   */
  @Get('me/dashboard')
  async getMyDashboard(
    @Req() req: AuthenticatedRequest,
  ) {
    return this.menteesService.getMyDashboard(
      req.user.userId,
    );
  }

  /**
   * Get one mentee by ID.
   * GET /emonc/mentees/:id
   */
  @Get(':id')
  async findOne(
    @Param('id', new ParseUUIDPipe({ version: '4' }))
    id: string,
  ) {
    return this.menteesService.findOne(id);
  }
}
