import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Delete,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';

import { CommunityUnitsService } from './community-units.service.js';

import { CreateCommunityUnitDto } from './dto/create-community-unit.dto.js';
import { UpdateCommunityUnitDto } from './dto/update-community-unit.dto.js';
import { ListCommunityUnitsQueryDto } from './dto/list-community-units-query.dto.js';

@Controller('community-units')

@ApiTags('Locations - Community Units')
export class CommunityUnitsController {
  constructor(private readonly communityUnitsService: CommunityUnitsService) {}

  @ApiOperation({ summary: 'Create a community unit' })
  @Post()
  create(@Body() dto: CreateCommunityUnitDto) {
    return this.communityUnitsService.create(dto);
  }

  @ApiOperation({ summary: 'Retrieve community units' })
  @Get()
  findAll(@Query() query: ListCommunityUnitsQueryDto) {
    return this.communityUnitsService.findAll(query);
  }

  @ApiOperation({ summary: 'Retrieve a specific community unit' })
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.communityUnitsService.findOne(id);
  }

  @ApiOperation({ summary: 'Update a community unit' })
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCommunityUnitDto,
  ) {
    return this.communityUnitsService.update(id, dto);
  }

  @ApiOperation({ summary: 'Delete a community unit' })
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.communityUnitsService.remove(id);
  }
}
