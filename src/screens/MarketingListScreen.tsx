import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, Alert } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Ionicons from 'react-native-vector-icons/Ionicons';

import Screen from '@/components/Screen';
import Header from '@/components/Header';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Badge, { BadgeTone } from '@/components/Badge';
import SectionHeader from '@/components/SectionHeader';
import EmptyState from '@/components/EmptyState';
import ListItem from '@/components/ListItem';

import { useTemplates } from '@/hooks/useTemplates';
import { useMarketing } from '@/hooks/useMarketing';
import { useTheme } from '@/hooks/useTheme';

import type { RootStackParamList } from '@/navigation/types';
import type { MarketingChannel, MarketingStatus } from '@/types/marketing';
import { MARKETING_CHANNELS, getChannelMeta } from '@/utils/channelMeta';
import { generateMarketingForTemplate } from '@/services/marketingService';
import { truncate } from '@/utils/format';
import { formatRelative } from '@/utils/date';
import { useSettingsStore } from '@/store/useSettingsStore';
import { generateMarketing } from '@/api/n8n';
import { userMessage } from '@/api/errors';
import { logEvent } from '@/services/sheetLogger';
import { useMarketingStore } from '@/store/useMarketingStore';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'MarketingList'>;

const STATUS_TONE: Record<MarketingStatus, BadgeTone> = {
  draft: 'warning',
  ready: 'info',
  posted: 'success',
};

