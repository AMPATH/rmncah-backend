import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PrimaryCareNetwork } from './entities/primary-care-network.entity.js';
import { FacilityPcnMembership } from './entities/facility-pcn-membership.entity.js';

import { Facility } from '../../facilities/entities/facility.entity.js';
import { SubCounty } from '../../locations/sub-counties/entities/sub-county.entity.js';

import { PcnsController } from './pcns.controller.js';
import { PcnsService } from './pcns.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PrimaryCareNetwork,
      FacilityPcnMembership,
      Facility,
      SubCounty,
    ]),
  ],
  controllers: [PcnsController],
  providers: [PcnsService],
  exports: [PcnsService],
})
export class PcnsModule {}
