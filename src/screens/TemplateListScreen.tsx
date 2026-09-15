import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, FlatList, RefreshControl } from 'react-native';
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
import Button from '@/components/Button';

import { useTemplates } from '@/hooks/useTemplates';
import { useSyncQueue } from '@/hooks/useSyncQueue';
import { useTheme } from '@/hooks/useTheme';

import type { RootStackParamList } from '@/navigation/types';
import type { Template, TemplateStage } from '@/types/template';
import { TEMPLATE_STAGE_LABELS, TEMPLATE_STAGE_ORDER } from '@/types/template';
import { formatRelative } from '@/utils/date';
import { formatCurrency } from '@/utils/format';
import { effectivePrice } from '@/utils/pricingHeuristic';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const STAGE_TONE: Record<TemplateStage, BadgeTone> = {
  idea_approved: 'info',
  building: 'warning',
  built_pending_test: 'warning',
  tested_approved: 'success',
  guide_ready: 'primary',
  listed: 'primary',
  published: 'success',
};

const STAGE_OPTIONS: FilterOption<TemplateStage>[] = TEMPLATE_STAGE_ORDER.map((s) => ({
  value: s,
  label: TEMPLATE_STAGE_LABELS[s],
}));

export default function TemplateListScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const { filtered, filter, stats, setFilter, resetFilter } = useTemplates();
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

  const toggleStage = (value: TemplateStage) => {
    const has = filter.stages.includes(value);
    setFilter({
      stages: has ? filter.stages.filter((v) => v !== value) : [...filter.stages, value],
    });
  };

  const renderItem = ({ item }: { item: Template }) => {
    const price = effectivePrice(item.pricing);
    return (
      <Card
        onPress={() => navigation.navigate('TemplateDetail', { id: item.id })}
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
          {item.oneLiner}
        </Text>

        <View className="flex-row flex-wrap items-center gap-2">
          <Badge
            label={TEMPLATE_STAGE_LABELS[item.stage]}
            tone={STAGE_TONE[item.stage]}
          />
          {price !== undefined ? (
            <Badge
              label={formatCurrency(price, item.pricing?.currency ?? 'USD')}
              tone="success"
            />
          ) : null}
          {item.qaItems.length > 0 ? (
            <Badge
              label={`${item.qaItems.filter((q) => q.status === 'pass').length}/${item.qaItems.length} QA`}
              tone="neutral"
            />
          ) : null}
        </View>

        <View className="flex-row items-center justify-between mt-3">
          <Text className="text-muted dark:text-dark-muted text-[11px]">
            {formatRelative(item.updatedAt)}
          </Text>
          <Text className="text-muted dark:text-dark-muted text-[11px]">
            {item.marketplace.toUpperCase()}
          </Text>
        </View>
      </Card>
    );
  };

  const keyExtractor = (item: Template) => item.id;
  const hasFilters = filter.search.length > 0 || filter.stages.length > 0;

  const totalPublished = stats.byStage.published;

  return (
    <Screen edges={['top']} padded={false}>
      <Header
        title="Templates"
        subtitle={`${stats.total} total • ${totalPublished} published`}
        right={[
          {
            icon: 'checkmark-done-outline',
            onPress: () => navigation.navigate('Published'),
            accessibilityLabel: 'Published templates',
          },
        ]}
      />

      <View className="px-4 pt-3">
        <SearchBar
          value={filter.search}
          onChange={(text) => setFilter({ search: text })}
          placeholder="Search templates…"
        />
      </View>

      <View className="px-4">
        <FilterBar
          options={STAGE_OPTIONS}
          selected={filter.stages}
          onToggle={toggleStage}
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
              icon="document-text-outline"
              title="No templates yet"
              message="Approve an idea to start building a template."
              actionLabel="Open ideas"
              onAction={() =>
                navigation.navigate('Tabs', { screen: 'Ideas' })
              }
            />
          )
        }
        ListFooterComponent={
          filtered.length > 0 && !hasFilters ? (
            <View className="mt-3">
              <Button
                title="View published"
                variant="ghost"
                icon="checkmark-done-outline"
                fullWidth
                onPress={() => navigation.navigate('Published')}
              />
            </View>
          ) : null
        }
      />
    </Screen>
  );
}