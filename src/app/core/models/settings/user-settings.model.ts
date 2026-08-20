export interface UserSettings {
  sessionTimeout: number;
  allowedTimeouts: number[];
}

export interface UserSettingsResponse {
  success: boolean;
  message: string;
  data: UserSettings | { success: boolean };
  statusCode: number;
}
