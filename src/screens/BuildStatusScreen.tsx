import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, Alert, ScrollView, RefreshControl } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Ionicons from 'react-native-vector-icons/Ionicons';

import Screen from '@/components/Screen';
import Header from '@/components/Header';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Badge from '@/components/Badge';
import SectionHeader from '@/components/SectionHeader';
import EmptyState from '@/components/EmptyState';
import ProgressSteps from '@/components/ProgressSteps';
import ListItem from '@/components/ListItem';

import { useTemplates } from '@/hooks/useTemplates';
import { useTheme } from '@/hooks/useTheme';

import type { RootStackParamList } from '@/navigation/types';
import { pollBuildStatus } from '@/services/templateBuilder';
import { usePolling } from '@/hooks/usePolling';
import { formatRelative } from '@/utils/date';
import { TEMPLATE_STAGE_LABELS } from '@/types/template';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'BuildStatus'>;

const POLL_STEPS = [
  { key: 'idea_approved', label: 'Approved' },
  { key: 'building', label: 'Building' },
  { key: 'built_pending_test', label: 'Test' },
  { key: 'tested_approved', label: 'Approved' },
  { key: 'guide_ready', label: 'Guide' },
  { key: 'listed', label: 'Listed' },
  { key: 'published', label: 'Published' },
];

