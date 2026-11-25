import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RbacModule } from '../../shared/rbac/rbac.module.js';

import { Icd11Cause } from './entities/icd11-cause.entity.js';
import { Icd11CauseType } from './entities/icd11-cause-type.entity.js';

import { Icd11CausesController } from './icd11-causes.controller.js';
import { Icd11CausesService } from './icd11-causes.service.js';

@Module({
  imports: [
    RbacModule,
    TypeOrmModule.forFeature([Icd11Cause, Icd11CauseType]),
  ],
  controllers: [Icd11CausesController],
  providers: [Icd11CausesService],
  exports: [Icd11CausesService],
})
export class Icd11CausesModule {}
