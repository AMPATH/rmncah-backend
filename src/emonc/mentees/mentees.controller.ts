
import {
  Controller,
  Get,
  Param,
  Req,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';

import { MenteesService } from './mentees.service.js';

import { AccountStatus } from '../../shared/users/enum/users.enum.js';

@Controller('mentees')
export class MenteesController {
  constructor(
    private readonly menteesService: MenteesService,
  ) {}

  // 1. Get all mentees with optional search, status and pagination.
  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('status') status?: AccountStatus,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.menteesService.findAll({
      search,
      status,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  // 2. Get eligible mentees.
  @Get('eligible')
  findEligible() {
    return this.menteesService.findEligible();
  }

  // 3. Get mentee statistics.
  @Get('statistics')
  getStatistics() {
    return this.menteesService.getStatistics();
  }

  // 4. Get one mentee by ID.
  @Get(':id')
  findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.menteesService.findOne(id);
  }
  
  
  @Get('mentees/dashboard')
  getMyDashboard(@Req() req: { user: { userId: string } }) {
    return this.menteesService.getMyDashboard(
      req.user.userId,
    );
    
  }

}
