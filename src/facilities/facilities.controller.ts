import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';

import { FacilitiesService } from './facilities.service.js';

import { CreateFacilityDto } from './dto/create-facility.dto.js';
import { UpdateFacilityDto } from './dto/update-facility.dto.js';
import { ListFacilitiesQueryDto } from './dto/list-facilities-query.dto.js';

@Controller('facilities')

@ApiTags('Facilities')
export class FacilitiesController {
  constructor(private readonly facilitiesService: FacilitiesService) {}

  @ApiOperation({ summary: 'Create a facility' })
  @Post()
  create(@Body() createFacilityDto: CreateFacilityDto) {
    return this.facilitiesService.create(createFacilityDto);
  }

  @ApiOperation({ summary: 'Retrieve facilities' })
  @Get()
  findAll(@Query() query: ListFacilitiesQueryDto) {
    return this.facilitiesService.findAll(query);
  }

  @ApiOperation({ summary: 'Retrieve a specific facility' })
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.facilitiesService.findOne(id);
  }

  @ApiOperation({ summary: 'Update a facility' })
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateFacilityDto: UpdateFacilityDto,
  ) {
    return this.facilitiesService.update(id, updateFacilityDto);
  }
}
