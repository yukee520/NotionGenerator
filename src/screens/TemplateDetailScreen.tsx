import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, Alert, ScrollView, RefreshControl, Linking } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Ionicons from 'react-native-vector-icons/Ionicons';

import Screen from '@/components/Screen';
import Header from '@/components/Header';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Badge, { BadgeTone } from '@/components/Badge';
import SectionHeader from '@/components/SectionHeader';
import ListItem from '@/components/ListItem';
import EmptyState from '@/components/EmptyState';
import ProgressSteps from '@/components/ProgressSteps';
import SyncStatusDot from '@/components/SyncStatusDot';
import CopyButton from '@/components/CopyButton';

import { useTemplates } from '@/hooks/useTemplates';
import { useMarketing } from '@/hooks/useMarketing';
import { useTheme } from '@/hooks/useTheme';

import type { RootStackParamList } from '@/navigation/types';
import type { TemplateStage } from '@/types/template';
import { TEMPLATE_STAGE_LABELS, TEMPLATE_STAGE_ORDER } from '@/types/template';
import { canGenerateGuide, canGeneratePricing, canGenerateListing } from '@/services/pipeline';
import { formatDateTime } from '@/utils/date';
import { formatCurrency } from '@/utils/format';
import { effectivePrice } from '@/utils/pricingHeuristic';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'TemplateDetail'>;

const STAGE_TONE: Record<TemplateStage, BadgeTone> = {
  idea_approved: 'info',
  building: 'warning',
  built_pending_test: 'warning',
  tested_approved: 'success',
  guide_ready: 'primary',
  listed: 'primary',
  published: 'success',
};

const PIPELINE_STEPS = TEMPLATE_STAGE_ORDER.map((stage) => ({
  key: stage,
  label: TEMPLATE_STAGE_LABELS[stage],
}));

