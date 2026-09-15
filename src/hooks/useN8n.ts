import { useMutation, useQuery, UseMutationResult } from '@tanstack/react-query';
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
  PublishMarketingRequest,
  PublishMarketingResponse,
  QaTemplateRequest,
} from '@/types/n8n';
import * as n8n from '@/api/n8n';
import { useSettingsStore } from '@/store/useSettingsStore';

function useSettings() {
  return useSettingsStore((s) => s.settings);
}

export function useGenerateIdeasMutation(): UseMutationResult<
  GenerateIdeasResponse,
  Error,
  GenerateIdeasRequest
> {
  const settings = useSettings();
  return useMutation<GenerateIdeasResponse, Error, GenerateIdeasRequest>({
    mutationFn: (body) => n8n.generateIdeas(settings, body),
  });
}

export function useBuildTemplateMutation(): UseMutationResult<
  BuildTemplateResponse,
  Error,
  BuildTemplateRequest
> {
  const settings = useSettings();
  return useMutation<BuildTemplateResponse, Error, BuildTemplateRequest>({
    mutationFn: (body) => n8n.buildTemplate(settings, body),
  });
}

export function useBuildStatusQuery(jobId: string | undefined, enabled = true) {
  const settings = useSettings();
  return useQuery<BuildStatusResponse, Error>({
    queryKey: ['n8n', 'build-status', jobId],
    queryFn: () => {
      if (!jobId) throw new Error('Missing jobId');
      return n8n.getBuildStatus(settings, jobId);
    },
    enabled: Boolean(jobId) && enabled,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return 3000;
      if (data.status === 'completed' || data.status === 'failed') return false;
      return 3000;
    },
  });
}

export function useGenerateGuideMutation(): UseMutationResult<
  GenerateGuideResponse,
  Error,
  GenerateGuideRequest
> {
  const settings = useSettings();
  return useMutation<GenerateGuideResponse, Error, GenerateGuideRequest>({
    mutationFn: (body) => n8n.generateGuide(settings, body),
  });
}

export function useGeneratePriceMutation(): UseMutationResult<
  GeneratePriceResponse,
  Error,
  GeneratePriceRequest
> {
  const settings = useSettings();
  return useMutation<GeneratePriceResponse, Error, GeneratePriceRequest>({
    mutationFn: (body) => n8n.generatePrice(settings, body),
  });
}

export function useGenerateListingMutation(): UseMutationResult<
  GenerateListingResponse,
  Error,
  GenerateListingRequest
> {
  const settings = useSettings();
  return useMutation<GenerateListingResponse, Error, GenerateListingRequest>({
    mutationFn: (body) => n8n.generateListing(settings, body),
  });
}

export function useGenerateMarketingMutation(): UseMutationResult<
  GenerateMarketingResponse,
  Error,
  GenerateMarketingRequest
> {
  const settings = useSettings();
  return useMutation<GenerateMarketingResponse, Error, GenerateMarketingRequest>({
    mutationFn: (body) => n8n.generateMarketing(settings, body),
  });
}

export function usePublishMarketingMutation(): UseMutationResult<
  PublishMarketingResponse,
  Error,
  PublishMarketingRequest
> {
  const settings = useSettings();
  return useMutation<PublishMarketingResponse, Error, PublishMarketingRequest>({
    mutationFn: (body) => n8n.publishMarketing(settings, body),
  });
}

export function useLogToSheetMutation(): UseMutationResult<
  LogToSheetResponse,
  Error,
  LogToSheetRequest
> {
  const settings = useSettings();
  return useMutation<LogToSheetResponse, Error, LogToSheetRequest>({
    mutationFn: (body) => n8n.logToSheet(settings, body),
  });
}

export function useQaTemplateMutation(): UseMutationResult<
  { ok: boolean },
  Error,
  QaTemplateRequest
> {
  const settings = useSettings();
  return useMutation<{ ok: boolean }, Error, QaTemplateRequest>({
    mutationFn: (body) => n8n.qaTemplate(settings, body),
  });
}

export function useN8nHealthQuery(enabled = true) {
  const settings = useSettings();
  return useQuery<HealthCheckResponse, Error>({
    queryKey: ['n8n', 'health', settings.n8nWebhookUrl],
    queryFn: () => n8n.pingN8n(settings),
    enabled: enabled && Boolean(settings.n8nWebhookUrl),
    retry: 0,
    staleTime: 30 * 1000,
  });
}