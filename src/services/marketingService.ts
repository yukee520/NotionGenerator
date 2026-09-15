import type { ID } from '@/types/common';
import type {
  MarketingChannel,
  MarketingContent,
} from '@/types/marketing';
import type {
  GenerateMarketingRequest,
  MarketingChannelDraft,
} from '@/types/n8n';
import {
  generateMarketing as apiGenerateMarketing,
  publishMarketing as apiPublishMarketing,
} from '@/api/n8n';
import { normalizeError, userMessage } from '@/api/errors';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useTemplateStore } from '@/store/useTemplateStore';
import { useMarketingStore, UpsertMarketingInput } from '@/store/useMarketingStore';
import { usePainPointStore } from '@/store/usePainPointStore';
import { useIdeaStore } from '@/store/useIdeaStore';
import { MARKETING_CHANNELS, getChannelMeta } from '@/utils/channelMeta';
import { effectivePrice } from '@/utils/pricingHeuristic';
import { enqueueTask } from './syncQueue';
import { logEvent } from './sheetLogger';
import { logger } from '@/utils/logger';
import { truncate } from '@/utils/format';

export interface GenerateMarketingArgs {
  templateId: ID;
  channels?: MarketingChannel[];
}

export interface GenerateMarketingResult {
  contents: MarketingContent[];
  source: 'n8n' | 'local-heuristic';
  error?: string;
}

function collectFeatures(templateId: ID): string[] {
  const template = useTemplateStore.getState().getById(templateId);
  if (!template?.buildSheet) return [];
  return template.buildSheet.sections
    .filter((s) => s.type === 'database' || s.type === 'page')
    .map((s) => s.title);
}

function collectPainPointDescriptions(templateId: ID): string[] {
  const template = useTemplateStore.getState().getById(templateId);
  if (!template) return [];
  const idea = useIdeaStore.getState().getById(template.ideaId);
  if (!idea) return [];
  const painPoints = usePainPointStore.getState().getManyByIds(idea.painPointIds);
  return painPoints.map((p) => p.title);
}

