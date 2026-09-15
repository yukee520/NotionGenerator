import type { ID, ISODate, SyncMeta, Timestamped } from './common';

export type IdeaStatus = 'draft' | 'approved' | 'rejected';

export interface IdeaSection {
  id: ID;
  title: string;
  description: string;
}

export interface Idea extends Timestamped, SyncMeta {
  id: ID;
  title: string;
  oneLiner: string;
  problem: string;
  audience: string;
  monetizationAngle: string;
  proposedSections: IdeaSection[];
  painPointIds: ID[];
  status: IdeaStatus;
  rejectionReason?: string;
  approvedAt?: ISODate;
  generatedBy: 'n8n' | 'local-heuristic';
  templateId?: ID;
}

export type IdeaInput = Omit<
  Idea,
  | 'id'
  | 'createdAt'
  | 'updatedAt'
  | 'syncStatus'
  | 'syncError'
  | 'lastSyncedAt'
  | 'status'
  | 'rejectionReason'
  | 'approvedAt'
  | 'templateId'
>;

export interface IdeaFilter {
  search: string;
  statuses: IdeaStatus[];
}

export const IDEA_STATUS_LABELS: Record<IdeaStatus, string> = {
  draft: 'Draft',
  approved: 'Approved',
  rejected: 'Rejected',
};

export const EMPTY_IDEA_FILTER: IdeaFilter = {
  search: '',
  statuses: [],
};

export interface IdeaStats {
  total: number;
  draft: number;
  approved: number;
  rejected: number;
  lastCreatedAt?: ISODate;
}