import { useCallback, useMemo } from 'react';
import type { ID } from '@/types/common';
import type {
  PainPoint,
  PainPointFilter,
  PainPointInput,
  PainPointStats,
} from '@/types/painPoint';
import { usePainPointStore } from '@/store/usePainPointStore';

export interface UsePainPointsResult {
  items: PainPoint[];
  filtered: PainPoint[];
  filter: PainPointFilter;
  stats: PainPointStats;
  loading: boolean;
  getById: (id: ID) => PainPoint | undefined;
  add: (input: PainPointInput) => PainPoint;
  update: (id: ID, patch: Partial<PainPointInput>) => void;
  remove: (id: ID) => void;
  archive: (id: ID) => void;
  restore: (id: ID) => void;
  markUsed: (id: ID) => void;
  setFilter: (patch: Partial<PainPointFilter>) => void;
  resetFilter: () => void;
}

export function usePainPoints(): UsePainPointsResult {
  const items = usePainPointStore((s) => s.items);
  const filter = usePainPointStore((s) => s.filter);
  const add = usePainPointStore((s) => s.add);
  const update = usePainPointStore((s) => s.update);
  const remove = usePainPointStore((s) => s.remove);
  const archive = usePainPointStore((s) => s.archive);
  const restore = usePainPointStore((s) => s.restore);
  const markUsed = usePainPointStore((s) => s.markUsed);
  const setFilterAction = usePainPointStore((s) => s.setFilter);
  const resetFilter = usePainPointStore((s) => s.resetFilter);
  const getById = usePainPointStore((s) => s.getById);
  const getFiltered = usePainPointStore((s) => s.getFiltered);
  const stats = usePainPointStore((s) => s.stats);

  const filtered = useMemo(() => {
    return getFiltered();
  }, [items, filter, getFiltered]);

  const computedStats = useMemo(() => stats(), [items, stats]);

  const setFilter = useCallback(
    (patch: Partial<PainPointFilter>) => {
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
    add,
    update,
    remove,
    archive,
    restore,
    markUsed,
    setFilter,
    resetFilter,
  };
}