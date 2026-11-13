import { SetMetadata } from '@nestjs/common';

import { SystemModule } from '../../enum/system-module.enum.js';

export const REQUIRED_PERMISSIONS_KEY = 'required_permissions';

export interface RequiredPermissionsMetadata {
  module: SystemModule;
  permissions: string[];
}

/**
 * Declares the module and permissions required by an endpoint.
 *
 * All listed permissions must be held by the user.
 */
export const RequirePermissions = (
  module: SystemModule,
  ...permissions: string[]
) => {
  if (permissions.length === 0) {
    throw new Error('RequirePermissions needs at least one permission.');
  }

  if (permissions.some((permission) => !permission.trim())) {
    throw new Error('Permission codes cannot be empty.');
  }

  const prefix = `${String(module).toLowerCase()}.`;

  const mismatched = permissions.filter(
    (permission) => !permission.startsWith(prefix),
  );

  if (mismatched.length > 0) {
    throw new Error(
      `Permissions [${mismatched.join(', ')}] do not belong to module ${module}. Expected prefix: ${prefix}`,
    );
  }

  return SetMetadata(REQUIRED_PERMISSIONS_KEY, {
    module,
    permissions,
  } satisfies RequiredPermissionsMetadata);
};
