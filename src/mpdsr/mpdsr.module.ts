import { Module } from '@nestjs/common';

import { CasesModule } from './cases/cases.module.js';

@Module({
  imports: [CasesModule],
})
export class MpdsrModule {}
