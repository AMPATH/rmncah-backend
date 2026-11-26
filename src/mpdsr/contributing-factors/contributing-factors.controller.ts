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

import { ContributingFactorsService } from './contributing-factors.service.js';
import { ListContributingFactorsQueryDto } from './dto/list-contributing-factors-query.dto.js';
import { DelayLevel } from './enums/delay-level.enum.js';
import { ContributingFactorsListResponseDto } from './dto/responses/contributing-factors-list-response.dto.js';

@Controller('contributing-factors')
@ApiTags('MPDSR - Contributing Factors')
@ApiBearerAuth()
@UseGuards(PermissionsGuard)
export class ContributingFactorsController {
  constructor(
    private readonly contributingFactorsService: ContributingFactorsService,
  ) {}

  @ApiOperation({ summary: 'Retrieve contributing factors' })
  @ApiStandardSuccessResponse(ContributingFactorsListResponseDto, {
    description: 'Active contributing factors retrieved successfully.',
  })
  @ApiQuery({
    name: 'delayLevel',
    required: false,
    enum: DelayLevel,
    description:
      'Optional filter by delay level. Omit to retrieve all active contributing factors.',
  })
  @Get()
  @RequirePermissions(SystemModule.MPDSR, 'mpdsr.cases.read')
  findAll(@Query() query: ListContributingFactorsQueryDto) {
    return this.contributingFactorsService.findAll(query);
  }
}
