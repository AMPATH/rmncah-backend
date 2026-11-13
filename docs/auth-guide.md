For the RMNCAH platform, I recommend implementing authentication as a complete lifecycle covering account creation, invitation, login, access tokens, refresh tokens, logout, password changes, forgotten passwords and account security.

We'll keep it aligned with your existing NestJS, TypeORM, MySQL, React and RBAC architecture.

1. Complete authentication workflow
   A. Account creation and activation
1. Administrator creates a user

   Uses the existing Users module to create an account with the user's details, role assignments and organizational assignments.

1. Account is created as pending
   - status = PENDING
   - passwordHash = null
   - invitationAcceptedAt = null
1. Invitation is generated and emailed

   Generate a cryptographically random token, store only its hash, and send the original token through an invitation link.

   Invitation expires after 24 hours.

1. User accepts invitation

   The user opens the invitation page and creates their password. The backend validates the token and expiry, hashes the password with Argon2id and consumes the invitation.

1. Account becomes active
   - status = ACTIVE
   - passwordHash is populated.
   - invitationAcceptedAt is recorded.
   - mustChangePassword = false.
     Account activated

B. Login and token issuance

1. User submits email and password

   POST /auth/login

2. Backend validates credentials
   - User exists.
   - Account is active.
   - Password matches the Argon2id hash.
3. Backend creates a session

   Records the session, refresh-token hash, expiry, IP address and user agent.

4. Backend issues two tokens
   - Short-lived access token.
   - Long-lived refresh token.
     User authenticated

C. Accessing protected resources

1. React sends the access token with API requests.
2. NestJS validates the JWT and checks the account/session.
3. RBAC guards check the user's roles and permissions.
4. The backend checks organizational scope before returning or modifying data.
   Authorized access

D. Access-token expiration and refresh

1. Access token expires after approximately 15 minutes.
2. React calls POST /auth/refresh using the refresh token.
3. Backend validates the refresh token against the stored hash.
4. Backend rotates the refresh token and issues a new access token.
5. The old refresh token becomes invalid.
   Session continues

E. Logout

1. React calls POST /auth/logout.
2. Backend revokes the current session.
3. Refresh token is invalidated and the cookie is cleared.
4. User must log in again.

5. Password management workflows
   These are three distinct processes. We should implement all three.
   A. Change password
   This is for a user who is already logged in and wants to change their password.
   Endpoint

POST /auth/change-password

Request
{
"currentPassword": "OldPassword123!",
"newPassword": "NewPassword456!",
"confirmPassword": "NewPassword456!"
}

Backend operations

1. Authenticate the user.
2. Verify their current password.
3. Validate the new password.
4. Hash the new password using Argon2id.
5. Update passwordHash.
6. Set mustChangePassword = false.
7. Revoke existing sessions and require login again.

B. Forgot password
This is for users who cannot remember their password.
Step 1: Request reset

POST /auth/forgot-password
{
"email": "user@example.com"
}

Backend generates a secure reset token and emails a reset link.

Step 2: Reset password

POST /auth/reset-password
{
"token": "reset-token-from-email",
"newPassword": "NewPassword456!",
"confirmPassword": "NewPassword456!"
}

Backend operations

1. Validate token hash and expiry.
2. Confirm token has not been used.
3. Hash the new password.
4. Update the user password.
5. Mark the reset token as used.
6. Revoke existing sessions.
7. Allow the user to log in again.

Reset tokens should expire after approximately 15–30 minutes. The forgot-password endpoint should return a generic response so attackers cannot discover registered email addresses.
C. First-time password creation
This happens during invitation acceptance, not through the forgot-password endpoint.

The user creates their initial password through the invitation link. No temporary or permanent password is sent by email. 3. Access token versus refresh token
We should use two different tokens with different purposes.
Feature Access token Refresh token
Purpose Access protected APIs Obtain new access tokens
Lifetime 15 minutes 7 days, configurable
Format JWT Cryptographically random opaque token
Storage React memory HttpOnly cookie and hashed database record
Rotation Issued during refresh Every successful refresh
Revocation Session validation Database revocation

My recommendation: Use JWT for access tokens and opaque, random refresh tokens stored as hashes in the database.

For the React frontend:

- Access token: keep in memory, not localStorage.
- Refresh token: secure, HttpOnly, SameSite cookie.
- Use HTTPS in production.
- Configure CORS and credentials appropriately.
  An access token should contain minimal claims, for example:
  {
  "sub": "user-uuid",
  "sid": "session-uuid",
  "iat": 1794550000,
  "exp": 1794550900
  }

The sid identifies the user's session. This allows the backend to reject tokens associated with revoked sessions. 4. Database entities we need
We already have the users entity. We should add three supporting entities.

1. UserInvitation

Table: user_invitations

- id
- userId
- tokenHash
- expiresAt
- usedAt
- createdBy
- createdAt
  Purpose: Initial account activation.