export default function MarketingListScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const templateId = route.params?.templateId;

  const { colors } = useTheme();
  const { getById, items: allTemplates } = useTemplates();
  const marketing = useMarketing();
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);

  const template = templateId ? getById(templateId) : undefined;
  const map = useMemo(
    () => (template ? marketing.getByTemplate(template.id) : {}),
    [template, marketing],
  );
  const stats = useMemo(
    () => (template ? marketing.stats(template.id) : marketing.stats()),
    [template, marketing],
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 300);
  }, []);

  const handleGenerateAll = async () => {
    if (!template) return;
    setBusy(true);
    try {
      const settings = useSettingsStore.getState().settings;
      if (settings.n8nWebhookUrl) {
        try {
          const features =
            template.buildSheet?.sections.map((s) => s.title) ?? [];
          const res = await generateMarketing(settings, {
            templateId: template.id,
            title: template.title,
            oneLiner: template.oneLiner,
            audience: template.audience,
            painPoints: [],
            features,
            price: template.pricing?.suggested ?? 9,
            currency: template.pricing?.currency ?? 'USD',
            marketplaceUrl: template.publishedUrl,
            channels: MARKETING_CHANNELS,
          });
          const store = useMarketingStore.getState();
          store.upsertMany(
            res.drafts.map((d) => ({
              templateId: template.id,
              channel: d.channel,
              title: d.title,
              body: d.body,
              hashtags: d.hashtags,
              callToAction: d.callToAction,
              scriptOutline: d.scriptOutline,
              mediaHint: d.mediaHint,
              generatedBy: 'n8n' as const,
            })),
          );
          void logEvent({
            eventType: 'marketing',
            entityId: template.id,
            title: template.title,
            stage: 'marketing',
            status: 'generated',
            payload: { source: 'n8n', channels: res.drafts.length },
          });
          Alert.alert('Generated', `Created ${res.drafts.length} channel drafts.`);
        } catch (err) {
          const message = userMessage(err);
          const result = await generateMarketingForTemplate({ templateId: template.id });
          Alert.alert('n8n unavailable', `Generated ${result.contents.length} local drafts.\n\n${message}`);
        }
      } else {
        const result = await generateMarketingForTemplate({ templateId: template.id });
        Alert.alert('Generated', `Created ${result.contents.length} local drafts.`);
      }
    } finally {
      setBusy(false);
    }
  };

  if (!template) {
    return (
      <Screen edges={['top']} padded={false}>
        <Header title="Marketing" showBack={navigation.canGoBack()} />
        <EmptyState
          icon="megaphone-outline"
          title="Pick a template"
          message="Marketing content is generated per template. Open a published template to create drafts."
          actionLabel="Open templates"
          onAction={() => navigation.navigate('Tabs', { screen: 'Templates' })}
        />
      </Screen>
    );
  }

  return (
    <Screen edges={['top']} padded={false}>
      <Header
        title="Marketing"
        subtitle={template.title}
        showBack
        right={[
          {
            icon: 'sparkles-outline',
            onPress: () =>
              Alert.alert(
                'Generate for all channels?',
                'This will create or overwrite drafts for every channel.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Generate', onPress: () => void handleGenerateAll() },
                ],
              ),
            accessibilityLabel: 'Generate all',
          },
        ]}
      />

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        <Card>
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center">
              <Ionicons name="megaphone-outline" size={20} color={colors.primary} />
              <Text className="text-text dark:text-dark-text text-sm font-semibold ml-2">
                Channel coverage
              </Text>
            </View>
            <Badge label={`${stats.posted}/${MARKETING_CHANNELS.length}`} tone="success" />
          </View>
          <View className="flex-row gap-2 flex-wrap">
            <Badge label={`${stats.draft} draft`} tone="warning" />
            <Badge label={`${stats.ready} ready`} tone="info" />
            <Badge label={`${stats.posted} posted`} tone="success" />
          </View>
        </Card>

        <SectionHeader
          title="Channels"
          actionLabel={busy ? 'Generating…' : 'Generate all'}
          onAction={busy ? undefined : handleGenerateAll}
        />

        {MARKETING_CHANNELS.map((channel) => {
          const meta = getChannelMeta(channel);
          const content = map[channel];
          return (
            <Card
              key={channel}
              className="mb-3"
              onPress={() =>
                navigation.navigate('MarketingDetail', {
                  templateId: template.id,
                  channel,
                })
              }
            >
              <View className="flex-row items-start">
                <View
                  className="w-10 h-10 rounded-lg items-center justify-center mr-3"
                  style={{ backgroundColor: `${meta.tint}22` }}
                >
                  <Ionicons name={meta.icon} size={20} color={meta.tint} />
                </View>

                <View className="flex-1">
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className="text-text dark:text-dark-text text-sm font-semibold">
                      {meta.label}
                    </Text>
                    {content ? (
                      <Badge
                        label={content.status}
                        tone={STATUS_TONE[content.status]}
                      />
                    ) : (
                      <Badge label="Empty" tone="neutral" />
                    )}
                  </View>

                  {content ? (
                    <>
                      <Text
                        className="text-text dark:text-dark-text text-xs font-medium mb-0.5"
                        numberOfLines={1}
                      >
                        {content.title}
                      </Text>
                      <Text
                        className="text-muted dark:text-dark-muted text-[11px] leading-4"
                        numberOfLines={2}
                      >
                        {truncate(content.body, 120)}
                      </Text>
                      <Text className="text-muted dark:text-dark-muted text-[10px] mt-1">
                        Updated {formatRelative(content.updatedAt)}
                      </Text>
                    </>
                  ) : (
                    <Text className="text-muted dark:text-dark-muted text-xs leading-4">
                      {meta.hint}
                    </Text>
                  )}
                </View>
              </View>
            </Card>
          );
        })}

        <SectionHeader title="All templates" />
        <Card padded={false}>
          {allTemplates.slice(0, 6).map((t, idx) => (
            <View key={t.id} className="px-4">
              <ListItem
                title={t.title}
                subtitle={`${t.stage} • ${marketing.stats(t.id).posted} posted`}
                onPress={() =>
                  navigation.replace('MarketingList', { templateId: t.id })
                }
              />
              {idx < Math.min(allTemplates.length, 6) - 1 ? (
                <View className="h-px bg-border dark:bg-border" />
              ) : null}
            </View>
          ))}
        </Card>

        <View className="mt-6">
          <Button
            title={busy ? 'Generating…' : 'Generate for all channels'}
            icon="sparkles-outline"
            variant="primary"
            fullWidth
            loading={busy}
            onPress={handleGenerateAll}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}