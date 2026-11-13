import { Module } from '@nestjs/common';

import { CasesModule } from './cases/cases.module.js';
import { PcnsModule } from './pcns/pcns.module.js';
import { RbacModule } from '../shared/rbac/rbac.module.js';

@Module({
  imports: [CasesModule, PcnsModule, RbacModule],
})
export class MpdsrModule {}
