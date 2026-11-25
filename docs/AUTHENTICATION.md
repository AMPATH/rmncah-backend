# Authentication and Account Security

## 1. Purpose

This document describes the authentication workflows in the RMNCAH/MPDSR backend.

Authentication is responsible for verifying user identity, managing passwords, issuing authentication credentials and managing user sessions.

The backend uses an invitation-based account activation workflow. Users do not choose a password during account creation. They receive an invitation and set their password when accepting it.

## 2. Authentication lifecycle

The normal authentication lifecycle is:

1. An authorized administrator creates a user account.
2. The user receives an invitation email.
3. The user accepts the invitation and sets a password.
4. The backend activates the account.
5. The user logs in.
6. The backend issues authentication credentials.
7. Protected endpoints validate the user's authentication and authorization.

Newly invited accounts remain `PENDING` until invitation acceptance.

## 3. Accept an invitation

Endpoint:

`POST /api/auth/accept-invitation`

Purpose:

- Validate the invitation token.
- Verify that the invitation is valid, unused and unexpired.
- Set the user's password.
- Mark the invitation as accepted.
- Activate the user account.

Example request:

```json
{
  "token": "<INVITATION_TOKEN>",
  "password": "<NEW_PASSWORD>"
}
```

The invitation token is single-use and expires after 24 hours.

Example terminal request:

```bash
curl -i -X POST http://localhost:3000/api/auth/accept-invitation \
  -H "Content-Type: application/json" \
  -d '{
    "token": "<INVITATION_TOKEN>",
    "password": "<NEW_PASSWORD>"
  }'
```

Use the actual token received by email and a strong password.

Do not share invitation tokens or passwords in source code, logs or chat messages.

## 4. Login

Endpoint:

`POST /api/auth/login`

Purpose:

- Authenticate a user using their email address and password.
- Verify that the account is eligible to log in.
- Issue authentication credentials.

Example request:

```json
{
  "email": "admin@example.com",
  "password": "<PASSWORD>"
}
```

Example terminal request:

```bash
curl -i -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "<PASSWORD>"
  }'
```

Use the access token returned by the API when accessing protected endpoints.

Example:

```bash
-H "Authorization: Bearer <ACCESS_TOKEN>"
```

## 5. Change password

Endpoint:

`POST /api/auth/change-password`

Authentication:

Required.

Purpose:

- Verify the user's current password.
- Validate the new password.
- Update the password hash.
- Clear the `mustChangePassword` flag.
- Revoke existing sessions after a successful password change.

Example request:

```json
{
  "currentPassword": "<CURRENT_PASSWORD>",
  "newPassword": "<NEW_PASSWORD>"
}
```

Example:

```bash
curl -i -X POST http://localhost:3000/api/auth/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -d '{
    "currentPassword": "<CURRENT_PASSWORD>",
    "newPassword": "<NEW_PASSWORD>"
  }'
```

The user must authenticate again after existing sessions have been revoked.

## 6. Forgot password

Endpoint:

`POST /api/auth/forgot-password`

Purpose:

- Allow a user to request a password reset.
- Generate a password-reset token.
- Store the token hash rather than the plaintext token.
- Send a password-reset email.

The endpoint should not disclose whether an email address belongs to an account.

Confirm the exact request DTO in the authentication module before sending requests.

## 7. Reset password

Endpoint:

`POST /api/auth/reset-password`

Purpose:

- Validate the password-reset token.
- Verify that the token has not expired, been used or been revoked.
- Update the password.
- Invalidate the reset token.
- Revoke existing sessions as implemented by the authentication service.

Confirm the exact reset DTO in the authentication module before sending requests.

## 8. Session security

Sessions are managed separately from the user's account record.

Password changes revoke existing sessions to prevent previously issued sessions from continuing to be used.

Review the session service and authentication controller for the exact refresh, logout and session-management routes before integrating them into the frontend.

## 9. Account statuses

| Status | Meaning |
|---|---|
| PENDING | Account has been created but invitation acceptance is incomplete |
| ACTIVE | Account has completed activation and is eligible to authenticate |
| INACTIVE | Account has been deactivated or is otherwise not eligible to authenticate |

The exact status rules should be enforced by the authentication and user-management services.

## 10. Security requirements

- Never store plaintext passwords.
- Store password hashes only.
- Never store plaintext invitation or password-reset tokens.
- Use HTTPS in production.
- Keep JWT and SMTP secrets outside source control.
- Do not share access tokens or reset links.
- Revoke sessions when security-sensitive account changes require it.
- Do not manually activate users to bypass invitation acceptance.

## 11. Backend testing checklist

- [ ] Accept a valid invitation.
- [ ] Verify the account becomes ACTIVE.
- [ ] Reject an invalid invitation token.
- [ ] Reject an expired invitation.
- [ ] Reject reuse of an accepted invitation.
- [ ] Log in with valid credentials.
- [ ] Reject incorrect credentials.
- [ ] Access a protected endpoint using a valid access token.
- [ ] Reject requests without authentication.
- [ ] Change password using the correct current password.
- [ ] Reject an incorrect current password.
- [ ] Request a password reset.
- [ ] Complete a password reset.
- [ ] Verify session revocation after password changes.
