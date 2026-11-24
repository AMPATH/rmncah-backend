import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

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

@ApiTags('Locations - Sub-counties')
export class SubCountiesController {
  constructor(private readonly subCountiesService: SubCountiesService) {}

  @ApiOperation({ summary: 'Create a sub-county' })
  @Post()
  create(@Body() createSubCountyDto: CreateSubCountyDto) {
    return this.subCountiesService.create(createSubCountyDto);
  }

  @ApiOperation({ summary: 'Retrieve sub-counties' })
  @Get()
  findAll(@Query() query: ListSubCountiesQueryDto) {
    return this.subCountiesService.findAll(query);
  }

  @ApiOperation({ summary: 'Retrieve a specific sub-county' })
  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe)
    id: string,
  ) {
    return this.subCountiesService.findOne(id);
  }

  @ApiOperation({ summary: 'Update a sub-county' })
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe)
    id: string,
    @Body() updateSubCountyDto: UpdateSubCountyDto,
  ) {
    return this.subCountiesService.update(id, updateSubCountyDto);
  }

  @ApiOperation({ summary: 'Delete a sub-county' })
  @Delete(':id')
  remove(
    @Param('id', ParseUUIDPipe)
    id: string,
  ) {
    return this.subCountiesService.remove(id);
  }
}
