import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CommunityUnit } from './entities/community-unit.entity.js';
import { Facility } from '../../facilities/entities/facility.entity.js';

import { CommunityUnitsController } from './community-units.controller.js';
import { CommunityUnitsService } from './community-units.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([CommunityUnit, Facility])],
  controllers: [CommunityUnitsController],
  providers: [CommunityUnitsService],
  exports: [CommunityUnitsService],
})
export class CommunityUnitsModule {}
