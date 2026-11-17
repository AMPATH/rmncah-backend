# User Management and Invitations

## 1. Purpose

This document describes how user accounts are created and managed in the RMNCAH/MPDSR backend.

User management covers:

- Creating user accounts.
- Sending invitations.
- Accepting invitations.
- Resending and revoking invitations.
- Assigning roles.
- Assigning users to organizations.
- Updating and deactivating accounts.

## 2. Account creation workflow

The system uses an administrator-managed invitation workflow.

The process is:

1. An authenticated and authorized administrator submits a user creation request.
2. The backend validates the supplied details.
3. The backend creates a user with `PENDING` status.
4. The invitation service generates a secure token.
5. The backend stores the token hash.
6. An invitation email is sent to the new user.
7. The user accepts the invitation and sets a password.
8. The account becomes `ACTIVE`.

The user does not receive a preset password.

## 3. Create a user

The user-management endpoint is:

`POST /api/users`

Authentication and the required permission must be enforced.

Example request structure:

```json
{
  "firstName": "Test",
  "lastName": "Facility User",
  "email": "facility.user@example.com"
}
```

The actual required fields must be checked against the current `CreateUserDto`.

Example terminal request:

```bash
curl -i -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ADMIN_ACCESS_TOKEN>" \
  -d '{
    "firstName": "Test",
    "lastName": "Facility User",
    "email": "facility.user@example.com"
  }'
```

The endpoint must only be used by authorized administrators.

It must not be used to bypass the invitation process.

## 4. Invitation management

The invitation service manages invitation tokens and email delivery.

Its responsibilities include:

- Generating invitation tokens.
- Storing token hashes.
- Sending invitation emails.
- Setting invitation expiry.
- Preventing reuse of accepted invitations.
- Revoking previous pending invitations when issuing a replacement.
- Handling failed email delivery.

Invitation validity is currently 24 hours.

The initial administrator invitation is issued through the dedicated bootstrap utility.

For subsequent users, invitation operations must follow the authenticated invitation-management workflow.

Check `src/shared/invitations/invitations.controller.ts` for the exact routes and request DTOs for:

- Resending an invitation.
- Revoking an invitation.
- Other invitation-management operations.

Do not invent or expose invitation routes that are not implemented.

## 5. User roles

Creating a user and assigning a role are separate operations.

A role determines which application permissions the user receives.

Examples of role categories include:

- Platform administration.
- County-level coordination.
- Facility-level operations.
- MPDSR reporting and review.

The actual role codes are maintained by the RBAC seeder.

Before assigning a role:

1. Confirm that the role exists.
2. Confirm that the role is active.
3. Confirm the intended organizational scope.
4. Confirm that the acting administrator has permission to assign it.

## 6. Organization assignments

Organization assignments associate users with the organizational structures they work within.

Depending on the role, a user may be assigned to:

- County.
- Sub-county.
- Primary Care Network (PCN).
- Facility.
- Community Unit.

The correct assignment depends on the role's organizational scope.

A platform-wide role such as `SYSTEM_ADMIN` does not require an organization assignment.

Operational roles must use the organization assignment required by the role rules.

Do not assign a facility user to an unrelated facility simply to make a test request succeed.

## 7. User account management

User management should preserve the distinction between:

- Account creation.
- Invitation acceptance.
- Role assignment.
- Organization assignment.
- Account deactivation.

Account deactivation is different from invitation revocation.

Revoking an invitation prevents an outstanding invitation from being accepted. Deactivating an account prevents an existing account from continuing to use the system according to the authentication rules.

Check the actual user controller and service before using update or deactivation endpoints.

## 8. Example test accounts

For backend testing, create separate accounts with realistic roles and organizational scopes.

| Test account | Intended use |
|---|---|
| Facility in-charge | Facility-level management |
| MPDSR focal person | Case reporting |
| Case reviewer | Case review |
| County coordinator | County-level oversight |
| Read-only user | Verify read restrictions |

Use dedicated test email addresses and do not use real patient information in test records.

## 9. Testing user creation

For each test user:

1. Authenticate as an administrator.
2. Create the user.
3. Verify the user is `PENDING`.
4. Confirm the invitation email is sent.
5. Accept the invitation using the API.
6. Verify the user becomes `ACTIVE`.
7. Log in using the new account.
8. Assign the appropriate role and organizational scope through the authorized workflow.
9. Test access using that user's own token.

## 10. Important security rules

- Do not create accounts with preset passwords.
- Do not manually update user status to bypass invitation acceptance.
- Do not assign every user the `SYSTEM_ADMIN` role.
- Do not grant broader organizational scope than required.
- Do not use another user's access token to test permissions.
- Do not expose invitation tokens in logs or source control.
- Record role and organization assignment changes through the application's supported workflows.

## 11. Implementation references

Relevant source directories:

```text
src/shared/users/
src/shared/invitations/
src/shared/rbac/
src/shared/user-organization-assignments/
src/auth/
```

Relevant database entities:

- User
- Invitation
- Role
- Permission
- RolePermission
- UserRoleAssignment
- UserOrganizationAssignment
