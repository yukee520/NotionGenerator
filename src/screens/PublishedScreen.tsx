import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, FlatList, RefreshControl, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Ionicons from 'react-native-vector-icons/Ionicons';

import Screen from '@/components/Screen';
import Header from '@/components/Header';
import Card from '@/components/Card';
import EmptyState from '@/components/EmptyState';
import Badge from '@/components/Badge';
import Button from '@/components/Button';

import { useTemplates } from '@/hooks/useTemplates';
import { useMarketing } from '@/hooks/useMarketing';
import { useTheme } from '@/hooks/useTheme';

import type { RootStackParamList } from '@/navigation/types';
import type { Template } from '@/types/template';
import { formatDate } from '@/utils/date';
import { formatCurrency } from '@/utils/format';
import { effectivePrice } from '@/utils/pricingHeuristic';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function PublishedScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const { items } = useTemplates();
  const { stats: marketingStats } = useMarketing();
  const [refreshing, setRefreshing] = useState(false);

  const published = useMemo(
    () => items.filter((t) => t.stage === 'published'),
    [items],
  );

  const totalRevenue = useMemo(
    () =>
      published.reduce((sum, t) => sum + (effectivePrice(t.pricing) ?? 0), 0),
    [published],
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 300);
  }, []);

  const renderItem = ({ item }: { item: Template }) => {
    const price = effectivePrice(item.pricing);
    const mkt = marketingStats(item.id);
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
          {price !== undefined ? (
            <Text className="text-success text-sm font-bold">
              {formatCurrency(price, item.pricing?.currency ?? 'USD')}
            </Text>
          ) : null}
        </View>

        <Text
          className="text-muted dark:text-dark-muted text-xs leading-5 mb-3"
          numberOfLines={2}
        >
          {item.oneLiner}
        </Text>

        <View className="flex-row flex-wrap items-center gap-2">
          <Badge
            label={`Published ${item.publishedAt ? formatDate(item.publishedAt) : ''}`}
            tone="success"
          />
          <Badge label={`${mkt.posted}/${mkt.total} posted`} tone="info" />
          <Badge label={item.marketplace.toUpperCase()} tone="neutral" />
        </View>

        {item.publishedUrl ? (
          <View className="mt-3 flex-row items-center">
            <Ionicons name="link-outline" size={14} color={colors.primary} />
            <Text
              className="text-primary text-[11px] ml-1.5 flex-1"
              numberOfLines={1}
              onPress={() => void Linking.openURL(item.publishedUrl ?? '')}
            >
              {item.publishedUrl}
            </Text>
          </View>
        ) : null}
      </Card>
    );
  };

  const keyExtractor = (item: Template) => item.id;

  return (
    <Screen edges={['top']} padded={false}>
      <Header
        title="Published"
        subtitle={`${published.length} templates • ${formatCurrency(totalRevenue)} total list value`}
        showBack
      />

      {published.length > 0 ? (
        <View className="px-4 pt-3">
          <Card>
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-muted dark:text-dark-muted text-xs">
                  Portfolio value
                </Text>
                <Text className="text-text dark:text-dark-text text-xl font-bold mt-0.5">
                  {formatCurrency(totalRevenue)}
                </Text>
              </View>
              <View className="w-12 h-12 rounded-full bg-success/15 items-center justify-center">
                <Ionicons name="trending-up-outline" size={22} color={colors.success} />
              </View>
            </View>
          </Card>
        </View>
      ) : null}

      <FlatList
        data={published}
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
          <EmptyState
            icon="checkmark-done-outline"
            title="No published templates"
            message="Once you publish a template, it will appear here with its listing and marketing status."
            actionLabel="Open templates"
            onAction={() => navigation.navigate('Tabs', { screen: 'Templates' })}
          />
        }
        ListFooterComponent={
          published.length > 0 ? (
            <View className="mt-4">
              <Button
                title="Back to all templates"
                variant="ghost"
                icon="arrow-back-outline"
                fullWidth
                onPress={() => navigation.navigate('Tabs', { screen: 'Templates' })}
              />
            </View>
          ) : null
        }
      />
    </Screen>
  );
}