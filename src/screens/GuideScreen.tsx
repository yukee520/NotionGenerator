import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, ScrollView, Alert, RefreshControl } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Ionicons from 'react-native-vector-icons/Ionicons';

import Screen from '@/components/Screen';
import Header from '@/components/Header';
import Card from '@/components/Card';
import Button from '@/components/Button';
import MarkdownView from '@/components/MarkdownView';
import CopyButton from '@/components/CopyButton';
import ShareButton from '@/components/ShareButton';
import SectionHeader from '@/components/SectionHeader';
import EmptyState from '@/components/EmptyState';
import Badge from '@/components/Badge';

import { useTemplates } from '@/hooks/useTemplates';
import { useTheme } from '@/hooks/useTheme';

import type { RootStackParamList } from '@/navigation/types';
import type { GenerateGuideRequest } from '@/types/n8n';
import { generateGuide } from '@/api/n8n';
import { useSettingsStore } from '@/store/useSettingsStore';
import { logEvent } from '@/services/sheetLogger';
import { normalizeError, userMessage } from '@/api/errors';
import { formatDateTime } from '@/utils/date';
import { markdownToPlain } from '@/utils/markdownToPlain';
import { canGenerateGuide } from '@/services/pipeline';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'Guide'>;

function buildLocalGuide(args: {
  title: string;
  oneLiner: string;
  audience: string;
  notionUrl?: string;
  features: string[];
}): string {
  const featureLines = args.features.map((f) => `- **${f}** — description here`);
  return `# ${args.title}

${args.oneLiner}

## What's inside
${featureLines.join('\n') || '- Core dashboard\n- Tracking database\n- Review workflow'}

## Who this is for
${args.audience}

## How to duplicate this template
1. Open the template link in Notion: ${args.notionUrl ?? '(link will appear here)'}
2. Click **Duplicate** in the top-right corner.
3. Choose the workspace and page where you want it.
4. Wait a few seconds while Notion copies all databases, views, and sample data.
5. Rename pages and adjust properties to fit your workflow.

## Getting started
1. Open the **Dashboard** page and read the quick instructions.
2. Clear the sample rows in each database.
3. Customise the database properties and views.
4. Add your first real entry.

## Features
- Auto-generated sample data so you can see how it works
- Pre-built views for daily, weekly, and review workflows
- Formula-driven progress tracking
- Mobile-friendly layout

## FAQ
**Can I share this template with my team?**
Yes. Share the duplicated page with teammates and grant edit access.

**Do I need a paid Notion plan?**
No. This template works on the free Notion plan.

**Can I customise the design?**
Yes. Change colours, cover images, icons, and page layouts freely.

## Tips
- Duplicate the template into a fresh page to keep your workspace tidy.
- Use Notion's "Templates" button inside databases to speed up entry.
- Review the archive weekly to keep the workspace clean.
`;
}

