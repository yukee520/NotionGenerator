import { useCallback, useMemo } from 'react';
import type { ID } from '@/types/common';
import type { Idea, IdeaFilter, IdeaInput, IdeaStats } from '@/types/idea';
import { useIdeaStore } from '@/store/useIdeaStore';

export interface UseIdeasResult {
  items: Idea[];
  filtered: Idea[];
  filter: IdeaFilter;
  stats: IdeaStats;
  loading: boolean;
  getById: (id: ID) => Idea | undefined;
  getByPainPoint: (painPointId: ID) => Idea[];
  add: (
    input: IdeaInput & { painPointIds: ID[] },
    generatedBy?: Idea['generatedBy'],
  ) => Idea;
  update: (id: ID, patch: Partial<IdeaInput>) => void;
  remove: (id: ID) => void;
  approve: (id: ID) => void;
  reject: (id: ID, reason?: string) => void;
  reopen: (id: ID) => void;
  setFilter: (patch: Partial<IdeaFilter>) => void;
  resetFilter: () => void;
}

export function useIdeas(): UseIdeasResult {
  const items = useIdeaStore((s) => s.items);
  const filter = useIdeaStore((s) => s.filter);
  const add = useIdeaStore((s) => s.add);
  const update = useIdeaStore((s) => s.update);
  const remove = useIdeaStore((s) => s.remove);
  const approve = useIdeaStore((s) => s.approve);
  const reject = useIdeaStore((s) => s.reject);
  const reopen = useIdeaStore((s) => s.reopen);
  const setFilterAction = useIdeaStore((s) => s.setFilter);
  const resetFilter = useIdeaStore((s) => s.resetFilter);
  const getById = useIdeaStore((s) => s.getById);
  const getByPainPoint = useIdeaStore((s) => s.getByPainPoint);
  const getFiltered = useIdeaStore((s) => s.getFiltered);
  const stats = useIdeaStore((s) => s.stats);

  const filtered = useMemo(() => {
    return getFiltered();
  }, [items, filter, getFiltered]);

  const computedStats = useMemo(() => stats(), [items, stats]);

  const setFilter = useCallback(
    (patch: Partial<IdeaFilter>) => {
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
    getByPainPoint,
    add,
    update,
    remove,
    approve,
    reject,
    reopen,
    setFilter,
    resetFilter,
  };
}