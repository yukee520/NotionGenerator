import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ID, ISODate } from '@/types/common';
import { newId } from '@/utils/id';
import { nowIso } from '@/utils/date';

export type SyncTaskType =
  | 'generate_ideas'
  | 'build_template'
  | 'build_status'
  | 'generate_guide'
  | 'generate_price'
  | 'generate_listing'
  | 'generate_marketing'
  | 'publish_marketing'
  | 'log_to_sheet'
  | 'qa_template';

export type SyncTaskStatus = 'pending' | 'in_flight' | 'failed' | 'done';

export interface SyncTask {
  id: ID;
  type: SyncTaskType;
  entityId: ID;
  payload: Record<string, unknown>;
  attempts: number;
  maxAttempts: number;
  lastError?: string;
  nextAttemptAt: ISODate;
  status: SyncTaskStatus;
  createdAt: ISODate;
  updatedAt: ISODate;
}

interface SyncQueueState {
  tasks: SyncTask[];
  workerRunning: boolean;
  lastRunAt?: ISODate;
  enqueue: (type: SyncTaskType, entityId: ID, payload: Record<string, unknown>) => SyncTask;
  dequeue: (taskId: ID) => void;
  markInFlight: (taskId: ID) => void;
  markDone: (taskId: ID) => void;
  markFailed: (taskId: ID, error: string) => void;
  reset: (taskId: ID) => void;
  clearDone: () => void;
  clearAll: () => void;
  setWorkerRunning: (running: boolean) => void;
  setLastRunAt: (iso: ISODate) => void;
  pendingCount: () => number;
  failedCount: () => number;
}

function backoffMs(attempts: number): number {
  const base = 5000;
  const max = 10 * 60 * 1000;
  const value = base * Math.pow(2, Math.max(0, attempts - 1));
  return Math.min(max, value);
}

export const useSyncQueueStore = create<SyncQueueState>()(
  persist(
    (set, get) => ({
      tasks: [],
      workerRunning: false,
      lastRunAt: undefined,

      enqueue: (type, entityId, payload) => {
        const ts = nowIso();
        const task: SyncTask = {
          id: newId('task'),
          type,
          entityId,
          payload,
          attempts: 0,
          maxAttempts: 5,
          nextAttemptAt: ts,
          status: 'pending',
          createdAt: ts,
          updatedAt: ts,
        };
        set((state) => ({ tasks: [task, ...state.tasks] }));
        return task;
      },

      dequeue: (taskId) => {
        set((state) => ({ tasks: state.tasks.filter((t) => t.id !== taskId) }));
      },

      markInFlight: (taskId) => {
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId
              ? { ...t, status: 'in_flight', updatedAt: nowIso() }
              : t,
          ),
        }));
      },

      markDone: (taskId) => {
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId
              ? { ...t, status: 'done', updatedAt: nowIso() }
              : t,
          ),
        }));
      },

      markFailed: (taskId, error) => {
        set((state) => ({
          tasks: state.tasks.map((t) => {
            if (t.id !== taskId) return t;
            const attempts = t.attempts + 1;
            const nextDate = new Date();
            nextDate.setTime(nextDate.getTime() + backoffMs(attempts));
            const exhausted = attempts >= t.maxAttempts;
            return {
              ...t,
              attempts,
              lastError: error,
              status: exhausted ? 'failed' : 'pending',
              nextAttemptAt: nextDate.toISOString(),
              updatedAt: nowIso(),
            };
          }),
        }));
      },

      reset: (taskId) => {
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  status: 'pending',
                  attempts: 0,
                  lastError: undefined,
                  nextAttemptAt: nowIso(),
                  updatedAt: nowIso(),
                }
              : t,
          ),
        }));
      },

      clearDone: () => {
        set((state) => ({ tasks: state.tasks.filter((t) => t.status !== 'done') }));
      },

      clearAll: () => {
        set({ tasks: [] });
      },

      setWorkerRunning: (running) => {
        set({ workerRunning: running });
      },

      setLastRunAt: (iso) => {
        set({ lastRunAt: iso });
      },

      pendingCount: () =>
        get().tasks.filter((t) => t.status === 'pending' || t.status === 'in_flight')
          .length,

      failedCount: () =>
        get().tasks.filter((t) => t.status === 'failed').length,
    }),
    {
      name: 'ng-sync-queue',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

export function nextRunnableTasks(limit: number): SyncTask[] {
  const now = Date.now();
  return useSyncQueueStore
    .getState()
    .tasks.filter(
      (t) => t.status === 'pending' && new Date(t.nextAttemptAt).getTime() <= now,
    )
    .slice(0, limit);
}