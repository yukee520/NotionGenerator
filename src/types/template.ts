import type { ID, ISODate, SyncMeta, Timestamped } from './common';

export type TemplateStage =
  | 'idea_approved'
  | 'building'
  | 'built_pending_test'
  | 'tested_approved'
  | 'guide_ready'
  | 'listed'
  | 'published';

export interface BuildSheetSection {
  id: ID;
  title: string;
  type: 'page' | 'database' | 'view' | 'callout' | 'toggle' | 'heading' | 'paragraph';
  description: string;
  properties?: string[];
  sampleRows?: string[];
  formulas?: string[];
  relations?: string[];
  rollups?: string[];
  children?: BuildSheetSection[];
}

export interface BuildSheet {
  id: ID;
  sections: BuildSheetSection[];
  totalDatabases: number;
  totalViews: number;
  totalFormulas: number;
  estimatedBuildMinutes: number;
  generatedAt: ISODate;
}

export type QAItemStatus = 'unchecked' | 'pass' | 'fail' | 'na';

export interface QAItem {
  id: ID;
  label: string;
  description?: string;
  required: boolean;
  status: QAItemStatus;
  notes?: string;
}

export interface Pricing {
  suggested: number;
  currency: string;
  rationale: string;
  complexityScore: number;
  manualOverride?: number;
  computedAt: ISODate;
}

export interface ListingCopy {
  title: string;
  tagline: string;
  bulletFeatures: string[];
  targetBuyer: string;
  callToAction: string;
  generatedAt: ISODate;
}

export interface Template extends Timestamped, SyncMeta {
  id: ID;
  ideaId: ID;
  title: string;
  oneLiner: string;
  audience: string;
  stage: TemplateStage;
  notionUrl?: string;
  n8nJobId?: string;
  buildSheet?: BuildSheet;
  qaItems: QAItem[];
  qaNotes?: string;
  testedApprovedAt?: ISODate;
  sendBackReason?: string;
  guide?: string;
  guideGeneratedAt?: ISODate;
  pricing?: Pricing;
  listing?: ListingCopy;
  publishedAt?: ISODate;
  publishedUrl?: string;
  marketplace: 'notion' | 'gumroad' | 'other';
}

export interface TemplateFilter {
  search: string;
  stages: TemplateStage[];
}

export const TEMPLATE_STAGE_LABELS: Record<TemplateStage, string> = {
  idea_approved: 'Idea Approved',
  building: 'Building',
  built_pending_test: 'Pending Test',
  tested_approved: 'Tested & Approved',
  guide_ready: 'Guide Ready',
  listed: 'Listed',
  published: 'Published',
};

export const TEMPLATE_STAGE_ORDER: TemplateStage[] = [
  'idea_approved',
  'building',
  'built_pending_test',
  'tested_approved',
  'guide_ready',
  'listed',
  'published',
];

export const DEFAULT_QA_ITEMS: Omit<QAItem, 'id' | 'status'>[] = [
  { label: 'Template opens without errors', required: true },
  { label: 'Duplicate link works and creates a copy', required: true },
  { label: 'All sample data is present', required: true },
  { label: 'All databases have correct properties', required: true },
  { label: 'All views render correctly', required: true },
  { label: 'All formulas compute without errors', required: true },
  { label: 'All relations link correctly', required: true },
  { label: 'Works on Notion mobile app', required: true },
  { label: 'Works on Notion desktop app', required: false },
  { label: 'No broken embeds or images', required: false },
  { label: 'Instructions page present', required: true },
];

export const EMPTY_TEMPLATE_FILTER: TemplateFilter = {
  search: '',
  stages: [],
};

export interface TemplateStats {
  total: number;
  byStage: Record<TemplateStage, number>;
  lastUpdatedAt?: ISODate;
}