export default function TemplateDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const templateId = route.params.id;

  const { colors } = useTheme();
  const { getById, markListed, markPublished } = useTemplates();
  const { stats: marketingStats } = useMarketing();
  const [refreshing, setRefreshing] = useState(false);

  const template = getById(templateId);

  const stageIndex = useMemo(
    () => (template ? TEMPLATE_STAGE_ORDER.indexOf(template.stage) : 0),
    [template],
  );

  const marketingCounts = useMemo(
    () => (template ? marketingStats(template.id) : undefined),
    [template, marketingStats],
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 400);
  }, []);

  if (!template) {
    return (
      <Screen edges={['top']} padded={false}>
        <Header title="Template" showBack />
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

  const price = effectivePrice(template.pricing);

  const handleOpenNotion = () => {
    if (template.notionUrl) void Linking.openURL(template.notionUrl);
  };

  const handleMarkListed = () => {
    Alert.alert('Mark as listed?', 'Confirm you have listed it on the marketplace.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Mark listed', onPress: () => markListed(template.id) },
    ]);
  };

  const handleMarkPublished = () => {
    Alert.alert(
      'Mark as published?',
      'Confirm you published the template on the marketplace. You will still need to click Publish in Notion manually.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Mark published', onPress: () => markPublished(template.id) },
      ],
    );
  };

  const primaryAction = () => {
    if (template.stage === 'idea_approved') {
      return (
        <Button
          title="Go to build status"
          icon="construct-outline"
          variant="primary"
          fullWidth
          onPress={() => navigation.navigate('BuildStatus', { templateId: template.id })}
        />
      );
    }
    if (template.stage === 'building') {
      return (
        <Button
          title="View build progress"
          icon="hourglass-outline"
          variant="primary"
          fullWidth
          onPress={() => navigation.navigate('BuildStatus', { templateId: template.id })}
        />
      );
    }
    if (template.stage === 'built_pending_test') {
      return (
        <Button
          title="Open QA checklist"
          icon="clipboard-outline"
          variant="primary"
          fullWidth
          onPress={() => navigation.navigate('TemplateTest', { id: template.id })}
        />
      );
    }
    if (template.stage === 'tested_approved') {
      const check = canGenerateGuide(template);
      return (
        <Button
          title="Generate buyer guide"
          icon="book-outline"
          variant="primary"
          fullWidth
          disabled={!check.allowed}
          onPress={() => navigation.navigate('Guide', { id: template.id })}
        />
      );
    }
    if (template.stage === 'guide_ready') {
      const check = canGenerateListing(template);
      return (
        <Button
          title="Create marketplace listing"
          icon="storefront-outline"
          variant="primary"
          fullWidth
          disabled={!check.allowed}
          onPress={() => navigation.navigate('Listing', { id: template.id })}
        />
      );
    }
    if (template.stage === 'listed') {
      return (
        <Button
          title="Mark as published"
          icon="checkmark-done-outline"
          variant="success"
          fullWidth
          onPress={handleMarkPublished}
        />
      );
    }
    return (
      <Button
        title="Generate marketing content"
        icon="megaphone-outline"
        variant="primary"
        fullWidth
        onPress={() =>
          navigation.navigate('MarketingList', { templateId: template.id })
        }
      />
    );
  };

  return (
    <Screen edges={['top']} padded={false}>
      <Header
        title="Template"
        subtitle={template.title}
        showBack
        right={[
          {
            icon: 'information-circle-outline',
            onPress: () =>
              Alert.alert(
                template.title,
                `Created: ${formatDateTime(template.createdAt)}\nUpdated: ${formatDateTime(
                  template.updatedAt,
                )}\nID: ${template.id}`,
              ),
            accessibilityLabel: 'Info',
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
        <ProgressSteps steps={PIPELINE_STEPS} currentIndex={stageIndex} />

        <Card>
          <View className="flex-row items-start justify-between mb-2">
            <Text className="text-text dark:text-dark-text text-base font-semibold flex-1 mr-2">
              {template.title}
            </Text>
            <SyncStatusDot status={template.syncStatus} withLabel />
          </View>

          <Text className="text-muted dark:text-dark-muted text-sm leading-5 mb-3">
            {template.oneLiner}
          </Text>

          <View className="flex-row flex-wrap gap-2">
            <Badge label={TEMPLATE_STAGE_LABELS[template.stage]} tone={STAGE_TONE[template.stage]} />
            <Badge label={template.marketplace.toUpperCase()} tone="primary" />
            {price !== undefined ? (
              <Badge label={formatCurrency(price, template.pricing?.currency ?? 'USD')} tone="success" />
            ) : null}
          </View>
        </Card>

        <SectionHeader title="Quick actions" />
        <View className="gap-3">
          {primaryAction()}

          {template.notionUrl ? (
            <Button
              title="Open in Notion"
              icon="open-outline"
              variant="secondary"
              fullWidth
              onPress={handleOpenNotion}
            />
          ) : null}
        </View>

        <SectionHeader title="Overview" />
        <Card>
          <ListItem
            title="Audience"
            rightText={template.audience || '—'}
            leading={<Ionicons name="people-outline" size={18} color={colors.muted} />}
          />
          <View className="h-px bg-border dark:bg-border" />
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
            title="QA pass rate"
            rightText={`${
              template.qaItems.length === 0
                ? 0
                : Math.round(
                    (template.qaItems.filter((q) => q.status === 'pass').length /
                      template.qaItems.length) *
                      100,
                  )
            }%`}
            leading={<Ionicons name="checkmark-circle-outline" size={18} color={colors.muted} />}
          />
        </Card>

        {template.pricing ? (
          <>
            <SectionHeader
              title="Pricing"
              actionLabel="Adjust"
              onAction={() => navigation.navigate('Pricing', { id: template.id })}
            />
            <Card>
              <View className="flex-row items-baseline mb-2">
                <Text className="text-text dark:text-dark-text text-2xl font-bold">
                  {formatCurrency(
                    effectivePrice(template.pricing) ?? 0,
                    template.pricing.currency,
                  )}
                </Text>
                {template.pricing.manualOverride !== undefined ? (
                  <Badge label="Manual" tone="warning" className="ml-2" />
                ) : (
                  <Badge label="Auto" tone="success" className="ml-2" />
                )}
              </View>
              <Text className="text-muted dark:text-dark-muted text-xs">
                Complexity score: {template.pricing.complexityScore}
              </Text>
            </Card>
          </>
        ) : canGeneratePricing(template).allowed ? (
          <>
            <SectionHeader title="Pricing" />
            <Card>
              <Text className="text-muted dark:text-dark-muted text-sm mb-3">
                No pricing yet. Generate one from your build complexity.
              </Text>
              <Button
                title="Generate pricing"
                icon="pricetag-outline"
                variant="primary"
                fullWidth
                onPress={() => navigation.navigate('Pricing', { id: template.id })}
              />
            </Card>
          </>
        ) : null}

        {template.guide ? (
          <>
            <SectionHeader
              title="Buyer guide"
              actionLabel="View"
              onAction={() => navigation.navigate('Guide', { id: template.id })}
            />
            <Card>
              <Text className="text-muted dark:text-dark-muted text-xs">
                Generated {formatDateTime(template.guideGeneratedAt)} •{' '}
                {template.guide.length} chars
              </Text>
              <View className="flex-row gap-2 mt-3">
                <CopyButton value={template.guide} label="Copy guide" />
                <Button
                  title="Open"
                  size="sm"
                  variant="ghost"
                  icon="open-outline"
                  onPress={() => navigation.navigate('Guide', { id: template.id })}
                />
              </View>
            </Card>
          </>
        ) : null}

        {template.listing ? (
          <>
            <SectionHeader
              title="Marketplace listing"
              actionLabel="Edit"
              onAction={() => navigation.navigate('Listing', { id: template.id })}
            />
            <Card>
              <Text className="text-text dark:text-dark-text text-sm font-semibold mb-1">
                {template.listing.title}
              </Text>
              <Text className="text-muted dark:text-dark-muted text-xs mb-2">
                {template.listing.tagline}
              </Text>
              {template.listing.bulletFeatures.slice(0, 3).map((b, i) => (
                <Text key={i} className="text-text dark:text-dark-text text-xs mb-1">
                  • {b}
                </Text>
              ))}
            </Card>
          </>
        ) : null}

        {marketingCounts && marketingCounts.total > 0 ? (
          <>
            <SectionHeader
              title={`Marketing (${marketingCounts.posted}/${marketingCounts.total} posted)`}
              actionLabel="Open"
              onAction={() =>
                navigation.navigate('MarketingList', { templateId: template.id })
              }
            />
            <Card>
              <View className="flex-row gap-2 flex-wrap">
                <Badge label={`${marketingCounts.draft} draft`} tone="warning" />
                <Badge label={`${marketingCounts.ready} ready`} tone="info" />
                <Badge label={`${marketingCounts.posted} posted`} tone="success" />
              </View>
            </Card>
          </>
        ) : template.stage === 'published' ? (
          <>
            <SectionHeader title="Marketing" />
            <Card>
              <Text className="text-muted dark:text-dark-muted text-sm mb-3">
                Ready to promote. Generate content for every channel.
              </Text>
              <Button
                title="Generate marketing content"
                icon="megaphone-outline"
                variant="primary"
                fullWidth
                onPress={() =>
                  navigation.navigate('MarketingList', { templateId: template.id })
                }
              />
            </Card>
          </>
        ) : null}

        {template.stage === 'guide_ready' ? (
          <View className="mt-6">
            <Button
              title="Mark as listed"
              icon="storefront-outline"
              variant="primary"
              fullWidth
              onPress={handleMarkListed}
            />
          </View>
        ) : null}

        {template.stage === 'published' ? (
          <>
            <SectionHeader title="Publishing" />
            <Card>
              <ListItem
                title="Published at"
                rightText={formatDateTime(template.publishedAt)}
                leading={<Ionicons name="time-outline" size={18} color={colors.muted} />}
              />
              {template.publishedUrl ? (
                <>
                  <View className="h-px bg-border dark:bg-border" />
                  <ListItem
                    title="Marketplace URL"
                    subtitle={template.publishedUrl}
                    leading={
                      <Ionicons name="link-outline" size={18} color={colors.primary} />
                    }
                    showChevron
                    onPress={() => void Linking.openURL(template.publishedUrl ?? '')}
                  />
                </>
              ) : null}
            </Card>
          </>
        ) : null}
      </ScrollView>
    </Screen>
  );
}