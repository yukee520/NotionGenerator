import { useCallback, useMemo } from 'react';
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
import { useTemplateStore, CreateTemplateInput } from '@/store/useTemplateStore';

export interface UseTemplatesResult {
  items: Template[];
  filtered: Template[];
  filter: TemplateFilter;
  stats: TemplateStats;
  loading: boolean;
  getById: (id: ID) => Template | undefined;
  getByIdeaId: (ideaId: ID) => Template | undefined;
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
}

export function useTemplates(): UseTemplatesResult {
  const items = useTemplateStore((s) => s.items);
  const filter = useTemplateStore((s) => s.filter);
  const create = useTemplateStore((s) => s.create);
  const update = useTemplateStore((s) => s.update);
  const remove = useTemplateStore((s) => s.remove);
  const setStage = useTemplateStore((s) => s.setStage);
  const setJobId = useTemplateStore((s) => s.setJobId);
  const setBuildSheet = useTemplateStore((s) => s.setBuildSheet);
  const setNotionUrl = useTemplateStore((s) => s.setNotionUrl);
  const setQaItems = useTemplateStore((s) => s.setQaItems);
  const updateQaItem = useTemplateStore((s) => s.updateQaItem);
  const setQaNotes = useTemplateStore((s) => s.setQaNotes);
  const approveTesting = useTemplateStore((s) => s.approveTesting);
  const sendBack = useTemplateStore((s) => s.sendBack);
  const setGuide = useTemplateStore((s) => s.setGuide);
  const setPricing = useTemplateStore((s) => s.setPricing);
  const overridePrice = useTemplateStore((s) => s.overridePrice);
  const setListing = useTemplateStore((s) => s.setListing);
  const markListed = useTemplateStore((s) => s.markListed);
  const markPublished = useTemplateStore((s) => s.markPublished);
  const setFilterAction = useTemplateStore((s) => s.setFilter);
  const resetFilter = useTemplateStore((s) => s.resetFilter);
  const getById = useTemplateStore((s) => s.getById);
  const getByIdeaId = useTemplateStore((s) => s.getByIdeaId);
  const getFiltered = useTemplateStore((s) => s.getFiltered);
  const stats = useTemplateStore((s) => s.stats);

  const filtered = useMemo(() => {
    return getFiltered();
  }, [items, filter, getFiltered]);

  const computedStats = useMemo(() => stats(), [items, stats]);

  const setFilter = useCallback(
    (patch: Partial<TemplateFilter>) => {
      setFilterAction(patch);
    },
    [setFilterAction],
  );

  return {
    items,
    filtered,
    filter,
    stats: computedStats,
    loading: false,
    getById,
    getByIdeaId,
    create,
    update,
    remove,
    setStage,
    setJobId,
    setBuildSheet,
    setNotionUrl,
    setQaItems,
    updateQaItem,
    setQaNotes,
    approveTesting,
    sendBack,
    setGuide,
    setPricing,
    overridePrice,
    setListing,
    markListed,
    markPublished,
    setFilter,
    resetFilter,
  };
}