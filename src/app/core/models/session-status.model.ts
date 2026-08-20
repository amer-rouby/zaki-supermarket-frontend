export interface SessionStatus {
  isActive?: boolean;
  active?: boolean;
  expiresAt: string;
  remainingMinutes: number;
  warningThreshold: number;
  canExtend: boolean;
  remainingExtensions: number;
}

export interface ExtendSessionResponse {
  success: boolean;
  expiresAt: string;
  remainingExtensions: number;
  message: string;
}

export interface SessionWarningData {
  remainingMinutes: number;
  canExtend: boolean;
  remainingExtensions: number;
  expiresAt?: string;
}

export interface SessionWarningResponse {
  code: string; // "SESSION_WARNING"
  message: string;
  data: SessionWarningData;
}
