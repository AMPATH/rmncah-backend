import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import { PcnsService } from './pcns.service.js';

import { CreatePrimaryCareNetworkDto } from './dto/create-pcn.dto.js';
import { UpdatePrimaryCareNetworkDto } from './dto/update-pcn.dto.js';
import { ListPrimaryCareNetworksQueryDto } from './dto/list-primary-care-networks-query.dto.js';
import { AssignFacilityToPcnDto } from './dto/assign-facility-to-pcn.dto.js';

@Controller('pcns')
export class PcnsController {
  constructor(private readonly pcnsService: PcnsService) {}

  // POST /pcns
  @Post()
  create(@Body() dto: CreatePrimaryCareNetworkDto) {
    return this.pcnsService.create(dto);
  }

  // GET /pcns
  @Get()
  findAll(@Query() query: ListPrimaryCareNetworksQueryDto) {
    return this.pcnsService.findAll(query);
  }

  // GET /pcns/:id
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.pcnsService.findOne(id);
  }

  // PATCH /pcns/:id
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePrimaryCareNetworkDto,
  ) {
    return this.pcnsService.update(id, dto);
  }

  // POST /pcns/assign-facility
  @Post('assign-facility')
  assignFacility(@Body() dto: AssignFacilityToPcnDto) {
    return this.pcnsService.assignFacility(dto);
  }
}
