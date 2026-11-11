import { Module } from '@nestjs/common';

import { CountiesModule } from './counties/counties.module.js';
import { SubCountiesModule } from './sub-counties/sub-counties.module.js';
import { CommunityUnitsModule } from './community-units/community-units.module.js';

@Module({
  imports: [CountiesModule, SubCountiesModule, CommunityUnitsModule],
  exports: [CountiesModule, SubCountiesModule, CommunityUnitsModule],
})
export class LocationsModule {}
