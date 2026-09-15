import { AppSettings } from '@/types/settings';
import { SyncTask, SyncTaskType, useSyncQueueStore } from '@/store/useSyncQueueStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import * as n8n from '@/api/n8n';
import { normalizeError } from '@/api/errors';
import { logger } from '@/utils/logger';
import { nowIso } from '@/utils/date';

let intervalHandle: ReturnType<typeof setInterval> | null = null;
let running = false;

const MAX_TASKS_PER_CYCLE = 5;

type Handler = (task: SyncTask, settings: AppSettings) => Promise<void>;

const handlers: Record<SyncTaskType, Handler> = {
  generate_ideas: async (task, settings) => {
    await n8n.generateIdeas(
      settings,
      task.payload as Parameters<typeof n8n.generateIdeas>[1],
    );
  },
  build_template: async (task, settings) => {
    await n8n.buildTemplate(
      settings,
      task.payload as Parameters<typeof n8n.buildTemplate>[1],
    );
  },
  build_status: async (task, settings) => {
    const jobId = String(task.payload.jobId ?? '');
    await n8n.getBuildStatus(settings, jobId);
  },
  generate_guide: async (task, settings) => {
    await n8n.generateGuide(
      settings,
      task.payload as Parameters<typeof n8n.generateGuide>[1],
    );
  },
  generate_price: async (task, settings) => {
    await n8n.generatePrice(
      settings,
      task.payload as Parameters<typeof n8n.generatePrice>[1],
    );
  },
  generate_listing: async (task, settings) => {
    await n8n.generateListing(
      settings,
      task.payload as Parameters<typeof n8n.generateListing>[1],
    );
  },
  generate_marketing: async (task, settings) => {
    await n8n.generateMarketing(
      settings,
      task.payload as Parameters<typeof n8n.generateMarketing>[1],
    );
  },
  publish_marketing: async (task, settings) => {
    await n8n.publishMarketing(
      settings,
      task.payload as Parameters<typeof n8n.publishMarketing>[1],
    );
  },
  log_to_sheet: async (task, settings) => {
    await n8n.logToSheet(
      settings,
      task.payload as Parameters<typeof n8n.logToSheet>[1],
    );
  },
  qa_template: async (task, settings) => {
    await n8n.qaTemplate(
      settings,
      task.payload as Parameters<typeof n8n.qaTemplate>[1],
    );
  },
};

async function runTask(task: SyncTask): Promise<void> {
  const settings = useSettingsStore.getState().settings;
  const store = useSyncQueueStore.getState();
  store.markInFlight(task.id);
  try {
    const handler = handlers[task.type];
    if (!handler) throw new Error(`No handler for task type: ${task.type}`);
    await handler(task, settings);
    useSyncQueueStore.getState().markDone(task.id);
    logger.debug('Sync task done', task.type, task.entityId);
  } catch (err) {
    const message = normalizeError(err).message;
    useSyncQueueStore.getState().markFailed(task.id, message);
    logger.warn('Sync task failed', task.type, message);
  }
}

export async function runCycle(): Promise<void> {
  if (running) return;
  running = true;
  try {
    const settings = useSettingsStore.getState().settings;
    if (!settings.autoSyncEnabled) return;
    if (!settings.n8nWebhookUrl) return;

    const store = useSyncQueueStore.getState();
    store.setWorkerRunning(true);
    store.setLastRunAt(nowIso());

    const now = Date.now();
    const runnable = store.tasks
      .filter((t) => t.status === 'pending')
      .filter((t) => new Date(t.nextAttemptAt).getTime() <= now)
      .slice(0, MAX_TASKS_PER_CYCLE);

    for (const task of runnable) {
      // eslint-disable-next-line no-await-in-loop
      await runTask(task);
    }
  } finally {
    running = false;
    useSyncQueueStore.getState().setWorkerRunning(false);
  }
}

export function startSyncWorker(): void {
  if (intervalHandle !== null) return;
  const settings = useSettingsStore.getState().settings;
  const seconds = Math.max(10, settings.syncIntervalSeconds || 30);
  intervalHandle = setInterval(() => {
    void runCycle();
  }, seconds * 1000);
  logger.info('Sync worker started', seconds);
  void runCycle();
}

export function stopSyncWorker(): void {
  if (intervalHandle !== null) {
    clearInterval(intervalHandle);
    intervalHandle = null;
    logger.info('Sync worker stopped');
  }
}

export function restartSyncWorker(): void {
  stopSyncWorker();
  startSyncWorker();
}

export function enqueueTask(
  type: SyncTaskType,
  entityId: string,
  payload: Record<string, unknown>,
): SyncTask {
  return useSyncQueueStore.getState().enqueue(type, entityId, payload);
}

export function queueStats(): { pending: number; failed: number; total: number } {
  const tasks = useSyncQueueStore.getState().tasks;
  return {
    pending: tasks.filter((t) => t.status === 'pending' || t.status === 'in_flight').length,
    failed: tasks.filter((t) => t.status === 'failed').length,
    total: tasks.length,
  };
}