export default function BuildStatusScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const templateId = route.params.templateId;

  const { colors } = useTheme();
  const { getById, setBuildSheet, setNotionUrl } = useTemplates();
  const [refreshing, setRefreshing] = useState(false);

  const template = getById(templateId);
  const jobId = template?.n8nJobId;
  const hasBuild = Boolean(template?.buildSheet);

  const enabled = Boolean(jobId) && !hasBuild;

  const pollFn = useCallback(async () => {
    if (!jobId) return null;
    return pollBuildStatus(templateId, jobId);
  }, [jobId, templateId]);

  const polling = usePolling({
    fn: pollFn,
    enabled,
    intervalMs: 3000,
    shouldStop: (res) => res?.status === 'completed' || res?.status === 'failed',
    onResult: (res) => {
      if (!res) return;
      if (res.buildSheet) {
        setBuildSheet(templateId, res.buildSheet);
      }
      if (res.notionUrl) {
        setNotionUrl(templateId, res.notionUrl);
      }
      if (res.status === 'completed') {
        Alert.alert(
          'Build complete',
          'The Notion template has been created. Review the QA checklist next.',
          [
            { text: 'Later', style: 'cancel' },
            {
              text: 'Test now',
              onPress: () => navigation.navigate('TemplateTest', { id: templateId }),
            },
          ],
        );
      } else if (res.status === 'failed') {
        Alert.alert('Build failed', res.error ?? 'Unknown error.');
      }
    },
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await polling.refresh();
    } finally {
      setRefreshing(false);
    }
  };

  const currentStepIndex = useMemo(() => {
    if (!template) return 0;
    const idx = POLL_STEPS.findIndex((s) => s.key === template.stage);
    return idx === -1 ? 0 : idx;
  }, [template]);

  if (!template) {
    return (
      <Screen edges={['top']} padded={false}>
        <Header title="Build status" showBack />
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

  const progress = polling.data?.progress ?? (hasBuild ? 100 : 0);
  const statusMessage =
    polling.data?.message ??
    (hasBuild ? 'Build complete' : 'Waiting for n8n to respond…');

  return (
    <Screen edges={['top']} padded={false}>
      <Header
        title="Build status"
        subtitle={template.title}
        showBack
        right={[
          {
            icon: 'refresh-outline',
            onPress: () => {
              void polling.refresh();
            },
            accessibilityLabel: 'Refresh',
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
        <ProgressSteps steps={POLL_STEPS} currentIndex={currentStepIndex} />

        <Card>
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-text dark:text-dark-text text-sm font-semibold">
              Progress
            </Text>
            <Badge
              label={
                hasBuild
                  ? 'Completed'
                  : polling.data?.status === 'failed'
                  ? 'Failed'
                  : 'Building'
              }
              tone={
                hasBuild
                  ? 'success'
                  : polling.data?.status === 'failed'
                  ? 'danger'
                  : 'info'
              }
            />
          </View>

          <View className="h-2 bg-border dark:bg-dark-border rounded-full overflow-hidden">
            <View
              className="h-full rounded-full"
              style={{
                width: `${Math.max(2, progress)}%`,
                backgroundColor: colors.primary,
              }}
            />
          </View>

          <Text className="text-muted dark:text-dark-muted text-xs mt-3">
            {statusMessage}
          </Text>

          {jobId ? (
            <Text className="text-muted dark:text-dark-muted text-[11px] mt-1">
              Job ID: {jobId}
            </Text>
          ) : null}
        </Card>

        <SectionHeader title="Build summary" />
        <Card>
          <ListItem
            title="Databases"
            rightText={String(template.buildSheet?.totalDatabases ?? 0)}
            leading={<Ionicons name="albums-outline" size={18} color={colors.muted} />}
          />
          <View className="h-px bg-border dark:bg-border" />
          <ListItem
            title="Views"
            rightText={String(template.buildSheet?.totalViews ?? 0)}
            leading={<Ionicons name="grid-outline" size={18} color={colors.muted} />}
          />
          <View className="h-px bg-border dark:bg-border" />
          <ListItem
            title="Formulas"
            rightText={String(template.buildSheet?.totalFormulas ?? 0)}
            leading={<Ionicons name="calculator-outline" size={18} color={colors.muted} />}
          />
          <View className="h-px bg-border dark:bg-border" />
          <ListItem
            title="Estimated build time"
            rightText={
              template.buildSheet
                ? `${template.buildSheet.estimatedBuildMinutes} min`
                : '—'
            }
            leading={<Ionicons name="time-outline" size={18} color={colors.muted} />}
          />
          {template.notionUrl ? (
            <>
              <View className="h-px bg-border dark:bg-border" />
              <ListItem
                title="Notion page"
                subtitle={template.notionUrl}
                leading={
                  <Ionicons name="open-outline" size={18} color={colors.primary} />
                }
              />
            </>
          ) : null}
        </Card>

        {template.buildSheet && template.buildSheet.sections.length > 0 ? (
          <>
            <SectionHeader title={`Sections (${template.buildSheet.sections.length})`} />
            <Card padded={false}>
              {template.buildSheet.sections.map((s, idx) => (
                <View key={s.id} className="px-4">
                  <ListItem
                    title={s.title}
                    subtitle={s.description}
                    leading={
                      <View className="w-7 h-7 rounded-full bg-primary/15 items-center justify-center">
                        <Ionicons name="cube-outline" size={14} color={colors.primary} />
                      </View>
                    }
                    rightText={s.type}
                  />
                  {idx < template.buildSheet!.sections.length - 1 ? (
                    <View className="h-px bg-border dark:bg-border" />
                  ) : null}
                </View>
              ))}
            </Card>
          </>
        ) : null}

        <View className="mt-6 gap-3">
          {hasBuild ? (
            <Button
              title="Go to QA checklist"
              icon="clipboard-outline"
              variant="primary"
              fullWidth
              onPress={() => navigation.navigate('TemplateTest', { id: template.id })}
            />
          ) : (
            <Button
              title={polling.loading ? 'Polling…' : 'Refresh status'}
              icon="refresh-outline"
              variant="secondary"
              fullWidth
              loading={polling.loading}
              onPress={() => {
                void polling.refresh();
              }}
            />
          )}

          <Button
            title="View template details"
            icon="document-text-outline"
            variant="ghost"
            fullWidth
            onPress={() => navigation.navigate('TemplateDetail', { id: template.id })}
          />

          <Text className="text-muted dark:text-dark-muted text-[11px] text-center mt-2">
            Last update: {formatRelative(template.updatedAt)} • Stage:{' '}
            {TEMPLATE_STAGE_LABELS[template.stage]}
          </Text>
        </View>
      </ScrollView>
    </Screen>
  );
}