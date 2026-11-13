import { AccountStatus } from '../../shared/users/enum/users.enum.js';

export interface AuthenticatedUser {
  id: string;
  sessionId: string;
  firstName: string;
  lastName: string;
  email: string;
  status: AccountStatus;
  mustChangePassword: boolean;
}
