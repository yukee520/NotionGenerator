import type { LogToSheetRequest } from '@/types/n8n';
import type { ID } from '@/types/common';
import { logToSheet } from '@/api/n8n';
import { normalizeError } from '@/api/errors';
import { useSettingsStore } from '@/store/useSettingsStore';
import { enqueueTask } from './syncQueue';
import { nowIso } from '@/utils/date';
import { logger } from '@/utils/logger';

export type SheetEventType = LogToSheetRequest['eventType'];

export interface SheetLogInput {
  eventType: SheetEventType;
  entityId: ID;
  title: string;
  stage: string;
  status: string;
  payload: Record<string, string | number | boolean | null>;
}

async function tryDirect(input: LogToSheetRequest): Promise<boolean> {
  const settings = useSettingsStore.getState().settings;
  if (!settings.n8nWebhookUrl || !settings.googleSheetId) return false;
  try {
    await logToSheet(settings, input);
    return true;
  } catch (err) {
    logger.warn('logToSheet failed, queueing', normalizeError(err).message);
    return false;
  }
}

export async function logEvent(input: SheetLogInput): Promise<void> {
  const settings = useSettingsStore.getState().settings;
  const sheetId = settings.googleSheetId ?? '';

  const payload: LogToSheetRequest = {
    sheetId,
    eventType: input.eventType,
    entityId: input.entityId,
    title: input.title,
    stage: input.stage,
    status: input.status,
    payload: input.payload,
    occurredAt: nowIso(),
  };

  const ok = await tryDirect(payload);
  if (ok) return;

  enqueueTask('log_to_sheet', input.entityId, payload as unknown as Record<string, unknown>);
}

export function logEventFireAndForget(input: SheetLogInput): void {
  void logEvent(input);
}

export function makePayload(
  record: Record<string, unknown>,
): Record<string, string | number | boolean | null> {
  const out: Record<string, string | number | boolean | null> = {};
  for (const [k, v] of Object.entries(record)) {
    if (
      v === null ||
      typeof v === 'string' ||
      typeof v === 'number' ||
      typeof v === 'boolean'
    ) {
      out[k] = v as string | number | boolean | null;
    } else if (v !== undefined) {
      try {
        out[k] = JSON.stringify(v);
      } catch {
        out[k] = String(v);
      }
    }
  }
  return out;
}