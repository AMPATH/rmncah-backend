import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Facility } from './entities/facility.entity.js';
import { SubCounty } from '../locations/sub-counties/entities/sub-county.entity.js';

import { FacilitiesController } from './facilities.controller.js';
import { FacilitiesService } from './facilities.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Facility, SubCounty])],
  controllers: [FacilitiesController],
  providers: [FacilitiesService],
  exports: [FacilitiesService],
})
export class FacilitiesModule {}
