import type { ID, ISODate, SyncMeta, Timestamped } from './common';

export type PainPointSource =
  | 'reddit'
  | 'twitter'
  | 'youtube'
  | 'forum'
  | 'personal'
  | 'other';

export type PainPointSeverity = 'low' | 'medium' | 'high' | 'critical';

export type PainPointStatus = 'inbox' | 'used' | 'archived';

export interface PainPoint extends Timestamped, SyncMeta {
  id: ID;
  title: string;
  description: string;
  source: PainPointSource;
  sourceUrl?: string;
  topic: string;
  audience: string;
  severity: PainPointSeverity;
  status: PainPointStatus;
  tags: string[];
  linkedIdeaIds: ID[];
}

export type PainPointInput = Omit<
  PainPoint,
  'id' | 'createdAt' | 'updatedAt' | 'syncStatus' | 'syncError' | 'lastSyncedAt' | 'linkedIdeaIds'
>;

export interface PainPointFilter {
  search: string;
  sources: PainPointSource[];
  severities: PainPointSeverity[];
  statuses: PainPointStatus[];
  topic?: string;
}

export const PAIN_POINT_SOURCE_LABELS: Record<PainPointSource, string> = {
  reddit: 'Reddit',
  twitter: 'X / Twitter',
  youtube: 'YouTube',
  forum: 'Forum / Community',
  personal: 'Personal Experience',
  other: 'Other',
};

export const PAIN_POINT_SEVERITY_LABELS: Record<PainPointSeverity, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};

export const PAIN_POINT_STATUS_LABELS: Record<PainPointStatus, string> = {
  inbox: 'Inbox',
  used: 'Used',
  archived: 'Archived',
};

export const EMPTY_PAIN_POINT_FILTER: PainPointFilter = {
  search: '',
  sources: [],
  severities: [],
  statuses: [],
};

export interface PainPointStats {
  total: number;
  inbox: number;
  used: number;
  archived: number;
  bySeverity: Record<PainPointSeverity, number>;
  bySource: Record<PainPointSource, number>;
  lastCreatedAt?: ISODate;
}