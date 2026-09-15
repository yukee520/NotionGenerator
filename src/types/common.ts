export type ID = string;

export type ISODate = string;

export type Nullable<T> = T | null;

export type SyncStatus = 'pending' | 'synced' | 'failed';

export interface SyncMeta {
  syncStatus: SyncStatus;
  syncError?: string;
  lastSyncedAt?: ISODate;
}

export interface Timestamped {
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface Result<T, E = string> {
  ok: boolean;
  data?: T;
  error?: E;
}

export type ThemeMode = 'light' | 'dark' | 'system';

export interface SelectOption<T = string> {
  label: string;
  value: T;
  description?: string;
}

export type SortDirection = 'asc' | 'desc';

export interface Paginated<T> {
  items: T[];
  total: number;
  hasMore: boolean;
}