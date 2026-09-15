import { useCallback, useMemo } from 'react';
import type { AppSettings, SettingsValidationResult } from '@/types/settings';
import { useSettingsStore } from '@/store/useSettingsStore';
import { pingN8n } from '@/api/n8n';
import { normalizeError } from '@/api/errors';

export interface HealthCheckResult {
  ok: boolean;
  message?: string;
  version?: string;
}

export interface UseSettingsResult {
  settings: AppSettings;
  hydrated: boolean;
  update: (patch: Partial<AppSettings>) => void;
  replace: (settings: AppSettings) => void;
  reset: () => void;
  validate: () => SettingsValidationResult;
  markHealthCheck: (ok: boolean) => void;
  checkHealth: () => Promise<HealthCheckResult>;
}

export function useSettings(): UseSettingsResult {
  const settings = useSettingsStore((s) => s.settings);
  const hydrated = useSettingsStore((s) => s.hydrated);
  const update = useSettingsStore((s) => s.update);
  const replace = useSettingsStore((s) => s.replace);
  const reset = useSettingsStore((s) => s.reset);
  const validate = useSettingsStore((s) => s.validate);
  const markHealthCheck = useSettingsStore((s) => s.markHealthCheck);

  const checkHealth = useCallback(async (): Promise<HealthCheckResult> => {
    const current = useSettingsStore.getState().settings;
    if (!current.n8nWebhookUrl) {
      markHealthCheck(false);
      return { ok: false, message: 'n8n webhook URL is not configured.' };
    }
    try {
      const res = await pingN8n(current);
      markHealthCheck(true);
      return { ok: true, version: res.version };
    } catch (err) {
      const message = normalizeError(err).message;
      markHealthCheck(false);
      return { ok: false, message };
    }
  }, [markHealthCheck]);

  return useMemo(
    () => ({
      settings,
      hydrated,
      update,
      replace,
      reset,
      validate,
      markHealthCheck,
      checkHealth,
    }),
    [settings, hydrated, update, replace, reset, validate, markHealthCheck, checkHealth],
  );
}