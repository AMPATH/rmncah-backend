import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface.js';

import { RequirePermissions } from '../../shared/rbac/authorization/decorators/permissions.decorator.js';
import { PermissionsGuard } from '../../shared/rbac/authorization/guards/permissions.guard.js';
import { SystemModule } from '../../shared/rbac/enum/system-module.enum.js';

import { CasesService } from './cases.service.js';

import { CreateCaseDto } from './dto/create-case.dto.js';
import { UpdateCaseDto } from './dto/update-case.dto.js';
import { ListCasesQueryDto } from './dto/list-cases-query.dto.js';

@Controller('cases')
@UseGuards(PermissionsGuard)
export class CasesController {
  constructor(private readonly casesService: CasesService) {}

  // --------------------------------------------------
  // CREATE CASE
  // --------------------------------------------------

  @Post()
  @RequirePermissions(SystemModule.MPDSR, 'mpdsr.cases.create')
  create(
    @Body() dto: CreateCaseDto,
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-organization-assignment-id') assignmentId: string,
  ) {
    return this.casesService.createCase(dto, user.id, assignmentId);
  }

  // --------------------------------------------------
  // LIST AND SEARCH CASES
  // --------------------------------------------------

  @Get()
  @RequirePermissions(SystemModule.MPDSR, 'mpdsr.cases.read')
  findAll(
    @Query() query: ListCasesQueryDto,
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-organization-assignment-id') assignmentId: string,
  ) {
    return this.casesService.findAll(query, user.id, assignmentId);
  }

  // --------------------------------------------------
  // GET ONE CASE
  // --------------------------------------------------

  @Get(':id')
  @RequirePermissions(SystemModule.MPDSR, 'mpdsr.cases.read')
  findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-organization-assignment-id') assignmentId: string,
  ) {
    return this.casesService.findOne(id, user.id, assignmentId);
  }

  // --------------------------------------------------
  // UPDATE CASE
  // --------------------------------------------------

  @Patch(':id')
  @RequirePermissions(SystemModule.MPDSR, 'mpdsr.cases.update')
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateCaseDto,
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-organization-assignment-id') assignmentId: string,
  ) {
    return this.casesService.updateCase(id, dto, user.id, assignmentId);
  }

  // --------------------------------------------------
  // SOFT DELETE CASE
  // --------------------------------------------------

  @Delete(':id')
  @RequirePermissions(SystemModule.MPDSR, 'mpdsr.cases.archive')
  remove(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-organization-assignment-id') assignmentId: string,
  ) {
    return this.casesService.softDeleteCase(id, user.id, assignmentId);
  }
}