function heuristicDraft(
  channel: MarketingChannel,
  args: {
    title: string;
    oneLiner: string;
    audience: string;
    features: string[];
    price: number;
    currency: string;
    painPoints: string[];
    marketplaceUrl?: string;
  },
): MarketingChannelDraft {
  const meta = getChannelMeta(channel);
  const priceText = `${args.currency} ${args.price}`;
  const featureLine = args.features.slice(0, 3).join(' • ');
  const pain = args.painPoints[0] ?? args.audience;

  const baseBody = [
    `Tired of ${pain.toLowerCase()}?`,
    '',
    `${args.title} — ${args.oneLiner}`,
    '',
    `Built for ${args.audience}.`,
    featureLine ? `Includes: ${featureLine}` : '',
    '',
    `Get it for ${priceText}.`,
    args.marketplaceUrl ? `Link: ${args.marketplaceUrl}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  const genericHashtags = ['#Notion', '#NotionTemplate', '#Productivity'];

  switch (channel) {
    case 'youtube':
      return {
        channel,
        title: `${args.title} — Notion Template Walkthrough`,
        body: `${args.oneLiner}\n\nIn this video I walk through the ${args.title} template and how it solves: ${pain}.\n\n${baseBody}`,
        hashtags: [...genericHashtags, '#NotionTour'],
        callToAction: 'Watch the walkthrough and grab the template via the link below.',
        scriptOutline: [
          '0:00 — Hook: the problem',
          '0:20 — Who this is for',
          '0:45 — Tour of the dashboard',
          '2:00 — Key databases and views',
          '4:00 — How to duplicate',
          '5:00 — CTA',
        ],
        mediaHint: 'Thumbnail: bold title + before/after screenshots.',
      };
    case 'facebook':
      return {
        channel,
        title: args.title,
        body: baseBody,
        hashtags: [...genericHashtags, '#NotionForBeginners'],
        callToAction: 'Tap the link to duplicate the template.',
        mediaHint: 'Image: hero screenshot + template name.',
      };
    case 'pinterest':
      return {
        channel,
        title: `${args.title} — Notion Template for ${args.audience}`,
        body: truncate(`${args.oneLiner} Save this pin to build your system later.`, 400),
        hashtags: ['#Notion', '#NotionTemplate', '#Planner'],
        callToAction: 'Pin it. Use it. Share it.',
        mediaHint: 'Vertical 2:3 pin, 1000x1500, bold text overlay.',
      };
    case 'tiktok':
      return {
        channel,
        title: `${args.title} in 30s`,
        body: `Hook: POV you finally fix ${pain.toLowerCase()} 👀\n\n${args.oneLiner}\n\nGrab it for ${priceText}.`,
        hashtags: ['#notion', '#notiontemplate', '#productivitytok', '#tiktokmademebuyit'],
        callToAction: 'Link in bio.',
        scriptOutline: [
          'Hook (0-2s) — show the chaos',
          'Reveal (2-10s) — show the template',
          'Proof (10-20s) — show features',
          'CTA (20-30s) — where to get it',
        ],
        mediaHint: 'Vertical 9:16. Fast cuts, captions on.',
      };
    case 'rednote':
      return {
        channel,
        title: `${args.title}｜让生活井井有条的 Notion 模板`,
        body: [
          `📌 解决痛点：${pain}`,
          '',
          `✨ ${args.title}`,
          args.oneLiner,
          '',
          `🎯 适合：${args.audience}`,
          `💰 价格：${priceText}`,
        ].join('\n'),
        hashtags: ['#Notion模板', '#效率工具', '#生产力', '#Notion'],
        callToAction: '评论区获取模板链接。',
        mediaHint: '竖版封面图 + 中文大字标题。',
      };
    case 'twitter':
      return {
        channel,
        title: args.title,
        body: truncate(
          `${args.oneLiner}\n\nBuilt for ${args.audience}. ${priceText}.\n\n🧵 1/3`,
          270,
        ),
        hashtags: ['#Notion', '#Build'],
        callToAction: 'Link below 👇',
        mediaHint: 'Attach a clean dashboard screenshot.',
      };
    case 'instagram':
      return {
        channel,
        title: args.title,
        body: [
          `If ${pain.toLowerCase()} sounds familiar, this one's for you.`,
          '',
          `${args.oneLiner}`,
          '',
          `→ Built for ${args.audience}`,
          `→ ${priceText}`,
          '',
          'Save this post so you can come back to it later 📌',
        ].join('\n'),
        hashtags: [
          '#notion',
          '#notiontemplate',
          '#productivity',
          '#organization',
          '#planner',
          '#digitalplanner',
          '#notiontips',
          '#worksmarter',
        ],
        callToAction: 'Link in bio to grab the template.',
        mediaHint: 'Carousel: 1) hero, 2) features, 3) how to duplicate, 4) CTA.',
      };
    default:
      return {
        channel,
        title: args.title,
        body: baseBody,
        hashtags: genericHashtags,
        callToAction: meta.hint,
      };
  }
}

function mapDraftToUpsert(
  templateId: ID,
  draft: MarketingChannelDraft,
  generatedBy: 'n8n' | 'local-heuristic',
): UpsertMarketingInput {
  return {
    templateId,
    channel: draft.channel,
    title: draft.title,
    body: draft.body,
    hashtags: draft.hashtags,
    callToAction: draft.callToAction,
    scriptOutline: draft.scriptOutline,
    mediaHint: draft.mediaHint,
    generatedBy,
  };
}

