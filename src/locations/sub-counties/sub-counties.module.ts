import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SubCounty } from './entities/sub-county.entity.js';
import { County } from '../counties/entities/county.entity.js';

import { SubCountiesController } from './sub-counties.controller.js';
import { SubCountiesService } from './sub-counties.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([SubCounty, County])],
  controllers: [SubCountiesController],
  providers: [SubCountiesService],
})
export class SubCountiesModule {}
