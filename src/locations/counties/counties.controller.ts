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

import { CountiesService } from './counties.service.js';

import { CreateCountyDto } from './dto/create-county.dto.js';
import { UpdateCountyDto } from './dto/update-county.dto.js';
import { ListCountiesQueryDto } from './dto/list-counties-query.dto.js';

@Controller('counties')

@ApiTags('Locations - Counties')
export class CountiesController {
  constructor(private readonly countiesService: CountiesService) {}

  @ApiOperation({ summary: 'Create a county' })
  @Post()
  create(@Body() createCountyDto: CreateCountyDto) {
    return this.countiesService.create(createCountyDto);
  }

  @ApiOperation({ summary: 'Retrieve counties' })
  @Get()
  findAll(@Query() query: ListCountiesQueryDto) {
    return this.countiesService.findAll(query);
  }

  @ApiOperation({ summary: 'Retrieve a specific county' })
  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe)
    id: string,
  ) {
    return this.countiesService.findOne(id);
  }

  @ApiOperation({ summary: 'Update a county' })
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe)
    id: string,
    @Body() updateCountyDto: UpdateCountyDto,
  ) {
    return this.countiesService.update(id, updateCountyDto);
  }

  @ApiOperation({ summary: 'Delete a county' })
  @Delete(':id')
  remove(
    @Param('id', ParseUUIDPipe)
    id: string,
  ) {
    return this.countiesService.remove(id);
  }
}
