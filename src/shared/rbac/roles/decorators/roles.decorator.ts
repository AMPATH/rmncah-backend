
import { SetMetadata } from '@nestjs/common';

import { SystemModule } from '../../enum/system-module.enum.js';

export const ROLES_KEY = 'roles';

export interface RolesMetadata {
  module: SystemModule;
  roles: string[];
}

export const Roles = (
  module: SystemModule,
  ...roles: string[]
) =>
  SetMetadata(ROLES_KEY, {
    module,
    roles,
  } satisfies RolesMetadata);
