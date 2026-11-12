import { Module } from '@nestjs/common';

import { CasesModule } from './cases/cases.module.js';
import { PcnsModule } from './pcns/pcns.module.js';

@Module({
  imports: [CasesModule, PcnsModule],
})
export class MpdsrModule {}
