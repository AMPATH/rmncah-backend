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
  BadRequestException,
} from '@nestjs/common';

import { CasesService } from './cases.service.js';

import { CreateCaseDto } from './dto/create-case.dto.js';
import { UpdateCaseDto } from './dto/update-case.dto.js';
import { ListCasesQueryDto } from './dto/list-cases-query.dto.js';

@Controller('cases')
export class CasesController {
  constructor(private readonly casesService: CasesService) {}

  /**
   * Create a maternal, perinatal or near-miss case.
   * POST /cases
   *
   * Temporary development header:
   * x-reporter-id: UUID
   */
  @Post()
  create(
    @Body() dto: CreateCaseDto,
    @Headers('x-reporter-id') reportedBy: string,
  ) {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!reportedBy || !uuidRegex.test(reportedBy)) {
      throw new BadRequestException(
        'A valid x-reporter-id UUID header is required.',
      );
    }

    return this.casesService.createCase(dto, reportedBy);
  }

  /**
   * Retrieve all cases with optional filters and pagination.
   * GET /cases
   */
  @Get()
  findAll(@Query() query: ListCasesQueryDto) {
    return this.casesService.findAll(query);
  }

  /**
   * Retrieve a single case with its clinical details.
   * GET /cases/:id
   */
  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.casesService.findOne(id);
  }

  /**
   * Update an existing case and its clinical details.
   * PATCH /cases/:id
   */
  @Patch(':id')
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateCaseDto,
  ) {
    return this.casesService.updateCase(id, dto);
  }

  //Soft-delete a case.

  @Delete(':id')
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.casesService.softDeleteCase(id);
  }
}
