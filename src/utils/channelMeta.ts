import type { MarketingChannel, MarketingChannelMeta } from '@/types/marketing';

export const MARKETING_CHANNELS: MarketingChannel[] = [
  'youtube',
  'facebook',
  'pinterest',
  'tiktok',
  'rednote',
  'twitter',
  'instagram',
];

export const CHANNEL_META: Record<MarketingChannel, MarketingChannelMeta> = {
  youtube: {
    channel: 'youtube',
    label: 'YouTube',
    icon: 'logo-youtube',
    tint: '#FF0000',
    charLimit: 5000,
    hint: 'Video title, description, tags, and a short script outline.',
  },
  facebook: {
    channel: 'facebook',
    label: 'Facebook',
    icon: 'logo-facebook',
    tint: '#1877F2',
    charLimit: 63206,
    hint: 'Page post with a friendly hook and 3–5 hashtags.',
  },
  pinterest: {
    channel: 'pinterest',
    label: 'Pinterest',
    icon: 'logo-pinterest',
    tint: '#E60023',
    charLimit: 500,
    hint: 'Pin title + description optimised for search discovery.',
  },
  tiktok: {
    channel: 'tiktok',
    label: 'TikTok',
    icon: 'logo-tiktok',
    tint: '#000000',
    charLimit: 2200,
    hint: 'Hook line, on-screen script beats, caption + hashtags.',
  },
  rednote: {
    channel: 'rednote',
    label: 'RedNote (Xiaohongshu)',
    icon: 'book-outline',
    tint: '#FF2E4D',
    charLimit: 1000,
    hint: 'Chinese-style lifestyle post: emoji, short lines, tags.',
  },
  twitter: {
    channel: 'twitter',
    label: 'X / Twitter',
    icon: 'logo-twitter',
    tint: '#1DA1F2',
    charLimit: 280,
    hint: 'Short thread opener with a strong hook.',
  },
  instagram: {
    channel: 'instagram',
    label: 'Instagram',
    icon: 'logo-instagram',
    tint: '#E1306C',
    charLimit: 2200,
    hint: 'Caption with line breaks + 8–15 hashtags.',
  },
};

export function getChannelMeta(channel: MarketingChannel): MarketingChannelMeta {
  return CHANNEL_META[channel];
}

export function getChannelLabel(channel: MarketingChannel): string {
  return CHANNEL_META[channel].label;
}

export function getChannelCharLimit(channel: MarketingChannel): number {
  return CHANNEL_META[channel].charLimit;
}

export function isWithinChannelLimit(
  channel: MarketingChannel,
  text: string,
): boolean {
  return text.length <= CHANNEL_META[channel].charLimit;
}

export function getChannelOverflow(channel: MarketingChannel, text: string): number {
  const limit = CHANNEL_META[channel].charLimit;
  return text.length > limit ? text.length - limit : 0;
}