export async function generateMarketingForTemplate(
  args: GenerateMarketingArgs,
): Promise<GenerateMarketingResult> {
  const settings = useSettingsStore.getState().settings;
  const templateStore = useTemplateStore.getState();
  const marketingStore = useMarketingStore.getState();

  const template = templateStore.getById(args.templateId);
  if (!template) {
    return { contents: [], source: 'local-heuristic', error: 'Template not found.' };
  }

  const channels = args.channels ?? MARKETING_CHANNELS;
  const features = collectFeatures(template.id);
  const painPoints = collectPainPointDescriptions(template.id);
  const price = effectivePrice(template.pricing) ?? 9;
  const currency = template.pricing?.currency ?? 'USD';

  if (settings.n8nWebhookUrl) {
    try {
      const body: GenerateMarketingRequest = {
        templateId: template.id,
        title: template.title,
        oneLiner: template.oneLiner,
        audience: template.audience,
        painPoints,
        features,
        price,
        currency,
        marketplaceUrl: template.publishedUrl,
        channels,
      };
      const res = await apiGenerateMarketing(settings, body);
      const inputs = res.drafts.map((d) => mapDraftToUpsert(template.id, d, 'n8n'));
      const contents = marketingStore.upsertMany(inputs);
      contents.forEach((c) => {
        void logEvent({
          eventType: 'marketing',
          entityId: c.id,
          title: c.title,
          stage: 'marketing',
          status: c.status,
          payload: { channel: c.channel, source: 'n8n' },
        });
      });
      return { contents, source: 'n8n' };
    } catch (err) {
      const message = userMessage(err);
      logger.warn('n8n generateMarketing failed, using heuristic', message);
      enqueueTask('generate_marketing', template.id, {
        templateId: template.id,
        channels,
      });
      const inputs = channels.map((channel) =>
        mapDraftToUpsert(
          template.id,
          heuristicDraft(channel, {
            title: template.title,
            oneLiner: template.oneLiner,
            audience: template.audience,
            features,
            price,
            currency,
            painPoints,
            marketplaceUrl: template.publishedUrl,
          }),
          'local-heuristic',
        ),
      );
      const contents = marketingStore.upsertMany(inputs);
      return { contents, source: 'local-heuristic', error: message };
    }
  }

  const inputs = channels.map((channel) =>
    mapDraftToUpsert(
      template.id,
      heuristicDraft(channel, {
        title: template.title,
        oneLiner: template.oneLiner,
        audience: template.audience,
        features,
        price,
        currency,
        painPoints,
        marketplaceUrl: template.publishedUrl,
      }),
      'local-heuristic',
    ),
  );
  const contents = marketingStore.upsertMany(inputs);
  return { contents, source: 'local-heuristic' };
}

export interface PublishResult {
  ok: boolean;
  postedUrl?: string;
  error?: string;
}

export async function publishMarketingContent(
  marketingId: ID,
): Promise<PublishResult> {
  const settings = useSettingsStore.getState().settings;
  const marketingStore = useMarketingStore.getState();
  const content = marketingStore.items.find((m) => m.id === marketingId);
  if (!content) return { ok: false, error: 'Marketing content not found.' };

  if (!settings.n8nWebhookUrl) {
    marketingStore.markPosted(marketingId);
    void logEvent({
      eventType: 'marketing',
      entityId: content.id,
      title: content.title,
      stage: 'marketing',
      status: 'posted',
      payload: { channel: content.channel, mode: 'manual' },
    });
    return { ok: true };
  }

  try {
    const res = await apiPublishMarketing(settings, {
      templateId: content.templateId,
      channel: content.channel,
      title: content.title,
      body: content.body,
      hashtags: content.hashtags,
      callToAction: content.callToAction,
    });
    if (res.status === 'failed') {
      return { ok: false, error: res.error ?? 'Publishing failed.' };
    }
    marketingStore.markPosted(marketingId, res.postedUrl);
    void logEvent({
      eventType: 'marketing',
      entityId: content.id,
      title: content.title,
      stage: 'marketing',
      status: res.status,
      payload: {
        channel: content.channel,
        postedUrl: res.postedUrl ?? null,
        postId: res.postId,
      },
    });
    return { ok: true, postedUrl: res.postedUrl };
  } catch (err) {
    enqueueTask('publish_marketing', content.id, {
      templateId: content.templateId,
      channel: content.channel,
      title: content.title,
      body: content.body,
      hashtags: content.hashtags,
      callToAction: content.callToAction,
    });
    return { ok: false, error: normalizeError(err).message };
  }
}