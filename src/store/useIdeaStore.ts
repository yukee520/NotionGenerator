import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ID } from '@/types/common';
import type { Idea, IdeaFilter, IdeaInput, IdeaStats } from '@/types/idea';
import { EMPTY_IDEA_FILTER } from '@/types/idea';
import { newId } from '@/utils/id';
import { nowIso } from '@/utils/date';

interface IdeaState {
  items: Idea[];
  filter: IdeaFilter;
  add: (input: IdeaInput & { painPointIds: ID[] }, generatedBy?: Idea['generatedBy']) => Idea;
  addMany: (
    inputs: (IdeaInput & { painPointIds: ID[] })[],
    generatedBy?: Idea['generatedBy'],
  ) => Idea[];
  update: (id: ID, patch: Partial<IdeaInput>) => void;
  remove: (id: ID) => void;
  approve: (id: ID) => void;
  reject: (id: ID, reason?: string) => void;
  reopen: (id: ID) => void;
  setTemplateId: (id: ID, templateId: ID) => void;
  setFilter: (patch: Partial<IdeaFilter>) => void;
  resetFilter: () => void;
  getById: (id: ID) => Idea | undefined;
  getByPainPoint: (painPointId: ID) => Idea[];
  getFiltered: () => Idea[];
  stats: () => IdeaStats;
  markSynced: (id: ID, ok: boolean, error?: string) => void;
}

export const useIdeaStore = create<IdeaState>()(
  persist(
    (set, get) => ({
      items: [],
      filter: EMPTY_IDEA_FILTER,

      add: (input, generatedBy = 'local-heuristic') => {
        const ts = nowIso();
        const record: Idea = {
          ...input,
          id: newId('idea'),
          createdAt: ts,
          updatedAt: ts,
          syncStatus: 'pending',
          status: 'draft',
          generatedBy,
        };
        set((state) => ({ items: [record, ...state.items] }));
        return record;
      },

      addMany: (inputs, generatedBy = 'local-heuristic') => {
        const ts = nowIso();
        const records: Idea[] = inputs.map((input) => ({
          ...input,
          id: newId('idea'),
          createdAt: ts,
          updatedAt: ts,
          syncStatus: 'pending',
          status: 'draft',
          generatedBy,
        }));
        set((state) => ({ items: [...records, ...state.items] }));
        return records;
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

      approve: (id) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id
              ? {
                  ...item,
                  status: 'approved',
                  approvedAt: nowIso(),
                  rejectionReason: undefined,
                  updatedAt: nowIso(),
                  syncStatus: 'pending',
                }
              : item,
          ),
        }));
      },

      reject: (id, reason) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id
              ? {
                  ...item,
                  status: 'rejected',
                  rejectionReason: reason,
                  updatedAt: nowIso(),
                  syncStatus: 'pending',
                }
              : item,
          ),
        }));
      },

      reopen: (id) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id
              ? {
                  ...item,
                  status: 'draft',
                  rejectionReason: undefined,
                  approvedAt: undefined,
                  updatedAt: nowIso(),
                  syncStatus: 'pending',
                }
              : item,
          ),
        }));
      },

      setTemplateId: (id, templateId) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id
              ? { ...item, templateId, updatedAt: nowIso() }
              : item,
          ),
        }));
      },

      setFilter: (patch) => {
        set((state) => ({ filter: { ...state.filter, ...patch } }));
      },

      resetFilter: () => {
        set({ filter: EMPTY_IDEA_FILTER });
      },

      getById: (id) => get().items.find((item) => item.id === id),

      getByPainPoint: (painPointId) =>
        get().items.filter((item) => item.painPointIds.includes(painPointId)),

      getFiltered: () => {
        const { items, filter } = get();
        const search = filter.search.trim().toLowerCase();
        return items.filter((item) => {
          if (filter.statuses.length > 0 && !filter.statuses.includes(item.status)) {
            return false;
          }
          if (search.length > 0) {
            const haystack = `${item.title} ${item.oneLiner} ${item.problem} ${item.audience}`.toLowerCase();
            if (!haystack.includes(search)) return false;
          }
          return true;
        });
      },

      stats: () => {
        const items = get().items;
        let draft = 0;
        let approved = 0;
        let rejected = 0;
        let lastCreatedAt: string | undefined;
        for (const it of items) {
          if (it.status === 'draft') draft += 1;
          else if (it.status === 'approved') approved += 1;
          else rejected += 1;
          if (!lastCreatedAt || it.createdAt > lastCreatedAt) {
            lastCreatedAt = it.createdAt;
          }
        }
        return { total: items.length, draft, approved, rejected, lastCreatedAt };
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
      name: 'ng-ideas',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);