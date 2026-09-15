import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Alert, ScrollView } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Ionicons from 'react-native-vector-icons/Ionicons';

import Screen from '@/components/Screen';
import Header from '@/components/Header';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Input from '@/components/Input';
import TextArea from '@/components/TextArea';
import Badge, { BadgeTone } from '@/components/Badge';
import SectionHeader from '@/components/SectionHeader';
import EmptyState from '@/components/EmptyState';
import CopyButton from '@/components/CopyButton';
import ShareButton from '@/components/ShareButton';
import ListItem from '@/components/ListItem';

import { useTemplates } from '@/hooks/useTemplates';
import { useMarketing } from '@/hooks/useMarketing';
import { useTheme } from '@/hooks/useTheme';

import type { RootStackParamList } from '@/navigation/types';
import type { MarketingContent, MarketingStatus } from '@/types/marketing';
import { getChannelMeta } from '@/utils/channelMeta';
import { formatDateTime } from '@/utils/date';
import { publishMarketingContent } from '@/services/marketingService';
import { logEvent } from '@/services/sheetLogger';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'MarketingDetail'>;

const STATUS_TONE: Record<MarketingStatus, BadgeTone> = {
  draft: 'warning',
  ready: 'info',
  posted: 'success',
};

export default function MarketingDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { templateId, channel } = route.params;

  const { colors } = useTheme();
  const { getById } = useTemplates();
  const marketing = useMarketing();

  const template = getById(templateId);
  const meta = getChannelMeta(channel);
  const existing = marketing.getByTemplateAndChannel(templateId, channel);

  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState<MarketingContent | undefined>(existing);
  const [postedUrl, setPostedUrl] = useState('');

  useEffect(() => {
    setDraft(existing);
    setPostedUrl(existing?.postedUrl ?? '');
  }, [existing]);

  const hashtagsString = useMemo(
    () => (draft ? draft.hashtags.join(' ') : ''),
    [draft],
  );

  const fullText = useMemo(() => {
    if (!draft) return '';
    const parts = [draft.title, '', draft.body];
    if (draft.scriptOutline && draft.scriptOutline.length > 0) {
      parts.push('', 'Script outline:', ...draft.scriptOutline.map((s) => `• ${s}`));
    }
    if (draft.hashtags.length > 0) {
      parts.push('', draft.hashtags.join(' '));
    }
    if (draft.callToAction) {
      parts.push('', draft.callToAction);
    }
    return parts.filter(Boolean).join('\n');
  }, [draft]);

  if (!template) {
    return (
      <Screen edges={['top']} padded={false}>
        <Header title={meta.label} showBack />
        <EmptyState
          icon="alert-circle-outline"
          title="Template not found"
          message="It may have been removed."
          actionLabel="Go back"
          onAction={() => navigation.goBack()}
        />
      </Screen>
    );
  }

  const handleGenerate = () => {
    Alert.alert(
      'Generate content?',
      `This will create or overwrite the draft for ${meta.label}.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Generate',
          onPress: async () => {
            setBusy(true);
            try {
              const result = await marketingForOneChannel(templateId, channel);
              if (result) {
                setDraft(result);
                void logEvent({
                  eventType: 'marketing',
                  entityId: result.id,
                  title: result.title,
                  stage: 'marketing',
                  status: 'generated',
                  payload: { channel, source: result.generatedBy },
                });
              }
            } finally {
              setBusy(false);
            }
          },
        },
      ],
    );
  };

  const handleSave = () => {
    if (!draft) return;
    if (existing) {
      marketing.update(existing.id, {
        title: draft.title,
        body: draft.body,
        hashtags: draft.hashtags,
        callToAction: draft.callToAction,
        scriptOutline: draft.scriptOutline,
      });
    } else {
      marketing.upsert({
        templateId,
        channel,
        title: draft.title,
        body: draft.body,
        hashtags: draft.hashtags,
        callToAction: draft.callToAction,
        scriptOutline: draft.scriptOutline,
        generatedBy: 'local-heuristic',
      });
    }
    setEditing(false);
  };

  const handleMarkReady = () => {
    if (!existing) return;
    marketing.setStatus(existing.id, 'ready');
  };

  const handlePublishNow = async () => {
    if (!existing) return;
    setBusy(true);
    try {
      const result = await publishMarketingContent(existing.id);
      if (result.ok) {
        Alert.alert(
          'Posted',
          result.postedUrl
            ? `Posted to ${meta.label}.\n\n${result.postedUrl}`
            : `Marked as posted to ${meta.label}.`,
        );
      } else {
        Alert.alert('Publish failed', result.error ?? 'Try again later.');
      }
    } finally {
      setBusy(false);
    }
  };

  const handleMarkPostedManual = () => {
    if (!existing) return;
    Alert.alert(
      'Mark as posted?',
      'Use this after you posted manually. You can add the post URL.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark posted',
          onPress: () => {
            marketing.markPosted(existing.id, postedUrl.trim() || undefined);
            void logEvent({
              eventType: 'marketing',
              entityId: existing.id,
              title: existing.title,
              stage: 'marketing',
              status: 'posted',
              payload: {
                channel,
                mode: 'manual',
                postedUrl: postedUrl.trim() || null,
              },
            });
          },
        },
      ],
    );
  };

  const handleReset = () => {
    if (!existing) return;
    Alert.alert('Reset to draft?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', onPress: () => marketing.resetToDraft(existing.id) },
    ]);
  };

  const handleDelete = () => {
    if (!existing) return;
    Alert.alert('Delete content?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          marketing.remove(existing.id);
          navigation.goBack();
        },
      },
    ]);
  };

  return (
    <Screen scroll edges={['top']} padded={false}>
      <Header
        title={meta.label}
        subtitle={template.title}
        showBack
        onBack={editing ? () => setEditing(false) : undefined}
        right={
          editing
            ? [
                {
                  icon: 'checkmark',
                  onPress: handleSave,
                  accessibilityLabel: 'Save',
                },
              ]
            : existing
            ? [
                {
                  icon: 'create-outline',
                  onPress: () => setEditing(true),
                  accessibilityLabel: 'Edit',
                },
                {
                  icon: 'ellipsis-horizontal',
                  onPress: () =>
                    Alert.alert('Actions', undefined, [
                      { text: 'Regenerate', onPress: handleGenerate },
                      { text: 'Reset to draft', onPress: handleReset },
                      { text: 'Delete', style: 'destructive', onPress: handleDelete },
                      { text: 'Cancel', style: 'cancel' },
                    ]),
                  accessibilityLabel: 'More',
                },
              ]
            : undefined
        }
      />

      <View className="px-4 pt-4">
        {!existing && !draft ? (
          <Card>
            <View className="items-center py-6">
              <View
                className="w-14 h-14 rounded-full items-center justify-center mb-3"
                style={{ backgroundColor: `${meta.tint}22` }}
              >
                <Ionicons name={meta.icon} size={24} color={meta.tint} />
              </View>
              <Text className="text-text dark:text-dark-text text-sm font-semibold text-center">
                No content for {meta.label}
              </Text>
              <Text className="text-muted dark:text-dark-muted text-xs text-center mt-1 mb-4 px-4 leading-5">
                {meta.hint}
              </Text>
              <Button
                title={busy ? 'Generating…' : 'Generate content'}
                icon="sparkles-outline"
                variant="primary"
                loading={busy}
                onPress={handleGenerate}
              />
            </View>
          </Card>
        ) : editing && draft ? (
          <>
            <Input
              label="Title / hook"
              value={draft.title}
              onChangeText={(v) => setDraft({ ...draft, title: v })}
              hint={`Max ${meta.charLimit} characters for body`}
            />
            <TextArea
              label="Body"
              value={draft.body}
              onChangeText={(v) => setDraft({ ...draft, body: v })}
              minHeight={180}
              hint={`${draft.body.length} / ${meta.charLimit}`}
            />
            <Input
              label="Hashtags"
              value={hashtagsString}
              onChangeText={(v) =>
                setDraft({
                  ...draft,
                  hashtags: v
                    .split(/\s+/)
                    .map((h) => h.trim())
                    .filter(Boolean),
                })
              }
              hint="Separate with spaces"
            />
            <TextArea
              label="Call to action"
              value={draft.callToAction}
              onChangeText={(v) => setDraft({ ...draft, callToAction: v })}
              minHeight={70}
            />
            {draft.scriptOutline ? (
              <TextArea
                label="Script outline"
                value={draft.scriptOutline.join('\n')}
                onChangeText={(v) =>
                  setDraft({
                    ...draft,
                    scriptOutline: v.split('\n').filter(Boolean),
                  })
                }
                minHeight={120}
                hint="One line per beat"
              />
            ) : null}
          </>
        ) : draft ? (
          <>
            <Card>
              <View className="flex-row items-center justify-between mb-3">
                <Badge label={draft.status} tone={STATUS_TONE[draft.status]} />
                <Badge
                  label={draft.generatedBy === 'n8n' ? 'AI' : 'Local'}
                  tone={draft.generatedBy === 'n8n' ? 'primary' : 'neutral'}
                />
              </View>

              <Text className="text-text dark:text-dark-text text-base font-bold mb-2">
                {draft.title}
              </Text>

              <Text className="text-text dark:text-dark-text text-sm leading-6 mb-3">
                {draft.body}
              </Text>

              {draft.scriptOutline && draft.scriptOutline.length > 0 ? (
                <>
                  <Text className="text-text dark:text-dark-text text-xs font-semibold uppercase tracking-wider mt-3 mb-1">
                    Script outline
                  </Text>
                  {draft.scriptOutline.map((line, i) => (
                    <Text
                      key={i}
                      className="text-text dark:text-dark-text text-xs leading-5 mb-0.5"
                    >
                      • {line}
                    </Text>
                  ))}
                </>
              ) : null}

              {draft.hashtags.length > 0 ? (
                <View className="flex-row flex-wrap gap-1.5 mt-3">
                  {draft.hashtags.map((h) => (
                    <Badge key={h} label={h} tone="info" />
                  ))}
                </View>
              ) : null}

              {draft.callToAction ? (
                <Text className="text-primary text-xs font-semibold mt-3">
                  {draft.callToAction}
                </Text>
              ) : null}
            </Card>

            <Card className="mt-3">
              <View className="flex-row gap-2 flex-wrap">
                <CopyButton value={fullText} label="Copy" />
                <ShareButton
                  title={draft.title}
                  message={fullText}
                  label="Share"
                />
                {draft.status === 'draft' ? (
                  <Button
                    title="Mark ready"
                    size="sm"
                    variant="secondary"
                    icon="checkmark-circle-outline"
                    onPress={handleMarkReady}
                  />
                ) : null}
              </View>
            </Card>

            <SectionHeader title="Publish" />
            <Card>
              <Input
                label="Posted URL (optional)"
                value={postedUrl}
                onChangeText={setPostedUrl}
                placeholder="https://..."
                autoCapitalize="none"
                keyboardType="url"
              />

              <View className="mt-3 gap-2">
                <Button
                  title={busy ? 'Posting…' : 'Auto-post via n8n'}
                  icon="rocket-outline"
                  variant="primary"
                  fullWidth
                  loading={busy}
                  onPress={handlePublishNow}
                />
                <Button
                  title="Mark as posted manually"
                  icon="checkmark-done-outline"
                  variant="secondary"
                  fullWidth
                  onPress={handleMarkPostedManual}
                />
              </View>

              {draft.status === 'posted' ? (
                <View className="mt-3 p-3 rounded-lg bg-success/15 border border-success/30">
                  <View className="flex-row items-center">
                    <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                    <Text className="text-success text-xs ml-2">
                      Posted {draft.postedAt ? formatDateTime(draft.postedAt) : ''}
                    </Text>
                  </View>
                  {draft.postedUrl ? (
                    <Text className="text-success text-[11px] mt-1">
                      {draft.postedUrl}
                    </Text>
                  ) : null}
                </View>
              ) : null}
            </Card>

            <SectionHeader title="Details" />
            <Card>
              <ListItem
                title="Channel"
                rightText={meta.label}
                leading={<Ionicons name={meta.icon} size={18} color={meta.tint} />}
              />
              <View className="h-px bg-border dark:bg-border" />
              <ListItem
                title="Char limit"
                rightText={`${meta.charLimit}`}
                leading={
                  <Ionicons name="text-outline" size={18} color={colors.muted} />
                }
              />
              <View className="h-px bg-border dark:bg-border" />
              <ListItem
                title="Created"
                rightText={formatDateTime(draft.createdAt)}
                leading={
                  <Ionicons name="time-outline" size={18} color={colors.muted} />
                }
              />
            </Card>

            <View className="mt-6 gap-3">
              <Button
                title="Regenerate"
                icon="refresh-outline"
                variant="secondary"
                fullWidth
                loading={busy}
                onPress={handleGenerate}
              />
              <Button
                title="Back to all channels"
                icon="arrow-back-outline"
                variant="ghost"
                fullWidth
                onPress={() => navigation.goBack()}
              />
            </View>
          </>
        ) : null}
      </View>
    </Screen>
  );
}

async function marketingForOneChannel(
  templateId: string,
  channel: MarketingContent['channel'],
): Promise<MarketingContent | undefined> {
  const { generateMarketingForTemplate } = await import('@/services/marketingService');
  const result = await generateMarketingForTemplate({
    templateId,
    channels: [channel],
  });
  return result.contents[0];
}