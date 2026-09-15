import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, FlatList, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Ionicons from 'react-native-vector-icons/Ionicons';

import Screen from '@/components/Screen';
import Header from '@/components/Header';
import SearchBar from '@/components/SearchBar';
import FilterBar, { FilterOption } from '@/components/FilterBar';
import Card from '@/components/Card';
import EmptyState from '@/components/EmptyState';
import LoadingView from '@/components/LoadingView';
import Badge, { BadgeTone } from '@/components/Badge';
import SyncStatusDot from '@/components/SyncStatusDot';

import { usePainPoints } from '@/hooks/usePainPoints';
import { useSyncQueue } from '@/hooks/useSyncQueue';
import { useTheme } from '@/hooks/useTheme';

import type { RootStackParamList } from '@/navigation/types';
import type {
  PainPoint,
  PainPointSeverity,
  PainPointSource,
  PainPointStatus,
} from '@/types/painPoint';
import {
  PAIN_POINT_SEVERITY_LABELS,
  PAIN_POINT_SOURCE_LABELS,
} from '@/types/painPoint';
import { formatRelative } from '@/utils/date';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const SEVERITY_TONE: Record<PainPointSeverity, BadgeTone> = {
  low: 'info',
  medium: 'primary',
  high: 'warning',
  critical: 'danger',
};

const SOURCE_OPTIONS: FilterOption<PainPointSource>[] = [
  { value: 'reddit', label: 'Reddit' },
  { value: 'twitter', label: 'X / Twitter' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'forum', label: 'Forum' },
  { value: 'personal', label: 'Personal' },
  { value: 'other', label: 'Other' },
];

const SEVERITY_OPTIONS: FilterOption<PainPointSeverity>[] = [
  { value: 'low', label: 'Low', variant: 'info' },
  { value: 'medium', label: 'Medium', variant: 'primary' },
  { value: 'high', label: 'High', variant: 'warning' },
  { value: 'critical', label: 'Critical', variant: 'danger' },
];

const STATUS_OPTIONS: FilterOption<PainPointStatus>[] = [
  { value: 'inbox', label: 'Inbox' },
  { value: 'used', label: 'Used' },
  { value: 'archived', label: 'Archived' },
];

export default function PainPointListScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const { filtered, filter, stats, setFilter, resetFilter } = usePainPoints();
  const { runNow } = useSyncQueue();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await runNow();
    } finally {
      setRefreshing(false);
    }
  }, [runNow]);

  const toggleSource = (value: PainPointSource) => {
    const has = filter.sources.includes(value);
    setFilter({
      sources: has
        ? filter.sources.filter((v) => v !== value)
        : [...filter.sources, value],
    });
  };

  const toggleSeverity = (value: PainPointSeverity) => {
    const has = filter.severities.includes(value);
    setFilter({
      severities: has
        ? filter.severities.filter((v) => v !== value)
        : [...filter.severities, value],
    });
  };

  const toggleStatus = (value: PainPointStatus) => {
    const has = filter.statuses.includes(value);
    setFilter({
      statuses: has
        ? filter.statuses.filter((v) => v !== value)
        : [...filter.statuses, value],
    });
  };

  const hasFilters = useMemo(
    () =>
      filter.search.length > 0 ||
      filter.sources.length > 0 ||
      filter.severities.length > 0 ||
      filter.statuses.length > 0,
    [filter],
  );

  const renderItem = ({ item }: { item: PainPoint }) => (
    <Card
      onPress={() => navigation.navigate('PainPointDetail', { id: item.id })}
      className="mb-3"
    >
      <View className="flex-row items-start justify-between mb-2">
        <Text
          className="text-text dark:text-dark-text text-sm font-semibold flex-1 mr-2"
          numberOfLines={2}
        >
          {item.title}
        </Text>
        <SyncStatusDot status={item.syncStatus} />
      </View>

      <Text
        className="text-muted dark:text-dark-muted text-xs leading-5 mb-3"
        numberOfLines={2}
      >
        {item.description}
      </Text>

      <View className="flex-row flex-wrap items-center gap-2">
        <Badge
          label={PAIN_POINT_SEVERITY_LABELS[item.severity]}
          tone={SEVERITY_TONE[item.severity]}
        />
        <Badge label={PAIN_POINT_SOURCE_LABELS[item.source]} tone="neutral" />
        {item.topic ? <Badge label={item.topic} tone="info" /> : null}
      </View>

      <View className="flex-row items-center justify-between mt-3">
        <Text className="text-muted dark:text-dark-muted text-[11px]">
          {formatRelative(item.createdAt)}
        </Text>
        {item.status !== 'inbox' ? (
          <Badge
            label={item.status === 'used' ? 'Used' : 'Archived'}
            tone={item.status === 'used' ? 'success' : 'neutral'}
          />
        ) : null}
      </View>
    </Card>
  );

  const keyExtractor = (item: PainPoint) => item.id;

  return (
    <Screen edges={['top']} padded={false}>
      <Header
        title="Pain Points"
        subtitle={`${stats.total} total • ${stats.inbox} inbox`}
        right={[
          {
            icon: 'archive-outline',
            onPress: () => navigation.navigate('Published'),
            accessibilityLabel: 'Published',
          },
        ]}
      />

      <View className="px-4 pt-3">
        <SearchBar
          value={filter.search}
          onChange={(text) => setFilter({ search: text })}
          placeholder="Search pain points…"
        />
      </View>

      <View className="px-4">
        <FilterBar
          options={STATUS_OPTIONS}
          selected={filter.statuses}
          onToggle={toggleStatus}
          onClear={hasFilters ? resetFilter : undefined}
        />
        <FilterBar
          options={SEVERITY_OPTIONS}
          selected={filter.severities}
          onToggle={toggleSeverity}
        />
        <FilterBar
          options={SOURCE_OPTIONS}
          selected={filter.sources}
          onToggle={toggleSource}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={
          hasFilters ? (
            <EmptyState
              icon="search-outline"
              title="No matches"
              message="Try clearing filters or adjusting your search."
              actionLabel="Clear filters"
              onAction={resetFilter}
            />
          ) : (
            <EmptyState
              icon="bulb-outline"
              title="No pain points yet"
              message="Capture a pain point you've noticed to get started."
              actionLabel="Add pain point"
              onAction={() => navigation.navigate('PainPointForm', { id: undefined })}
            />
          )
        }
      />

      <View
        className="absolute bottom-6 right-5"
        style={{ elevation: 6 }}
      >
        <View className="bg-primary rounded-full w-14 h-14 items-center justify-center">
          <Ionicons
            name="add"
            size={26}
            color="#FFFFFF"
            onPress={() => navigation.navigate('PainPointForm', { id: undefined })}
          />
        </View>
      </View>
    </Screen>
  );
}

export { LoadingView };