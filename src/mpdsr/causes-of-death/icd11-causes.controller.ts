import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

import { Controller, Get, Query, UseGuards } from '@nestjs/common';

import { ApiStandardSuccessResponse } from '../../common/decorators/api-success-response.decorator.js';

import { RequirePermissions } from '../../shared/rbac/authorization/decorators/permissions.decorator.js';
import { PermissionsGuard } from '../../shared/rbac/authorization/guards/permissions.guard.js';
import { SystemModule } from '../../shared/rbac/enum/system-module.enum.js';

import { Icd11CausesService } from './icd11-causes.service.js';
import { ListIcd11CausesQueryDto } from './dto/list-icd11-causes-query.dto.js';
import { Icd11CauseResponseDto } from './dto/responses/icd11-cause-response.dto.js';
import { Icd11CauseCaseType } from './entities/icd11-cause-type.entity.js';

@Controller('icd11-causes')
@ApiTags('MPDSR - ICD-11 Causes')
@ApiBearerAuth()
@UseGuards(PermissionsGuard)
export class Icd11CausesController {
  constructor(
    private readonly icd11CausesService: Icd11CausesService,
  ) {}

  @ApiOperation({ summary: 'Retrieve ICD-11 causes of death' })
  @ApiStandardSuccessResponse(Icd11CauseResponseDto, {
    description: 'Paginated ICD-11 causes retrieved successfully.',
    isArray: true,
    isPaginated: true,
  })
  @ApiQuery({
    name: 'caseType',
    required: true,
    enum: Icd11CauseCaseType,
    description: 'Filter causes by case type: MATERNAL or PERINATAL.',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search by ICD-11 cause code or description.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    example: 1,
    description: 'Page number. Defaults to 1.',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 20,
    description: 'Number of records per page. Defaults to 20; maximum is 100.',
  })
  @Get()
  @RequirePermissions(SystemModule.MPDSR, 'mpdsr.cases.read')
  findAll(@Query() query: ListIcd11CausesQueryDto) {
    return this.icd11CausesService.findAll(query);
  }
}
