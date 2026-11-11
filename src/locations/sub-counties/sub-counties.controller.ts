import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import { SubCountiesService } from './sub-counties.service.js';

import { CreateSubCountyDto } from './dto/create-sub-county.dto.js';
import { UpdateSubCountyDto } from './dto/update-sub-county.dto.js';
import { ListSubCountiesQueryDto } from './dto/list-sub-counties-query.dto.js';

@Controller('sub-counties')
export class SubCountiesController {
  constructor(private readonly subCountiesService: SubCountiesService) {}

  @Post()
  create(@Body() createSubCountyDto: CreateSubCountyDto) {
    return this.subCountiesService.create(createSubCountyDto);
  }

  @Get()
  findAll(@Query() query: ListSubCountiesQueryDto) {
    return this.subCountiesService.findAll(query);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe)
    id: string,
  ) {
    return this.subCountiesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe)
    id: string,
    @Body() updateSubCountyDto: UpdateSubCountyDto,
  ) {
    return this.subCountiesService.update(id, updateSubCountyDto);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseUUIDPipe)
    id: string,
  ) {
    return this.subCountiesService.remove(id);
  }
}
