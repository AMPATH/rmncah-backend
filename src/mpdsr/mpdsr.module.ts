import { Module } from '@nestjs/common';

import { CasesModule } from './cases/cases.module.js';
import { PcnsModule } from './pcns/pcns.module.js';
import { Icd11CausesModule } from './causes-of-death/icd11-causes.module.js';

import { RbacModule } from '../shared/rbac/rbac.module.js';

@Module({
  imports: [
    CasesModule,
    PcnsModule,
    Icd11CausesModule,
    RbacModule,
  ],
})
export class MpdsrModule {}
