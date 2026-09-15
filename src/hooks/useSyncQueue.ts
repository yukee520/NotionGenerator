import { useCallback, useEffect, useMemo } from 'react';
import { useSyncQueueStore, SyncTask } from '@/store/useSyncQueueStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import {
  restartSyncWorker,
  runCycle,
  startSyncWorker,
  stopSyncWorker,
} from '@/services/syncQueue';

export interface UseSyncQueueResult {
  tasks: SyncTask[];
  pending: number;
  failed: number;
  total: number;
  workerRunning: boolean;
  lastRunAt?: string;
  runNow: () => Promise<void>;
  retry: (taskId: string) => void;
  clearDone: () => void;
  clearAll: () => void;
}

export function useSyncQueue(): UseSyncQueueResult {
  const tasks = useSyncQueueStore((s) => s.tasks);
  const workerRunning = useSyncQueueStore((s) => s.workerRunning);
  const lastRunAt = useSyncQueueStore((s) => s.lastRunAt);
  const resetTask = useSyncQueueStore((s) => s.reset);
  const clearDone = useSyncQueueStore((s) => s.clearDone);
  const clearAll = useSyncQueueStore((s) => s.clearAll);

  const autoSyncEnabled = useSettingsStore((s) => s.settings.autoSyncEnabled);
  const syncIntervalSeconds = useSettingsStore((s) => s.settings.syncIntervalSeconds);
  const webhookUrl = useSettingsStore((s) => s.settings.n8nWebhookUrl);

  useEffect(() => {
    if (autoSyncEnabled && webhookUrl) {
      startSyncWorker();
      return () => {
        stopSyncWorker();
      };
    }
    stopSyncWorker();
    return undefined;
  }, [autoSyncEnabled, syncIntervalSeconds, webhookUrl]);

  useEffect(() => {
    restartSyncWorker();
  }, [syncIntervalSeconds]);

  const runNow = useCallback(async () => {
    await runCycle();
  }, []);

  const retry = useCallback(
    (taskId: string) => {
      resetTask(taskId);
      void runCycle();
    },
    [resetTask],
  );

  const counts = useMemo(() => {
    const pending = tasks.filter(
      (t) => t.status === 'pending' || t.status === 'in_flight',
    ).length;
    const failed = tasks.filter((t) => t.status === 'failed').length;
    return { pending, failed, total: tasks.length };
  }, [tasks]);

  return {
    tasks,
    pending: counts.pending,
    failed: counts.failed,
    total: counts.total,
    workerRunning,
    lastRunAt,
    runNow,
    retry,
    clearDone,
    clearAll,
  };
}