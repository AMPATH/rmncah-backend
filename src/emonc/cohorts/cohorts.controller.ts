
import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';

import { CohortsService } from './cohorts.service.js';

import { CreateCohortDto } from './dto/create-cohort.dto.js';
import { UpdateCohortDto } from './dto/update-cohort.dto.js';
import { UpdateCohortStatusDto } from './dto/update-cohort-status.dto.js';
import { AddMenteeDto } from './dto/add-mentee.dto.js';

@Controller('emonc/cohorts')
export class CohortsController {
  constructor(
    private readonly cohortsService: CohortsService,
  ) {}

  // CREATE COHORT
  @Post()
  create(@Body() dto: CreateCohortDto) {
    return this.cohortsService.create(dto);
  }

  // GET ALL COHORTS
  @Get()
  findAll() {
    return this.cohortsService.findAll();
  }

  // mentee's cohort membership history
  
  @Get('mentees/:menteeId/history')
  findMenteeMembershipHistory(
    @Param('menteeId', ParseUUIDPipe) menteeId: string,
  ) {
    return this.cohortsService.findMenteeMembershipHistory(
      menteeId,
    );
  }

  // find one cohort by cohortId
  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.cohortsService.findOne(id);
  }

  // updating cohort details
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCohortDto,
  ) {
    return this.cohortsService.update(id, dto);
  }

  // UPDATE COHORT STATUS
  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCohortStatusDto,
  ) {
    return this.cohortsService.updateStatus(id, dto.status);
  }

  // ADD MENTEE TO COHORT
  @Post(':id/mentees')
  addMentee(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddMenteeDto,
  ) {
    return this.cohortsService.addMentee(id, dto);
  }

  // GET MENTEES IN A SPECIFIC COHORT
  @Get(':id/mentees')
  findCohortMentees(
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.cohortsService.findCohortMentees(id);
  }

  // PAUSE A MENTEE'S MEMBERSHIP
  @Patch(':id/mentees/:menteeId/pause')
  pauseMentee(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('menteeId', ParseUUIDPipe) menteeId: string,
  ) {
    return this.cohortsService.pauseMentee(id, menteeId);
  }

  // RESUME A MENTEE'S MEMBERSHIP
  @Patch(':id/mentees/:menteeId/resume')
  resumeMentee(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('menteeId', ParseUUIDPipe) menteeId: string,
  ) {
    return this.cohortsService.resumeMentee(id, menteeId);
  }

  // REMOVE A MENTEE FROM A COHORT
  @Patch(':id/mentees/:menteeId/remove')
  removeMentee(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('menteeId', ParseUUIDPipe) menteeId: string,
  ) {
    return this.cohortsService.removeMentee(id, menteeId);
  }
}
