import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CasesController } from './cases.controller.js';
import { CasesService } from './cases.service.js';
import { Case } from './entities/case.entity.js';
import { MaternalCaseDetail } from './entities/maternal-case-detail.entity.js';
import { NearMissDetail } from './entities/near-miss-detail.entity.js';
import { PerinatalCaseDetail } from './entities/perinatal-case-detail.entity.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Case,
      MaternalCaseDetail,
      PerinatalCaseDetail,
      NearMissDetail,
    ]),
  ],
  controllers: [CasesController],
  providers: [CasesService],
  exports: [CasesService],
})
export class CasesModule {}
