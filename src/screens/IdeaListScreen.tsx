import React, { useCallback, useState } from 'react';
import { View, FlatList, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import Screen from '@/components/Screen';
import Header from '@/components/Header';
import SearchBar from '@/components/SearchBar';
import FilterBar, { FilterOption } from '@/components/FilterBar';
import Card from '@/components/Card';
import EmptyState from '@/components/EmptyState';
import Badge, { BadgeTone } from '@/components/Badge';
import SyncStatusDot from '@/components/SyncStatusDot';

import { useIdeas } from '@/hooks/useIdeas';
import { useSyncQueue } from '@/hooks/useSyncQueue';
import { useTheme } from '@/hooks/useTheme';

import type { RootStackParamList } from '@/navigation/types';
import type { Idea, IdeaStatus } from '@/types/idea';
import { IDEA_STATUS_LABELS } from '@/types/idea';
import { formatRelative } from '@/utils/date';
import { truncate } from '@/utils/format';
import { Text } from 'react-native';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const STATUS_TONE: Record<IdeaStatus, BadgeTone> = {
  draft: 'info',
  approved: 'success',
  rejected: 'danger',
};

const STATUS_OPTIONS: FilterOption<IdeaStatus>[] = [
  { value: 'draft', label: 'Draft', variant: 'info' },
  { value: 'approved', label: 'Approved', variant: 'success' },
  { value: 'rejected', label: 'Rejected', variant: 'danger' },
];

export default function IdeaListScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const { filtered, filter, stats, setFilter, resetFilter } = useIdeas();
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

  const toggleStatus = (value: IdeaStatus) => {
    const has = filter.statuses.includes(value);
    setFilter({
      statuses: has
        ? filter.statuses.filter((v) => v !== value)
        : [...filter.statuses, value],
    });
  };

  const renderItem = ({ item }: { item: Idea }) => (
    <Card
      onPress={() => navigation.navigate('IdeaDetail', { id: item.id })}
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
        {truncate(item.oneLiner, 140)}
      </Text>

      <View className="flex-row flex-wrap items-center gap-2">
        <Badge label={IDEA_STATUS_LABELS[item.status]} tone={STATUS_TONE[item.status]} />
        <Badge label={`${item.proposedSections.length} sections`} tone="neutral" />
        <Badge
          label={item.generatedBy === 'n8n' ? 'AI' : 'Local'}
          tone={item.generatedBy === 'n8n' ? 'primary' : 'neutral'}
        />
      </View>

      <View className="flex-row items-center justify-between mt-3">
        <Text className="text-muted dark:text-dark-muted text-[11px]">
          {formatRelative(item.createdAt)}
        </Text>
        <Text className="text-muted dark:text-dark-muted text-[11px]">
          {item.audience}
        </Text>
      </View>
    </Card>
  );

  const keyExtractor = (item: Idea) => item.id;
  const hasFilters = filter.search.length > 0 || filter.statuses.length > 0;

  return (
    <Screen edges={['top']} padded={false}>
      <Header
        title="Ideas"
        subtitle={`${stats.total} total • ${stats.draft} draft • ${stats.approved} approved`}
      />

      <View className="px-4 pt-3">
        <SearchBar
          value={filter.search}
          onChange={(text) => setFilter({ search: text })}
          placeholder="Search ideas…"
        />
      </View>

      <View className="px-4">
        <FilterBar
          options={STATUS_OPTIONS}
          selected={filter.statuses}
          onToggle={toggleStatus}
          onClear={hasFilters ? resetFilter : undefined}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
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
        ListEmptyComponent={
          hasFilters ? (
            <EmptyState
              icon="search-outline"
              title="No matches"
              message="Try adjusting your filters."
              actionLabel="Clear filters"
              onAction={resetFilter}
            />
          ) : (
            <EmptyState
              icon="sparkles-outline"
              title="No ideas yet"
              message="Generate ideas from a pain point to get started."
              actionLabel="Open pain points"
              onAction={() =>
                navigation.navigate('Tabs', { screen: 'PainPoints' })
              }
            />
          )
        }
      />
    </Screen>
  );
}