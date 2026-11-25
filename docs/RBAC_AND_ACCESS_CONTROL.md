# Role-Based Access Control and Organizational Access

## 1. Purpose

This document describes the role-based access control (RBAC) model used by the RMNCAH/MPDSR backend.

RBAC determines what authenticated users can do. Organizational assignments determine the scope within which operational users can perform those actions.

Authentication answers:

"Who is the user?"

Authorization answers:

"What is this user allowed to do?"

## 2. RBAC components

The access-control model uses the following components.

### Roles

Roles group related permissions.

Examples include:

- `SYSTEM_ADMIN`
- Operational and clinical roles defined by the RBAC seeder.

### Permissions

Permissions represent specific actions within application modules.

Examples of platform permissions include:

- `platform.users.create`
- `platform.users.read`
- `platform.users.update`
- `platform.users.deactivate`
- `platform.roles.assign`
- `platform.organization_assignments.create`

The authoritative permission list is maintained in the RBAC seed.

### Role-permission mappings

Role-permission mappings determine which permissions belong to each role.

These mappings are initialized by the RBAC seeder.

### User-role assignments

A user-role assignment connects a user to a role.

It also records assignment information such as:

- Assigning user.
- Assignment date.
- Expiry date.
- Revocation date.
- Organization assignment, where applicable.

### Organization assignments

Organization assignments define the organizational scope associated with a user.

They may represent a county, sub-county, PCN, facility or community unit, depending on the supported organizational model.

## 3. Seed roles and permissions

Run:

```bash
npm run seed:rbac
```

The seeder initializes the defined roles, permissions and role-permission mappings.

The operation does not create user accounts or assign roles to individual users.

## 4. System Administrator

The `SYSTEM_ADMIN` role is a platform-wide role.

It is intended for platform administration, including:

- Managing user accounts.
- Managing roles and access.
- Managing permissions.
- Managing organization assignments.

The role is not intended to automatically grant access to clinical records.

Its user-role assignment must have:

`organizationAssignmentId = NULL`

This represents platform-wide scope.

## 5. Operational roles

Operational roles must follow the organizational scope defined by their role rules.

For example:

- A facility-level user should operate within their assigned facility.
- A county-level user should operate within the applicable county scope.
- A sub-county user should operate within the applicable sub-county scope.

The backend must enforce these restrictions. Hiding records in the frontend is not sufficient authorization.

## 6. Authorization checks

Protected endpoints should validate:

1. The user is authenticated.
2. The account is eligible to access the system.
3. The user has the required permission.
4. The user has the required organizational scope.
5. The requested resource belongs to a scope the user is permitted to access.

A valid JWT alone does not grant permission to perform every operation.

## 7. Testing RBAC

Use separate accounts and separate access tokens to test different roles.

Suggested tests:

- A system administrator can perform permitted platform-management operations.
- A facility user can access only resources allowed by their facility scope.
- A county-level user cannot access resources outside their authorized scope.
- A read-only user cannot perform write operations.
- A user without a required permission receives an authorization failure.
- An unauthenticated user cannot access protected endpoints.
- A platform administrator does not automatically gain access to clinical records merely by having the platform role.

## 8. Database entities

The RBAC implementation uses:

- `roles`
- `permissions`
- `rolePermissions`
- `userRoleAssignments`
- User organization assignment records

Review the entities and services under:

```text
src/shared/rbac/
src/shared/user-organization-assignments/
```

## 9. Security principles

- Apply least privilege.
- Separate platform administration from clinical access.
- Require the correct organizational scope for operational roles.
- Do not rely on frontend checks for authorization.
- Revoke assignments when access is no longer appropriate.
- Audit role and organization assignment changes.
- Test both allowed and denied operations.

## 10. Implementation references

Relevant components include:

- RBAC seeder.
- Roles module.
- Permissions module.
- User role assignments module.
- User organization assignments module.
- Authorization service and guards.

The source code and seeded mappings remain the authoritative definition of available roles and permissions.
