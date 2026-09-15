import type {
  BuildStatusResponse,
  BuildTemplateRequest,
  BuildTemplateResponse,
  GenerateGuideRequest,
  GenerateGuideResponse,
  GenerateIdeasRequest,
  GenerateIdeasResponse,
  GenerateListingRequest,
  GenerateListingResponse,
  GenerateMarketingRequest,
  GenerateMarketingResponse,
  GeneratePriceRequest,
  GeneratePriceResponse,
  HealthCheckResponse,
  LogToSheetRequest,
  LogToSheetResponse,
  N8nResponse,
  PublishMarketingRequest,
  PublishMarketingResponse,
  QaTemplateRequest,
} from '@/types/n8n';
import type { AppSettings } from '@/types/settings';
import { ApiError } from './errors';
import { apiClient, optionsFromSettings } from './client';

const PATHS = {
  generateIdeas: '/generate-ideas',
  buildTemplate: '/build-template',
  buildStatus: '/build-status',
  generateGuide: '/generate-guide',
  generatePrice: '/generate-price',
  generateListing: '/generate-listing',
  generateMarketing: '/generate-marketing',
  publishMarketing: '/publish-marketing',
  logToSheet: '/log-to-sheet',
  qaTemplate: '/qa-template',
  health: '/health',
} as const;

function unwrap<T>(payload: N8nResponse<T>): T {
  if (payload && typeof payload === 'object' && 'success' in payload) {
    if (payload.success) return payload.data;
    throw new ApiError('server', payload.error || 'n8n returned an error.');
  }
  throw new ApiError('parse', 'Unexpected response from n8n.');
}

export async function generateIdeas(
  settings: AppSettings,
  body: GenerateIdeasRequest,
): Promise<GenerateIdeasResponse> {
  const raw = await apiClient.post<GenerateIdeasRequest, N8nResponse<GenerateIdeasResponse>>(
    PATHS.generateIdeas,
    body,
    optionsFromSettings(settings),
  );
  return unwrap(raw);
}

export async function buildTemplate(
  settings: AppSettings,
  body: BuildTemplateRequest,
): Promise<BuildTemplateResponse> {
  const raw = await apiClient.post<BuildTemplateRequest, N8nResponse<BuildTemplateResponse>>(
    PATHS.buildTemplate,
    body,
    optionsFromSettings(settings),
  );
  return unwrap(raw);
}

export async function getBuildStatus(
  settings: AppSettings,
  jobId: string,
): Promise<BuildStatusResponse> {
  const raw = await apiClient.get<N8nResponse<BuildStatusResponse>>(PATHS.buildStatus, {
    ...optionsFromSettings(settings),
    params: { jobId },
  });
  return unwrap(raw);
}

export async function generateGuide(
  settings: AppSettings,
  body: GenerateGuideRequest,
): Promise<GenerateGuideResponse> {
  const raw = await apiClient.post<GenerateGuideRequest, N8nResponse<GenerateGuideResponse>>(
    PATHS.generateGuide,
    body,
    optionsFromSettings(settings),
  );
  return unwrap(raw);
}

export async function generatePrice(
  settings: AppSettings,
  body: GeneratePriceRequest,
): Promise<GeneratePriceResponse> {
  const raw = await apiClient.post<GeneratePriceRequest, N8nResponse<GeneratePriceResponse>>(
    PATHS.generatePrice,
    body,
    optionsFromSettings(settings),
  );
  return unwrap(raw);
}

export async function generateListing(
  settings: AppSettings,
  body: GenerateListingRequest,
): Promise<GenerateListingResponse> {
  const raw = await apiClient.post<GenerateListingRequest, N8nResponse<GenerateListingResponse>>(
    PATHS.generateListing,
    body,
    optionsFromSettings(settings),
  );
  return unwrap(raw);
}

export async function generateMarketing(
  settings: AppSettings,
  body: GenerateMarketingRequest,
): Promise<GenerateMarketingResponse> {
  const raw = await apiClient.post<
    GenerateMarketingRequest,
    N8nResponse<GenerateMarketingResponse>
  >(PATHS.generateMarketing, body, optionsFromSettings(settings));
  return unwrap(raw);
}

export async function publishMarketing(
  settings: AppSettings,
  body: PublishMarketingRequest,
): Promise<PublishMarketingResponse> {
  const raw = await apiClient.post<
    PublishMarketingRequest,
    N8nResponse<PublishMarketingResponse>
  >(PATHS.publishMarketing, body, optionsFromSettings(settings));
  return unwrap(raw);
}

export async function logToSheet(
  settings: AppSettings,
  body: LogToSheetRequest,
): Promise<LogToSheetResponse> {
  const raw = await apiClient.post<LogToSheetRequest, N8nResponse<LogToSheetResponse>>(
    PATHS.logToSheet,
    body,
    optionsFromSettings(settings),
  );
  return unwrap(raw);
}

export async function qaTemplate(
  settings: AppSettings,
  body: QaTemplateRequest,
): Promise<{ ok: boolean }> {
  const raw = await apiClient.post<QaTemplateRequest, N8nResponse<{ ok: boolean }>>(
    PATHS.qaTemplate,
    body,
    optionsFromSettings(settings),
  );
  return unwrap(raw);
}

export async function pingN8n(settings: AppSettings): Promise<HealthCheckResponse> {
  const raw = await apiClient.get<N8nResponse<HealthCheckResponse>>(PATHS.health, {
    ...optionsFromSettings(settings),
  });
  return unwrap(raw);
}