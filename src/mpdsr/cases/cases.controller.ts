import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { ApiStandardSuccessResponse } from '../../common/decorators/api-success-response.decorator.js';

import { CaseResponseDto } from './dto/responses/case-response.dto.js';
import { CaseArchiveResponseDto } from './dto/responses/case-archive-response.dto.js';
import { PaginatedCasesResponseDto } from './dto/responses/paginated-cases-response.dto.js';

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
@ApiTags('MPDSR - Cases')
@ApiBearerAuth()
@UseGuards(PermissionsGuard)
export class CasesController {
  constructor(private readonly casesService: CasesService) {}

  @ApiStandardSuccessResponse(CaseResponseDto, {
    description: 'MPDSR case created successfully.',
    status: 201,
  })
  @ApiOperation({ summary: 'Create a new MPDSR case' })
  @Post()
  @RequirePermissions(SystemModule.MPDSR, 'mpdsr.cases.create')
  create(
    @Body() dto: CreateCaseDto,
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-organization-assignment-id') assignmentId: string,
  ) {
    return this.casesService.createCase(dto, user.id, assignmentId);
  }

  @ApiOkResponse({
    description: 'Paginated list of MPDSR cases retrieved successfully.',
    type: PaginatedCasesResponseDto,
  })
  @ApiOperation({ summary: 'Retrieve MPDSR cases' })
  @Get()
  @RequirePermissions(SystemModule.MPDSR, 'mpdsr.cases.read')
  findAll(
    @Query() query: ListCasesQueryDto,
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-organization-assignment-id') assignmentId: string,
  ) {
    return this.casesService.findAll(query, user.id, assignmentId);
  }

  @ApiStandardSuccessResponse(CaseResponseDto, {
    description: 'MPDSR case retrieved successfully.',
  })
  @ApiOperation({ summary: 'Retrieve a specific MPDSR case' })
  @Get(':id')
  @RequirePermissions(SystemModule.MPDSR, 'mpdsr.cases.read')
  findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-organization-assignment-id') assignmentId: string,
  ) {
    return this.casesService.findOne(id, user.id, assignmentId);
  }

  @ApiStandardSuccessResponse(CaseResponseDto, {
    description: 'MPDSR case updated successfully.',
  })
  @ApiOperation({ summary: 'Update an MPDSR case' })
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

  @ApiStandardSuccessResponse(CaseArchiveResponseDto, {
    description: 'MPDSR case archived successfully.',
  })
  @ApiOperation({ summary: 'Archive an MPDSR case' })
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
