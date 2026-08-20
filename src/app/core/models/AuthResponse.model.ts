export interface AuthResponse {
  // Present only when the account has 2FA enabled and password auth just succeeded -
  // in that case every field below is absent, and completeTwoFactorLogin() must be
  // called with twoFactorTempToken + a code to actually get a session.
  twoFactorRequired?: boolean;
  twoFactorTempToken?: string;

  userId: number;
  username: string;
  fullName: string;
  role: string;
  storeId: number;
  storeName: string;
  accessToken: string;
  refreshToken: string;
  tokenType: string; // "Bearer"
  expiresIn: number;  // timestamp
  expiresAt: string;  // ISO datetime
  sessionTimeout: number; // minutes
  warningThreshold?: number; // minutes before warning
  maxExtensions?: number; // max allowed extensions
  remainingExtensions?: number; // remaining extensions
  canExtend?: boolean; // true if can extend
  message?: string;
}
