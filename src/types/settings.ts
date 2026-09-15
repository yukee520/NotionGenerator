import type { ISODate, ThemeMode } from './common';

export interface AppSettings {
  n8nWebhookUrl: string;
  n8nApiKey?: string;
  googleSheetId?: string;
  googleRefreshToken?: string;
  autoSyncEnabled: boolean;
  syncIntervalSeconds: number;
  themeMode: ThemeMode;
  onboarded: boolean;
  lastHealthCheckAt?: ISODate;
  lastHealthCheckOk?: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  n8nWebhookUrl: '',
  n8nApiKey: undefined,
  googleSheetId: undefined,
  googleRefreshToken: undefined,
  autoSyncEnabled: true,
  syncIntervalSeconds: 30,
  themeMode: 'system',
  onboarded: false,
  lastHealthCheckAt: undefined,
  lastHealthCheckOk: undefined,
};

export interface SettingsValidationResult {
  valid: boolean;
  errors: Partial<Record<keyof AppSettings, string>>;
}