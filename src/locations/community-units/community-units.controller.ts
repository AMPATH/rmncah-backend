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
export class CommunityUnitsController {
  constructor(private readonly communityUnitsService: CommunityUnitsService) {}

  @Post()
  create(@Body() dto: CreateCommunityUnitDto) {
    return this.communityUnitsService.create(dto);
  }

  @Get()
  findAll(@Query() query: ListCommunityUnitsQueryDto) {
    return this.communityUnitsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.communityUnitsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCommunityUnitDto,
  ) {
    return this.communityUnitsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.communityUnitsService.remove(id);
  }
}