2. PasswordResetToken

Table: password_reset_tokens

- id
- userId
- tokenHash
- expiresAt
- usedAt
- createdAt
  Purpose: Secure password recovery.

3. UserSession

Table: user_sessions

- id
- userId
- refreshTokenHash
- ipAddress
- userAgent
- expiresAt
- lastUsedAt
- revokedAt
- createdAt
  Purpose: Track login sessions, refresh tokens and logout operations.

The session entity will support refresh-token rotation and revocation. We should also detect reuse of an old rotated refresh token and revoke its session. 5. Authentication API endpoints
Here is the complete endpoint structure I recommend.
Method Endpoint Access Purpose
POST /auth/login Public Login
POST /auth/refresh Refresh cookie Refresh tokens
POST /auth/logout Authenticated Logout current session
POST /auth/logout-all Authenticated Logout all sessions
GET /auth/me Authenticated Current user
POST /auth/accept-invitation Public, token required Activate account
POST /auth/forgot-password Public Request password reset
POST /auth/reset-password Public, token required Reset password
POST /auth/change-password Authenticated Change password
POST /auth/invitations/resend Admin Resend invitation

User creation remains under the existing Users module:

POST /users

The Users module creates the account, and the invitation workflow sends the invitation. We should not introduce a second user-registration mechanism. 6. Security rules and RBAC integration
For this platform, the following rules are important:

1. Only ACTIVE users can log in.
2. PENDING, INACTIVE and DEACTIVATED accounts cannot authenticate.
3. Never store plaintext passwords or invitation/reset/refresh tokens.
4. Invitation and password-reset tokens must be single-use.
5. Refresh tokens must rotate on every successful refresh.
6. Password changes and resets revoke existing sessions.
7. Account deactivation should revoke all sessions.
8. Login and password-reset endpoints should be rate-limited.
9. Roles and permissions must come from backend RBAC data, never from client-supplied values.
10. Organizational access must be enforced by the backend.
11. Log important security events without logging passwords or raw tokens.
    For mustChangePassword, retain your existing field. It supports administrator-forced password changes. It does not mean every invited user must change a temporary password: invited users create their own password during activation.

12. Recommended implementation sequence
    This is the order I suggest we follow in your existing project.
    Phase 1 — Account invitation
    Existing users module
13. UserInvitation entity.
14. Migration for user_invitations.
15. Invitation service: generate, hash, validate and consume tokens.
16. Email service: send invitation emails.
17. Invitation acceptance endpoint and initial password creation.
18. Resend invitation functionality.

Phase 2 — Login and access tokens

1. Complete login validation.
2. Update lastLoginAt.
3. Implement access-token issuance.
4. Implement JWT strategy and guards.
5. Implement /auth/me.

Phase 3 — Sessions and refresh tokens

1. UserSession entity.
2. Migration for user_sessions.
3. Session creation during login.
4. Refresh-token generation and hashing.
5. Refresh endpoint and token rotation.
6. Logout current session.
7. Logout all sessions.

Phase 4 — Password management

1. Change-password DTO and endpoint.
2. PasswordResetToken entity.
3. Migration for password reset tokens.
4. Forgot-password endpoint.
5. Password-reset endpoint.
6. Session revocation after password changes and resets.

Phase 5 — Security and authorization

1. Integrate authentication with RBAC.
2. Enforce account and session validity.
3. Enforce organizational scope.
4. Apply rate limiting.
5. Audit authentication and security events.
6. Write unit and integration tests for the full workflow.

Phase 6 — Frontend integration

1. Invitation acceptance page.
2. Login page.
3. Automatic access-token refresh.
4. Logout and session expiry handling.
5. Forgot/reset password pages.
6. Change-password page.

7. Where we currently stand
   Based on the work we've completed:
   Component Status
   Users module Implemented
   User creation DTO/service Implemented
   Argon2id PasswordService Implemented
   Login DTO Implemented
   AuthService login Implemented
   JWT access-token configuration Implemented
   JWT strategy and guard Implemented
   /auth/me Implemented
   Invitation workflow Pending
   Refresh-token sessions Pending
   Logout Pending
   Password reset Pending
   Change password Pending
   RBAC integration with auth Pending

The current implementation builds successfully, but that does not yet mean the entire authentication workflow is complete or tested.

Let's proceed
I recommend we follow these phases in order and not jump ahead.

Our immediate next task is Phase 1, Step 1: implement the UserInvitation entity and its migration.

We will:

- Reuse the existing Users module.
- Keep invitation logic in the Auth module.
- Use the existing PasswordService for password hashing.
- Use secure random invitation/reset tokens and hash them separately.
- Avoid mandatory profile completion.
- Test each step before moving to the next.
  This will give us a complete, maintainable authentication system rather than just a login endpoint.
