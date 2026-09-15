import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ID } from '@/types/common';
import type {
  BuildSheet,
  ListingCopy,
  Pricing,
  QAItem,
  Template,
  TemplateFilter,
  TemplateStage,
  TemplateStats,
} from '@/types/template';
import {
  DEFAULT_QA_ITEMS,
  EMPTY_TEMPLATE_FILTER,
  TEMPLATE_STAGE_ORDER,
} from '@/types/template';
import { newId } from '@/utils/id';
import { nowIso } from '@/utils/date';

export interface CreateTemplateInput {
  ideaId: ID;
  title: string;
  oneLiner: string;
  audience: string;
  marketplace?: Template['marketplace'];
}

interface TemplateState {
  items: Template[];
  filter: TemplateFilter;
  create: (input: CreateTemplateInput) => Template;
  update: (id: ID, patch: Partial<Template>) => void;
  remove: (id: ID) => void;
  setStage: (id: ID, stage: TemplateStage) => void;
  setJobId: (id: ID, jobId: string) => void;
  setBuildSheet: (id: ID, sheet: BuildSheet) => void;
  setNotionUrl: (id: ID, url: string) => void;
  setQaItems: (id: ID, items: QAItem[]) => void;
  updateQaItem: (templateId: ID, qaId: ID, patch: Partial<QAItem>) => void;
  setQaNotes: (id: ID, notes: string) => void;
  approveTesting: (id: ID) => void;
  sendBack: (id: ID, reason: string) => void;
  setGuide: (id: ID, guide: string) => void;
  setPricing: (id: ID, pricing: Pricing) => void;
  overridePrice: (id: ID, value: number | undefined) => void;
  setListing: (id: ID, listing: ListingCopy) => void;
  markListed: (id: ID) => void;
  markPublished: (id: ID, url?: string) => void;
  setFilter: (patch: Partial<TemplateFilter>) => void;
  resetFilter: () => void;
  getById: (id: ID) => Template | undefined;
  getByIdeaId: (ideaId: ID) => Template | undefined;
  getFiltered: () => Template[];
  stats: () => TemplateStats;
  markSynced: (id: ID, ok: boolean, error?: string) => void;
}

function buildDefaultQa(): QAItem[] {
  return DEFAULT_QA_ITEMS.map((item) => ({
    ...item,
    id: newId('qa'),
    status: 'unchecked',
  }));
}

