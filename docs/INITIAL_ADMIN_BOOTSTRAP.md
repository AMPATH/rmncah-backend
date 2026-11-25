# Initial System Administrator Bootstrap

See the project documentation for the initial administrator bootstrap procedure.

# Initial System Administrator Bootstrap

## 1. Purpose

This document explains how to create the first System Administrator account in the RMNCAH/MPDSR backend.

The bootstrap process creates the initial administrator without requiring an existing administrator account.

The account is created using the normal email invitation workflow. No preset password is generated or stored.

## 2. How the process works

The bootstrap process performs the following operations:

1. Checks whether an initial System Administrator has already been bootstrapped.
2. Checks whether the supplied email address already belongs to an existing user.
3. Finds the active `SYSTEM_ADMIN` role.
4. Creates a new user with `PENDING` status.
5. Assigns the `SYSTEM_ADMIN` role with platform-wide scope.
6. Records the initial administrator in the `system_bootstrap` table.
7. Generates a secure, single-use invitation token.
8. Sends the invitation email.
9. Marks the bootstrap record as `INVITATION_SENT`.

The administrator becomes `ACTIVE` after accepting the invitation and setting their password.

## 3. Prerequisites

Before running the bootstrap command, confirm that:

- The backend project is available.
- Node.js dependencies have been installed.
- The `.env` file contains valid database configuration.
- SMTP configuration is valid and email delivery works.
- Database migrations for the bootstrap and invitation functionality have been applied.
- RBAC roles and permissions have been seeded.
- The `SYSTEM_ADMIN` role exists and is active.

### Seed RBAC

From the backend project root:

```bash
npm run seed:rbac
```

The seeder initializes the system roles, permissions and role-permission mappings.

It does not create users or assign roles to users.

## 4. Environment configuration

The bootstrap command uses the existing `.env` configuration.

The email configuration should contain:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-sender-email
SMTP_PASSWORD=your-gmail-app-password
SMTP_FROM="RMNCAH System <your-sender-email>"
FRONTEND_URL=http://localhost:5173
```

Do not commit `.env` or expose SMTP credentials.

`FRONTEND_URL` determines the invitation link sent to the administrator.

## 5. Create the initial administrator

Navigate to the backend project:

```bash
cd ~/Desktop/ampath/projects/rmncah-backend
```

Run the bootstrap command:

```bash
npm run bootstrap:admin -- \
  --first-name "RMNCAH System" \
  --last-name "Admin" \
  --email "admin@example.com"
```

Replace the example email address with the intended administrator's email address.

The command displays the administrator details and asks for confirmation.

Type:

```text
YES
```

The confirmation is case-sensitive.

## 6. Expected result

When successful, the command displays a message similar to:

```text
Initial administrator invitation sent successfully.

Account:
{
  firstName: 'RMNCAH System',
  lastName: 'Admin',
  email: 'admin@example.com',
  status: 'PENDING',
  role: 'SYSTEM_ADMIN'
}
```

The administrator has:

- A platform-wide `SYSTEM_ADMIN` role.
- No organization assignment.
- No preset password.
- A pending account awaiting invitation acceptance.

The bootstrap process is designed to prevent the initial administrator from being created more than once.

## 7. Accept the invitation and set a password

The administrator receives an invitation email containing a link similar to:

```text
http://localhost:5173/accept-invitation?token=<INVITATION_TOKEN>
```

The invitation token is single-use and expires after 24 hours.

When the frontend is integrated, the administrator will:

1. Open the invitation link.
2. Enter a new password.
3. Submit the invitation acceptance form.
4. Be activated and become eligible to log in.

### Accepting the invitation without the frontend

During backend development, the invitation can be accepted directly through the API.

Endpoint:

```text
POST /api/auth/accept-invitation
```

Example request:

```bash
curl -i -X POST http://localhost:3000/api/auth/accept-invitation \
  -H "Content-Type: application/json" \
  -d '{
    "token": "<INVITATION_TOKEN>",
    "password": "<NEW_PASSWORD>"
  }'
```

Use the actual token from the invitation email and a strong password.

Never commit invitation tokens or passwords to source control or share them in logs or chat.

## 8. Verify administrator creation

Connect to the application database:

```sql
USE rmncah_db;
```

Check the bootstrap record:

```sql
SELECT *
FROM system_bootstrap;
```

Check the administrator account:

```sql
SELECT
    id,
    firstName,
    lastName,
    email,
    status,
    invitationAcceptedAt
FROM users
WHERE email = 'admin@example.com';
```

Check the role assignment:

```sql
SELECT
    u.email,
    r.code AS role,
    ura.organizationAssignmentId,
    ura.assignedAt,
    ura.revokedAt
FROM userRoleAssignments ura
JOIN users u ON u.id = ura.userId
JOIN roles r ON r.id = ura.roleId
WHERE u.email = 'admin@example.com';
```

The expected role is `SYSTEM_ADMIN`, and `organizationAssignmentId` should be `NULL`, indicating platform-wide scope.

After successful invitation acceptance, the user status should be `ACTIVE` and `invitationAcceptedAt` should be populated.

## 9. Login

Once the invitation has been accepted, the administrator can log in through:

```text
POST /api/auth/login
```

Use the email address and password created during invitation acceptance.

The returned access token can then be used to authenticate administrative API requests.

Example:

```bash
-H "Authorization: Bearer <ACCESS_TOKEN>"
```

## 10. Troubleshooting

### SYSTEM_ADMIN role not found

Run:

```bash
npm run seed:rbac
```

Then verify that the role exists and is active.

### Email delivery fails

Check SMTP configuration in `.env`.

The user and bootstrap record may already have been created. The invitation can be retried using the bootstrap command, provided the bootstrap record remains pending and the administrator has not accepted an invitation.

Do not manually create another administrator.

### Bootstrap already completed

The bootstrap process is intentionally one-time. It will not create another initial administrator once the bootstrap record exists.

For subsequent users, use the normal administrator-managed user invitation workflow.

### Invitation expired

Use the invitation resend functionality when available. Do not manually activate the user or set their password in the database.

## 11. Security considerations

- Never create the initial administrator with a hardcoded password.
- Never store plaintext invitation tokens in the database.
- Never manually change a pending user to active to bypass invitation acceptance.
- Keep SMTP credentials in environment variables.
- Keep the bootstrap utility separate from the normal application module.
- Protect the bootstrap command and its execution environment.
- Use the normal user invitation and role-assignment workflows for all subsequent accounts.

## 12. Important distinction

The initial administrator bootstrap is a one-time system initialization procedure.

It is not the normal user-registration endpoint.

After the initial administrator has been activated, subsequent accounts should be created through the authenticated user-management and invitation workflow.
