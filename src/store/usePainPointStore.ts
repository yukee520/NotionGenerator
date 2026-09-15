import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ID } from '@/types/common';
import type {
  PainPoint,
  PainPointFilter,
  PainPointInput,
  PainPointStats,
} from '@/types/painPoint';
import { EMPTY_PAIN_POINT_FILTER } from '@/types/painPoint';
import { newId } from '@/utils/id';
import { nowIso } from '@/utils/date';

interface PainPointState {
  items: PainPoint[];
  filter: PainPointFilter;
  add: (input: PainPointInput) => PainPoint;
  update: (id: ID, patch: Partial<PainPointInput>) => void;
  remove: (id: ID) => void;
  archive: (id: ID) => void;
  restore: (id: ID) => void;
  markUsed: (id: ID) => void;
  linkIdea: (painPointId: ID, ideaId: ID) => void;
  unlinkIdea: (painPointId: ID, ideaId: ID) => void;
  setFilter: (patch: Partial<PainPointFilter>) => void;
  resetFilter: () => void;
  getById: (id: ID) => PainPoint | undefined;
  getManyByIds: (ids: ID[]) => PainPoint[];
  getFiltered: () => PainPoint[];
  stats: () => PainPointStats;
  markSynced: (id: ID, ok: boolean, error?: string) => void;
}

export const usePainPointStore = create<PainPointState>()(
  persist(
    (set, get) => ({
      items: [],
      filter: EMPTY_PAIN_POINT_FILTER,

      add: (input) => {
        const ts = nowIso();
        const record: PainPoint = {
          ...input,
          id: newId('pp'),
          createdAt: ts,
          updatedAt: ts,
          syncStatus: 'pending',
          linkedIdeaIds: [],
        };
        set((state) => ({ items: [record, ...state.items] }));
        return record;
      },

      update: (id, patch) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id
              ? { ...item, ...patch, updatedAt: nowIso(), syncStatus: 'pending' }
              : item,
          ),
        }));
      },

      remove: (id) => {
        set((state) => ({ items: state.items.filter((item) => item.id !== id) }));
      },

      archive: (id) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id
              ? { ...item, status: 'archived', updatedAt: nowIso(), syncStatus: 'pending' }
              : item,
          ),
        }));
      },

      restore: (id) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id
              ? { ...item, status: 'inbox', updatedAt: nowIso(), syncStatus: 'pending' }
              : item,
          ),
        }));
      },

      markUsed: (id) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id
              ? { ...item, status: 'used', updatedAt: nowIso(), syncStatus: 'pending' }
              : item,
          ),
        }));
      },

      linkIdea: (painPointId, ideaId) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === painPointId && !item.linkedIdeaIds.includes(ideaId)
              ? {
                  ...item,
                  linkedIdeaIds: [...item.linkedIdeaIds, ideaId],
                  status: 'used',
                  updatedAt: nowIso(),
                }
              : item,
          ),
        }));
      },

      unlinkIdea: (painPointId, ideaId) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === painPointId
              ? {
                  ...item,
                  linkedIdeaIds: item.linkedIdeaIds.filter((x) => x !== ideaId),
                  updatedAt: nowIso(),
                }
              : item,
          ),
        }));
      },

      setFilter: (patch) => {
        set((state) => ({ filter: { ...state.filter, ...patch } }));
      },

      resetFilter: () => {
        set({ filter: EMPTY_PAIN_POINT_FILTER });
      },

      getById: (id) => {
        return get().items.find((item) => item.id === id);
      },

      getManyByIds: (ids) => {
        const set0 = new Set(ids);
        return get().items.filter((item) => set0.has(item.id));
      },

      getFiltered: () => {
        const { items, filter } = get();
        const search = filter.search.trim().toLowerCase();
        return items.filter((item) => {
          if (filter.sources.length > 0 && !filter.sources.includes(item.source)) {
            return false;
          }
          if (
            filter.severities.length > 0 &&
            !filter.severities.includes(item.severity)
          ) {
            return false;
          }
          if (filter.statuses.length > 0 && !filter.statuses.includes(item.status)) {
            return false;
          }
          if (filter.topic && item.topic !== filter.topic) return false;
          if (search.length > 0) {
            const haystack = `${item.title} ${item.description} ${item.topic} ${item.audience}`.toLowerCase();
            if (!haystack.includes(search)) return false;
          }
          return true;
        });
      },

      stats: () => {
        const items = get().items;
        const bySeverity = { low: 0, medium: 0, high: 0, critical: 0 };
        const bySource = {
          reddit: 0,
          twitter: 0,
          youtube: 0,
          forum: 0,
          personal: 0,
          other: 0,
        };
        let inbox = 0;
        let used = 0;
        let archived = 0;
        let lastCreatedAt: string | undefined;
        for (const it of items) {
          bySeverity[it.severity] += 1;
          bySource[it.source] += 1;
          if (it.status === 'inbox') inbox += 1;
          else if (it.status === 'used') used += 1;
          else archived += 1;
          if (!lastCreatedAt || it.createdAt > lastCreatedAt) {
            lastCreatedAt = it.createdAt;
          }
        }
        return {
          total: items.length,
          inbox,
          used,
          archived,
          bySeverity,
          bySource,
          lastCreatedAt,
        };
      },

      markSynced: (id, ok, error) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id
              ? {
                  ...item,
                  syncStatus: ok ? 'synced' : 'failed',
                  syncError: ok ? undefined : error,
                  lastSyncedAt: ok ? nowIso() : item.lastSyncedAt,
                }
              : item,
          ),
        }));
      },
    }),
    {
      name: 'ng-pain-points',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);