export default function GuideScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const templateId = route.params.id;

  const { colors } = useTheme();
  const { getById, setGuide } = useTemplates();
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const template = getById(templateId);

  const featureList = useMemo(() => {
    if (!template?.buildSheet) return [];
    return template.buildSheet.sections
      .filter((s) => s.type === 'database' || s.type === 'page')
      .map((s) => s.title);
  }, [template]);

  const handleGenerate = useCallback(async () => {
    if (!template) return;
    const check = canGenerateGuide(template);
    if (!check.allowed) {
      Alert.alert('Cannot generate', check.reason ?? 'Template must be tested first.');
      return;
    }
    setBusy(true);
    setError(undefined);

    const settings = useSettingsStore.getState().settings;

    const localFallback = () =>
      buildLocalGuide({
        title: template.title,
        oneLiner: template.oneLiner,
        audience: template.audience,
        notionUrl: template.notionUrl,
        features: featureList,
      });

    if (settings.n8nWebhookUrl) {
      try {
        const body: GenerateGuideRequest = {
          templateId: template.id,
          title: template.title,
          oneLiner: template.oneLiner,
          audience: template.audience,
          notionUrl: template.notionUrl,
          sections: template.buildSheet?.sections ?? [],
          features: featureList,
        };
        const res = await generateGuide(settings, body);
        setGuide(template.id, res.guide);
        void logEvent({
          eventType: 'guide',
          entityId: template.id,
          title: template.title,
          stage: 'guide_ready',
          status: 'generated',
          payload: { source: 'n8n', chars: res.guide.length },
        });
        Alert.alert('Guide generated', 'The buyer guide is ready to review.');
      } catch (err) {
        const message = userMessage(err);
        setError(message);
        const local = localFallback();
        setGuide(template.id, local);
        void logEvent({
          eventType: 'guide',
          entityId: template.id,
          title: template.title,
          stage: 'guide_ready',
          status: 'local',
          payload: { source: 'local', error: message },
        });
        Alert.alert('n8n unavailable', `Generated a local guide instead.\n\n${message}`);
      }
    } else {
      const local = localFallback();
      setGuide(template.id, local);
      void logEvent({
        eventType: 'guide',
        entityId: template.id,
        title: template.title,
        stage: 'guide_ready',
        status: 'local',
        payload: { source: 'local' },
      });
    }
    setBusy(false);
  }, [template, featureList, setGuide]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 300);
  }, []);

  if (!template) {
    return (
      <Screen edges={['top']} padded={false}>
        <Header title="Buyer guide" showBack />
        <EmptyState
          icon="alert-circle-outline"
          title="Template not found"
          message="It may have been deleted."
          actionLabel="Go back"
          onAction={() => navigation.goBack()}
        />
      </Screen>
    );
  }

  const guidePlain = template.guide ? markdownToPlain(template.guide) : '';

  return (
    <Screen edges={['top']} padded={false}>
      <Header
        title="Buyer guide"
        subtitle={template.title}
        showBack
        right={
          template.guide
            ? [
                {
                  icon: 'refresh-outline',
                  onPress: () => {
                    Alert.alert(
                      'Regenerate guide?',
                      'This will overwrite the current guide.',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Regenerate', onPress: () => void handleGenerate() },
                      ],
                    );
                  },
                  accessibilityLabel: 'Regenerate',
                },
              ]
            : undefined
        }
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
        {!template.guide ? (
          <Card>
            <View className="items-center py-6">
              <View className="w-14 h-14 rounded-full bg-primary/15 items-center justify-center mb-3">
                <Ionicons name="book-outline" size={24} color={colors.primary} />
              </View>
              <Text className="text-text dark:text-dark-text text-sm font-semibold text-center">
                No buyer guide yet
              </Text>
              <Text className="text-muted dark:text-dark-muted text-xs text-center mt-1 mb-4 px-4">
                Generate a step-by-step guide your customers will get when they buy this
                template.
              </Text>
              <Button
                title={busy ? 'Generating…' : 'Generate buyer guide'}
                icon="sparkles-outline"
                variant="primary"
                loading={busy}
                onPress={handleGenerate}
              />
            </View>
          </Card>
        ) : (
          <>
            <Card>
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-text dark:text-dark-text text-sm font-semibold">
                  Guide preview
                </Text>
                <Badge
                  label={`${guidePlain.length} chars`}
                  tone="neutral"
                />
              </View>
              <Text className="text-muted dark:text-dark-muted text-[11px]">
                Generated {formatDateTime(template.guideGeneratedAt)}
              </Text>

              <View className="flex-row gap-2 mt-3 flex-wrap">
                <CopyButton value={guidePlain} label="Copy guide" />
                <ShareButton
                  title={`${template.title} — Buyer guide`}
                  message={guidePlain}
                  label="Share guide"
                />
              </View>
            </Card>

            {error ? (
              <View className="mt-3 p-3 rounded-lg bg-warning/15 border border-warning/30">
                <Text className="text-warning text-xs">{error}</Text>
              </View>
            ) : null}

            <SectionHeader title="Preview" />
            <Card>
              <MarkdownView markdown={template.guide} />
            </Card>

            <View className="mt-6 gap-3">
              <Button
                title={busy ? 'Regenerating…' : 'Regenerate guide'}
                icon="refresh-outline"
                variant="secondary"
                fullWidth
                loading={busy}
                onPress={handleGenerate}
              />
              <Button
                title="Open pricing"
                icon="pricetag-outline"
                variant="primary"
                fullWidth
                onPress={() => navigation.navigate('Pricing', { id: template.id })}
              />
            </View>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}