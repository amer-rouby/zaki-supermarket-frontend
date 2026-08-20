export interface SecuritySettings {
  id: number;
  userId: number;
  twoFactorEnabled: boolean;
  sessionTimeoutMinutes: number;
  requirePasswordChange: boolean;
  lastPasswordChange?: string;
  failedLoginAttempts: number;
  accountLocked: boolean;
  accountLockedUntil?: string;
  securityQuestion?: string;
  loginHistoryEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SecuritySettingsRequest {
  twoFactorEnabled?: boolean;
  sessionTimeoutMinutes?: number;
  requirePasswordChange?: boolean;
  securityQuestion?: string;
  securityAnswer?: string;
  loginHistoryEnabled?: boolean;
}

export interface PasswordChangeRequest {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}
