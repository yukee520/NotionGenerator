import type { ID, ISODate, SyncMeta, Timestamped } from './common';

export type MarketingChannel =
  | 'youtube'
  | 'facebook'
  | 'pinterest'
  | 'tiktok'
  | 'rednote'
  | 'twitter'
  | 'instagram';

export type MarketingStatus = 'draft' | 'ready' | 'posted';

export interface MarketingContent extends Timestamped, SyncMeta {
  id: ID;
  templateId: ID;
  channel: MarketingChannel;
  title: string;
  body: string;
  hashtags: string[];
  callToAction: string;
  scriptOutline?: string[];
  mediaHint?: string;
  status: MarketingStatus;
  postedAt?: ISODate;
  postedUrl?: string;
  generatedBy: 'n8n' | 'local-heuristic';
}

export type MarketingContentMap = Partial<Record<MarketingChannel, MarketingContent>>;

export interface MarketingChannelMeta {
  channel: MarketingChannel;
  label: string;
  icon: string;
  tint: string;
  charLimit: number;
  hint: string;
}

export interface MarketingFilter {
  search: string;
  channels: MarketingChannel[];
  statuses: MarketingStatus[];
}

export const MARKETING_STATUS_LABELS: Record<MarketingStatus, string> = {
  draft: 'Draft',
  ready: 'Ready',
  posted: 'Posted',
};

export const EMPTY_MARKETING_FILTER: MarketingFilter = {
  search: '',
  channels: [],
  statuses: [],
};

export interface MarketingStats {
  total: number;
  draft: number;
  ready: number;
  posted: number;
  byChannel: Record<MarketingChannel, number>;
}