import { useCallback, useMemo } from 'react';
import type { ID } from '@/types/common';
import type {
  MarketingChannel,
  MarketingContent,
  MarketingContentMap,
  MarketingFilter,
  MarketingStats,
  MarketingStatus,
} from '@/types/marketing';
import {
  useMarketingStore,
  UpsertMarketingInput,
} from '@/store/useMarketingStore';

export interface UseMarketingResult {
  items: MarketingContent[];
  filtered: MarketingContent[];
  filter: MarketingFilter;
  loading: boolean;
  getByTemplate: (templateId: ID) => MarketingContentMap;
  getByTemplateAndChannel: (
    templateId: ID,
    channel: MarketingChannel,
  ) => MarketingContent | undefined;
  upsert: (input: UpsertMarketingInput) => MarketingContent;
  upsertMany: (inputs: UpsertMarketingInput[]) => MarketingContent[];
  update: (id: ID, patch: Partial<MarketingContent>) => void;
  remove: (id: ID) => void;
  setStatus: (id: ID, status: MarketingStatus) => void;
  markPosted: (id: ID, url?: string) => void;
  resetToDraft: (id: ID) => void;
  setFilter: (patch: Partial<MarketingFilter>) => void;
  resetFilter: () => void;
  stats: (templateId?: ID) => MarketingStats;
}

export function useMarketing(): UseMarketingResult {
  const items = useMarketingStore((s) => s.items);
  const filter = useMarketingStore((s) => s.filter);
  const upsert = useMarketingStore((s) => s.upsert);
  const upsertMany = useMarketingStore((s) => s.upsertMany);
  const update = useMarketingStore((s) => s.update);
  const remove = useMarketingStore((s) => s.remove);
  const setStatus = useMarketingStore((s) => s.setStatus);
  const markPosted = useMarketingStore((s) => s.markPosted);
  const resetToDraft = useMarketingStore((s) => s.resetToDraft);
  const setFilterAction = useMarketingStore((s) => s.setFilter);
  const resetFilter = useMarketingStore((s) => s.resetFilter);
  const getByTemplate = useMarketingStore((s) => s.getByTemplate);
  const getByTemplateAndChannel = useMarketingStore((s) => s.getByTemplateAndChannel);
  const getFiltered = useMarketingStore((s) => s.getFiltered);
  const stats = useMarketingStore((s) => s.stats);

  const filtered = useMemo(() => {
    return getFiltered();
  }, [items, filter, getFiltered]);

  const setFilter = useCallback(
    (patch: Partial<MarketingFilter>) => {
      setFilterAction(patch);
    },
    [setFilterAction],
  );

  return {
    items,
    filtered,
    filter,
    loading: false,
    getByTemplate,
    getByTemplateAndChannel,
    upsert,
    upsertMany,
    update,
    remove,
    setStatus,
    markPosted,
    resetToDraft,
    setFilter,
    resetFilter,
    stats,
  };
}