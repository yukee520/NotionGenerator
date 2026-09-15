import type { ID, ISODate } from './common';
import type { PainPoint } from './painPoint';
import type { IdeaSection } from './idea';
import type { BuildSheetSection, ListingCopy, Pricing, QAItem } from './template';
import type { MarketingChannel } from './marketing';

export interface N8nErrorResponse {
  success: false;
  error: string;
  code?: string;
}

export interface N8nSuccessResponse<T> {
  success: true;
  data: T;
  receivedAt: ISODate;
}

export type N8nResponse<T> = N8nSuccessResponse<T> | N8nErrorResponse;

export interface GenerateIdeasRequest {
  painPoints: Pick<PainPoint, 'id' | 'title' | 'description' | 'topic' | 'audience' | 'severity' | 'source'>[];
  tone?: 'professional' | 'casual' | 'playful';
  count?: number;
}

export interface GenerateIdeasResponse {
  ideas: {
    title: string;
    oneLiner: string;
    problem: string;
    audience: string;
    monetizationAngle: string;
    proposedSections: Omit<IdeaSection, 'id'>[];
  }[];
}

export interface BuildTemplateRequest {
  ideaId: ID;
  title: string;
  oneLiner: string;
  problem: string;
  audience: string;
  proposedSections: Omit<IdeaSection, 'id'>[];
  workspaceId?: string;
}

export interface BuildTemplateResponse {
  jobId: string;
  status: 'queued' | 'running';
}

export type BuildStatus = 'queued' | 'running' | 'completed' | 'failed';

export interface BuildStatusResponse {
  jobId: string;
  status: BuildStatus;
  progress: number;
  message?: string;
  notionUrl?: string;
  sections?: Omit<BuildSheetSection, 'id'>[];
  totalDatabases?: number;
  totalViews?: number;
  totalFormulas?: number;
  estimatedBuildMinutes?: number;
  error?: string;
}

export interface GenerateGuideRequest {
  templateId: ID;
  title: string;
  oneLiner: string;
  audience: string;
  notionUrl?: string;
  sections: Omit<BuildSheetSection, 'id'>[];
  features: string[];
}

export interface GenerateGuideResponse {
  guide: string;
  generatedAt: ISODate;
}

export interface GeneratePriceRequest {
  templateId: ID;
  title: string;
  oneLiner: string;
  audience: string;
  totalDatabases: number;
  totalViews: number;
  totalFormulas: number;
  painPointSeverity: 'low' | 'medium' | 'high' | 'critical';
  audienceSizeHint?: string;
}

export interface GeneratePriceResponse extends Omit<Pricing, 'computedAt'> {
  computedAt?: ISODate;
}

export interface GenerateListingRequest {
  templateId: ID;
  title: string;
  oneLiner: string;
  audience: string;
  features: string[];
  price: number;
  currency: string;
}

export interface GenerateListingResponse extends Omit<ListingCopy, 'generatedAt'> {
  generatedAt?: ISODate;
}

export interface GenerateMarketingRequest {
  templateId: ID;
  title: string;
  oneLiner: string;
  audience: string;
  painPoints: string[];
  features: string[];
  price: number;
  currency: string;
  marketplaceUrl?: string;
  channels: MarketingChannel[];
}

export interface MarketingChannelDraft {
  channel: MarketingChannel;
  title: string;
  body: string;
  hashtags: string[];
  callToAction: string;
  scriptOutline?: string[];
  mediaHint?: string;
}

export interface GenerateMarketingResponse {
  drafts: MarketingChannelDraft[];
}

export interface PublishMarketingRequest {
  templateId: ID;
  channel: MarketingChannel;
  title: string;
  body: string;
  hashtags: string[];
  callToAction: string;
  mediaUrl?: string;
  scheduleAt?: ISODate;
}

export interface PublishMarketingResponse {
  postId: string;
  postedUrl?: string;
  postedAt: ISODate;
  status: 'posted' | 'scheduled' | 'failed';
  error?: string;
}

export interface LogToSheetRequest {
  sheetId: string;
  eventType:
    | 'pain_point'
    | 'idea'
    | 'template'
    | 'guide'
    | 'pricing'
    | 'listing'
    | 'marketing'
    | 'published';
  entityId: ID;
  title: string;
  stage: string;
  status: string;
  payload: Record<string, string | number | boolean | null>;
  occurredAt: ISODate;
}

export interface LogToSheetResponse {
  rowNumber: number;
  appendedAt: ISODate;
}

export interface HealthCheckResponse {
  ok: boolean;
  version?: string;
  serverTime?: ISODate;
}

export interface QaTemplateRequest {
  templateId: ID;
  qaItems: Pick<QAItem, 'id' | 'label' | 'status' | 'notes'>[];
  testedApproved: boolean;
  notes?: string;
}