export const useTemplateStore = create<TemplateState>()(
  persist(
    (set, get) => ({
      items: [],
      filter: EMPTY_TEMPLATE_FILTER,

      create: (input) => {
        const ts = nowIso();
        const record: Template = {
          id: newId('tpl'),
          ideaId: input.ideaId,
          title: input.title,
          oneLiner: input.oneLiner,
          audience: input.audience,
          stage: 'idea_approved',
          qaItems: buildDefaultQa(),
          marketplace: input.marketplace ?? 'notion',
          createdAt: ts,
          updatedAt: ts,
          syncStatus: 'pending',
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

      setStage: (id, stage) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id
              ? { ...item, stage, updatedAt: nowIso(), syncStatus: 'pending' }
              : item,
          ),
        }));
      },

      setJobId: (id, jobId) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id
              ? {
                  ...item,
                  n8nJobId: jobId,
                  stage: 'building',
                  updatedAt: nowIso(),
                }
              : item,
          ),
        }));
      },

      setBuildSheet: (id, sheet) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id
              ? {
                  ...item,
                  buildSheet: sheet,
                  stage: 'built_pending_test',
                  updatedAt: nowIso(),
                }
              : item,
          ),
        }));
      },

      setNotionUrl: (id, url) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id
              ? { ...item, notionUrl: url, updatedAt: nowIso() }
              : item,
          ),
        }));
      },

      setQaItems: (id, items) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id
              ? { ...item, qaItems: items, updatedAt: nowIso() }
              : item,
          ),
        }));
      },

      updateQaItem: (templateId, qaId, patch) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === templateId
              ? {
                  ...item,
                  qaItems: item.qaItems.map((qa) =>
                    qa.id === qaId ? { ...qa, ...patch } : qa,
                  ),
                  updatedAt: nowIso(),
                }
              : item,
          ),
        }));
      },

      setQaNotes: (id, notes) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id
              ? { ...item, qaNotes: notes, updatedAt: nowIso() }
              : item,
          ),
        }));
      },

      approveTesting: (id) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id
              ? {
                  ...item,
                  stage: 'tested_approved',
                  testedApprovedAt: nowIso(),
                  sendBackReason: undefined,
                  updatedAt: nowIso(),
                  syncStatus: 'pending',
                }
              : item,
          ),
        }));
      },

      sendBack: (id, reason) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id
              ? {
                  ...item,
                  stage: 'building',
                  sendBackReason: reason,
                  testedApprovedAt: undefined,
                  updatedAt: nowIso(),
                  syncStatus: 'pending',
                }
              : item,
          ),
        }));
      },

      setGuide: (id, guide) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id
              ? {
                  ...item,
                  guide,
                  guideGeneratedAt: nowIso(),
                  stage: item.stage === 'tested_approved' ? 'guide_ready' : item.stage,
                  updatedAt: nowIso(),
                }
              : item,
          ),
        }));
      },

      setPricing: (id, pricing) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, pricing, updatedAt: nowIso() } : item,
          ),
        }));
      },

      overridePrice: (id, value) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id && item.pricing
              ? {
                  ...item,
                  pricing: { ...item.pricing, manualOverride: value },
                  updatedAt: nowIso(),
                }
              : item,
          ),
        }));
      },

      setListing: (id, listing) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id
              ? {
                  ...item,
                  listing,
                  stage: item.stage === 'guide_ready' ? 'listed' : item.stage,
                  updatedAt: nowIso(),
                }
              : item,
          ),
        }));
      },

      markListed: (id) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id
              ? { ...item, stage: 'listed', updatedAt: nowIso(), syncStatus: 'pending' }
              : item,
          ),
        }));
      },

      markPublished: (id, url) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id
              ? {
                  ...item,
                  stage: 'published',
                  publishedAt: nowIso(),
                  publishedUrl: url ?? item.publishedUrl,
                  updatedAt: nowIso(),
                  syncStatus: 'pending',
                }
              : item,
          ),
        }));
      },

      setFilter: (patch) => {
        set((state) => ({ filter: { ...state.filter, ...patch } }));
      },

      resetFilter: () => {
        set({ filter: EMPTY_TEMPLATE_FILTER });
      },

      getById: (id) => get().items.find((item) => item.id === id),

      getByIdeaId: (ideaId) => get().items.find((item) => item.ideaId === ideaId),

      getFiltered: () => {
        const { items, filter } = get();
        const search = filter.search.trim().toLowerCase();
        return items.filter((item) => {
          if (filter.stages.length > 0 && !filter.stages.includes(item.stage)) {
            return false;
          }
          if (search.length > 0) {
            const haystack = `${item.title} ${item.oneLiner} ${item.audience}`.toLowerCase();
            if (!haystack.includes(search)) return false;
          }
          return true;
        });
      },

      stats: () => {
        const items = get().items;
        const byStage: Record<TemplateStage, number> = {
          idea_approved: 0,
          building: 0,
          built_pending_test: 0,
          tested_approved: 0,
          guide_ready: 0,
          listed: 0,
          published: 0,
        };
        let lastUpdatedAt: string | undefined;
        for (const it of items) {
          byStage[it.stage] += 1;
          if (!lastUpdatedAt || it.updatedAt > lastUpdatedAt) {
            lastUpdatedAt = it.updatedAt;
          }
        }
        return { total: items.length, byStage, lastUpdatedAt };
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
      name: 'ng-templates',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

export const TEMPLATE_STAGES = TEMPLATE_STAGE_ORDER;