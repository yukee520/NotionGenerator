import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ID } from '@/types/common';
import type {
  MarketingChannel,
  MarketingContent,
  MarketingContentMap,
  MarketingFilter,
  MarketingStats,
  MarketingStatus,
} from '@/types/marketing';
import { EMPTY_MARKETING_FILTER } from '@/types/marketing';
import { newId } from '@/utils/id';
import { nowIso } from '@/utils/date';

export interface UpsertMarketingInput {
  templateId: ID;
  channel: MarketingChannel;
  title: string;
  body: string;
  hashtags?: string[];
  callToAction?: string;
  scriptOutline?: string[];
  mediaHint?: string;
  generatedBy?: MarketingContent['generatedBy'];
}

interface MarketingState {
  items: MarketingContent[];
  filter: MarketingFilter;
  upsert: (input: UpsertMarketingInput) => MarketingContent;
  upsertMany: (inputs: UpsertMarketingInput[]) => MarketingContent[];
  update: (id: ID, patch: Partial<MarketingContent>) => void;
  remove: (id: ID) => void;
  setStatus: (id: ID, status: MarketingStatus) => void;
  markPosted: (id: ID, url?: string) => void;
  resetToDraft: (id: ID) => void;
  getByTemplate: (templateId: ID) => MarketingContentMap;
  getByTemplateAndChannel: (
    templateId: ID,
    channel: MarketingChannel,
  ) => MarketingContent | undefined;
  setFilter: (patch: Partial<MarketingFilter>) => void;
  resetFilter: () => void;
  getFiltered: () => MarketingContent[];
  stats: (templateId?: ID) => MarketingStats;
  markSynced: (id: ID, ok: boolean, error?: string) => void;
}

export const useMarketingStore = create<MarketingState>()(
  persist(
    (set, get) => ({
      items: [],
      filter: EMPTY_MARKETING_FILTER,

      upsert: (input) => {
        const existing = get().items.find(
          (m) => m.templateId === input.templateId && m.channel === input.channel,
        );
        const ts = nowIso();
        if (existing) {
          const updated: MarketingContent = {
            ...existing,
            title: input.title,
            body: input.body,
            hashtags: input.hashtags ?? existing.hashtags,
            callToAction: input.callToAction ?? existing.callToAction,
            scriptOutline: input.scriptOutline ?? existing.scriptOutline,
            mediaHint: input.mediaHint ?? existing.mediaHint,
            generatedBy: input.generatedBy ?? existing.generatedBy,
            updatedAt: ts,
            syncStatus: 'pending',
          };
          set((state) => ({
            items: state.items.map((m) => (m.id === existing.id ? updated : m)),
          }));
          return updated;
        }
        const created: MarketingContent = {
          id: newId('mkt'),
          templateId: input.templateId,
          channel: input.channel,
          title: input.title,
          body: input.body,
          hashtags: input.hashtags ?? [],
          callToAction: input.callToAction ?? '',
          scriptOutline: input.scriptOutline,
          mediaHint: input.mediaHint,
          status: 'draft',
          generatedBy: input.generatedBy ?? 'local-heuristic',
          createdAt: ts,
          updatedAt: ts,
          syncStatus: 'pending',
        };
        set((state) => ({ items: [created, ...state.items] }));
        return created;
      },

      upsertMany: (inputs) => {
        return inputs.map((input) => get().upsert(input));
      },

      update: (id, patch) => {
        set((state) => ({
          items: state.items.map((m) =>
            m.id === id
              ? { ...m, ...patch, updatedAt: nowIso(), syncStatus: 'pending' }
              : m,
          ),
        }));
      },

      remove: (id) => {
        set((state) => ({ items: state.items.filter((m) => m.id !== id) }));
      },

      setStatus: (id, status) => {
        set((state) => ({
          items: state.items.map((m) =>
            m.id === id
              ? { ...m, status, updatedAt: nowIso(), syncStatus: 'pending' }
              : m,
          ),
        }));
      },

      markPosted: (id, url) => {
        set((state) => ({
          items: state.items.map((m) =>
            m.id === id
              ? {
                  ...m,
                  status: 'posted',
                  postedAt: nowIso(),
                  postedUrl: url ?? m.postedUrl,
                  updatedAt: nowIso(),
                  syncStatus: 'pending',
                }
              : m,
          ),
        }));
      },

      resetToDraft: (id) => {
        set((state) => ({
          items: state.items.map((m) =>
            m.id === id
              ? { ...m, status: 'draft', updatedAt: nowIso(), syncStatus: 'pending' }
              : m,
          ),
        }));
      },

      getByTemplate: (templateId) => {
        const map: MarketingContentMap = {};
        for (const m of get().items) {
          if (m.templateId === templateId) map[m.channel] = m;
        }
        return map;
      },

      getByTemplateAndChannel: (templateId, channel) =>
        get().items.find((m) => m.templateId === templateId && m.channel === channel),

      setFilter: (patch) => {
        set((state) => ({ filter: { ...state.filter, ...patch } }));
      },

      resetFilter: () => {
        set({ filter: EMPTY_MARKETING_FILTER });
      },

      getFiltered: () => {
        const { items, filter } = get();
        const search = filter.search.trim().toLowerCase();
        return items.filter((m) => {
          if (filter.channels.length > 0 && !filter.channels.includes(m.channel)) {
            return false;
          }
          if (filter.statuses.length > 0 && !filter.statuses.includes(m.status)) {
            return false;
          }
          if (search.length > 0) {
            const haystack = `${m.title} ${m.body} ${m.hashtags.join(' ')}`.toLowerCase();
            if (!haystack.includes(search)) return false;
          }
          return true;
        });
      },

      stats: (templateId) => {
        const items = templateId
          ? get().items.filter((m) => m.templateId === templateId)
          : get().items;
        const byChannel: Record<MarketingChannel, number> = {
          youtube: 0,
          facebook: 0,
          pinterest: 0,
          tiktok: 0,
          rednote: 0,
          twitter: 0,
          instagram: 0,
        };
        let draft = 0;
        let ready = 0;
        let posted = 0;
        for (const m of items) {
          byChannel[m.channel] += 1;
          if (m.status === 'draft') draft += 1;
          else if (m.status === 'ready') ready += 1;
          else posted += 1;
        }
        return { total: items.length, draft, ready, posted, byChannel };
      },

      markSynced: (id, ok, error) => {
        set((state) => ({
          items: state.items.map((m) =>
            m.id === id
              ? {
                  ...m,
                  syncStatus: ok ? 'synced' : 'failed',
                  syncError: ok ? undefined : error,
                  lastSyncedAt: ok ? nowIso() : m.lastSyncedAt,
                }
              : m,
          ),
        }));
      },
    }),
    {
      name: 'ng-marketing',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);