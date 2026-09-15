import React, { useCallback, useMemo } from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Ionicons from 'react-native-vector-icons/Ionicons';

import Screen from '@/components/Screen';
import Header from '@/components/Header';
import StatCard from '@/components/StatCard';
import Card from '@/components/Card';
import Button from '@/components/Button';
import SectionHeader from '@/components/SectionHeader';
import ListItem from '@/components/ListItem';
import SyncStatusDot from '@/components/SyncStatusDot';
import Badge from '@/components/Badge';

import { useTheme } from '@/hooks/useTheme';
import { usePainPoints } from '@/hooks/usePainPoints';
import { useIdeas } from '@/hooks/useIdeas';
import { useTemplates } from '@/hooks/useTemplates';
import { useSyncQueue } from '@/hooks/useSyncQueue';
import { useSettings } from '@/hooks/useSettings';
import { useNetInfo } from '@/hooks/useNetInfo';

import type { RootStackParamList } from '@/navigation/types';
import { formatRelative } from '@/utils/date';
import { TEMPLATE_STAGE_LABELS } from '@/types/template';
import { IDEA_STATUS_LABELS } from '@/types/idea';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function DashboardScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const { stats: painPointStats, items: painPoints } = usePainPoints();
  const { stats: ideaStats, items: ideas } = useIdeas();
  const { stats: templateStats, items: templates } = useTemplates();
  const { pending: syncPending, failed: syncFailed, runNow } = useSyncQueue();
  const { settings, checkHealth } = useSettings();
  const { isConnected } = useNetInfo();
  const [refreshing, setRefreshing] = React.useState(false);

  const recent = useMemo(() => {
    const combined = [
      ...painPoints.slice(0, 3).map((p) => ({
        id: p.id,
        type: 'painPoint' as const,
        title: p.title,
        subtitle: `Pain point • ${formatRelative(p.createdAt)}`,
        syncStatus: p.syncStatus,
      })),
      ...ideas.slice(0, 3).map((i) => ({
        id: i.id,
        type: 'idea' as const,
        title: i.title,
        subtitle: `Idea • ${IDEA_STATUS_LABELS[i.status]} • ${formatRelative(i.createdAt)}`,
        syncStatus: i.syncStatus,
      })),
      ...templates.slice(0, 3).map((t) => ({
        id: t.id,
        type: 'template' as const,
        title: t.title,
        subtitle: `Template • ${TEMPLATE_STAGE_LABELS[t.stage]} • ${formatRelative(t.updatedAt)}`,
        syncStatus: t.syncStatus,
      })),
    ];
    return combined.slice(0, 6);
  }, [painPoints, ideas, templates]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await runNow();
      await checkHealth();
    } finally {
      setRefreshing(false);
    }
  }, [runNow, checkHealth]);

  const openRecent = (item: (typeof recent)[number]) => {
    if (item.type === 'painPoint') navigation.navigate('PainPointDetail', { id: item.id });
    else if (item.type === 'idea') navigation.navigate('IdeaDetail', { id: item.id });
    else navigation.navigate('TemplateDetail', { id: item.id });
  };

  const healthOk = settings.lastHealthCheckOk;

  return (
    <Screen edges={['top']} padded={false}>
      <Header
        title="Dashboard"
        subtitle={isConnected ? 'Online' : 'Offline'}
        right={[
          {
            icon: 'settings-outline',
            onPress: () => navigation.navigate('Settings'),
            accessibilityLabel: 'Settings',
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
        <View className="flex-row mb-3">
          <StatCard
            label="Pain Points"
            value={painPointStats.total}
            icon="bulb-outline"
            tint="#F59E0B"
            onPress={() => navigation.navigate('Tabs', { screen: 'PainPoints' })}
          />
          <View className="w-3" />
          <StatCard
            label="Ideas"
            value={ideaStats.total}
            icon="sparkles-outline"
            tint="#8B5CF6"
            onPress={() => navigation.navigate('Tabs', { screen: 'Ideas' })}
          />
          <View className="w-3" />
          <StatCard
            label="Templates"
            value={templateStats.total}
            icon="document-text-outline"
            tint="#2563EB"
            onPress={() => navigation.navigate('Tabs', { screen: 'Templates' })}
          />
        </View>

        <SectionHeader title="Pipeline" />
        <Card>
          <ListItem
            title="Ideas in draft"
            subtitle="Waiting for review"
            leading={
              <View className="w-9 h-9 rounded-lg bg-primary/15 items-center justify-center">
                <Ionicons name="create-outline" size={18} color={colors.primary} />
              </View>
            }
            rightText={String(ideaStats.draft)}
            showChevron
            onPress={() => navigation.navigate('Tabs', { screen: 'Ideas' })}
          />
          <ListItem
            title="Templates in build"
            subtitle="Being generated"
            leading={
              <View className="w-9 h-9 rounded-lg bg-warning/15 items-center justify-center">
                <Ionicons name="construct-outline" size={18} color={colors.warning} />
              </View>
            }
            rightText={String(templateStats.byStage.building + templateStats.byStage.idea_approved)}
            showChevron
            onPress={() => navigation.navigate('Tabs', { screen: 'Templates' })}
          />
          <ListItem
            title="Pending test"
            subtitle="Waiting for QA"
            leading={
              <View className="w-9 h-9 rounded-lg bg-danger/15 items-center justify-center">
                <Ionicons name="clipboard-outline" size={18} color={colors.danger} />
              </View>
            }
            rightText={String(templateStats.byStage.built_pending_test)}
            showChevron
            onPress={() => navigation.navigate('Tabs', { screen: 'Templates' })}
          />
          <ListItem
            title="Published"
            subtitle="Live on marketplace"
            leading={
              <View className="w-9 h-9 rounded-lg bg-success/15 items-center justify-center">
                <Ionicons name="checkmark-circle-outline" size={18} color={colors.success} />
              </View>
            }
            rightText={String(templateStats.byStage.published)}
            showChevron
            onPress={() => navigation.navigate('Published')}
          />
        </Card>

        <SectionHeader title="Sync" />
        <Card>
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Ionicons
                name={healthOk ? 'cloud-done-outline' : 'cloud-offline-outline'}
                size={20}
                color={healthOk ? colors.success : colors.muted}
              />
              <View className="ml-3">
                <Text className="text-text dark:text-dark-text text-sm font-medium">
                  n8n connection
                </Text>
                <Text className="text-muted dark:text-dark-muted text-xs mt-0.5">
                  {settings.n8nWebhookUrl
                    ? healthOk
                      ? `Last checked ${formatRelative(settings.lastHealthCheckAt)}`
                      : 'Not reachable'
                    : 'Not configured'}
                </Text>
              </View>
            </View>
            <Badge
              label={healthOk ? 'Online' : 'Offline'}
              tone={healthOk ? 'success' : 'danger'}
            />
          </View>

          <View className="flex-row items-center justify-between mt-4">
            <View>
              <Text className="text-text dark:text-dark-text text-sm font-medium">
                Sync queue
              </Text>
              <Text className="text-muted dark:text-dark-muted text-xs mt-0.5">
                {syncPending} pending • {syncFailed} failed
              </Text>
            </View>
            <Button
              title="Sync now"
              size="sm"
              variant="secondary"
              icon="sync-outline"
              onPress={() => {
                void runNow();
              }}
            />
          </View>
        </Card>

        <SectionHeader
          title="Recent activity"
          actionLabel={recent.length > 0 ? 'See all' : undefined}
          onAction={
            recent.length > 0
              ? () => navigation.navigate('Tabs', { screen: 'PainPoints' })
              : undefined
          }
        />
        {recent.length === 0 ? (
          <Card>
            <Text className="text-muted dark:text-dark-muted text-sm text-center py-4">
              No activity yet. Start by capturing a pain point.
            </Text>
          </Card>
        ) : (
          <Card padded={false}>
            {recent.map((item, idx) => (
              <View key={`${item.type}-${item.id}`} className="px-4">
                <ListItem
                  title={item.title}
                  subtitle={item.subtitle}
                  rightText={undefined}
                  trailing={<SyncStatusDot status={item.syncStatus} />}
                  onPress={() => openRecent(item)}
                />
                {idx < recent.length - 1 ? (
                  <View className="h-px bg-border dark:bg-dark-border" />
                ) : null}
              </View>
            ))}
          </Card>
        )}

        <View className="mt-6">
          <Button
            title="Quick capture pain point"
            icon="add-circle-outline"
            variant="primary"
            fullWidth
            onPress={() => navigation.navigate('PainPointForm', { id: undefined })}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}