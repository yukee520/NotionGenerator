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
import Badge from '@/components/Badge';
import SectionHeader from '@/components/SectionHeader';
import EmptyState from '@/components/EmptyState';
import CopyButton from '@/components/CopyButton';
import ShareButton from '@/components/ShareButton';
import ListItem from '@/components/ListItem';

import { useTemplates } from '@/hooks/useTemplates';
import { useTheme } from '@/hooks/useTheme';

import type { RootStackParamList } from '@/navigation/types';
import type { GenerateListingRequest, ListingCopy } from '@/types/n8n';
import { generateListing } from '@/api/n8n';
import { useSettingsStore } from '@/store/useSettingsStore';
import { logEvent } from '@/services/sheetLogger';
import { userMessage } from '@/api/errors';
import { formatCurrency } from '@/utils/format';
import { effectivePrice } from '@/utils/pricingHeuristic';
import { canGenerateListing } from '@/services/pipeline';
import { nowIso } from '@/utils/date';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'Listing'>;

function buildLocalListing(args: {
  title: string;
  oneLiner: string;
  audience: string;
  features: string[];
  price: number;
  currency: string;
}): ListingCopy {
  return {
    title: `${args.title} — Notion Template`,
    tagline: args.oneLiner,
    bulletFeatures: args.features.length
      ? args.features.map((f) => `${f} — ready to use`)
      : [
          'Plug-and-play dashboard',
          'Auto-generated sample data',
          'Mobile-friendly views',
          'Weekly review workflow',
        ],
    targetBuyer: args.audience,
    callToAction: `Get instant access for ${formatCurrency(args.price, args.currency)}. Duplicate in one click.`,
    generatedAt: nowIso(),
  };
}

export default function ListingScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const templateId = route.params.id;

  const { colors } = useTheme();
  const { getById, setListing, markPublished } = useTemplates();

  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState('');

  const template = getById(templateId);
  const listing = template?.listing;

  const [draft, setDraft] = useState<ListingCopy | undefined>(listing);

  useEffect(() => {
    setDraft(listing);
  }, [listing]);

  const features = useMemo(() => {
    if (!template?.buildSheet) return [];
    return template.buildSheet.sections
      .filter((s) => s.type === 'database' || s.type === 'page')
      .map((s) => s.title);
  }, [template]);

  const price = effectivePrice(template?.pricing);

  const handleGenerate = async () => {
    if (!template) return;
    const check = canGenerateListing(template);
    if (!check.allowed) {
      Alert.alert('Cannot generate', check.reason ?? 'Complete previous steps first.');
      return;
    }
    setBusy(true);
    try {
      const settings = useSettingsStore.getState().settings;
      const localPrice = price ?? 9;
      const localCurrency = template.pricing?.currency ?? 'USD';

      if (settings.n8nWebhookUrl) {
        try {
          const body: GenerateListingRequest = {
            templateId: template.id,
            title: template.title,
            oneLiner: template.oneLiner,
            audience: template.audience,
            features,
            price: localPrice,
            currency: localCurrency,
          };
          const res = await generateListing(settings, body);
          const copy: ListingCopy = {
            title: res.title,
            tagline: res.tagline,
            bulletFeatures: res.bulletFeatures,
            targetBuyer: res.targetBuyer,
            callToAction: res.callToAction,
            generatedAt: res.generatedAt ?? nowIso(),
          };
          setListing(template.id, copy);
          void logEvent({
            eventType: 'listing',
            entityId: template.id,
            title: template.title,
            stage: 'listed',
            status: 'generated',
            payload: { source: 'n8n', price: localPrice, currency: localCurrency },
          });
        } catch (err) {
          const message = userMessage(err);
          const copy = buildLocalListing({
            title: template.title,
            oneLiner: template.oneLiner,
            audience: template.audience,
            features,
            price: localPrice,
            currency: localCurrency,
          });
          setListing(template.id, copy);
          Alert.alert('n8n unavailable', `Generated a local listing.\n\n${message}`);
        }
      } else {
        const copy = buildLocalListing({
          title: template.title,
          oneLiner: template.oneLiner,
          audience: template.audience,
          features,
          price: localPrice,
          currency: localCurrency,
        });
        setListing(template.id, copy);
        void logEvent({
          eventType: 'listing',
          entityId: template.id,
          title: template.title,
          stage: 'listed',
          status: 'local',
          payload: { source: 'local', price: localPrice },
        });
      }
    } finally {
      setBusy(false);
    }
  };

  const handleSaveEdits = () => {
    if (!template || !draft) return;
    setListing(template.id, { ...draft, generatedAt: nowIso() });
    setEditing(false);
  };

  const handlePublish = () => {
    if (!template) return;
    Alert.alert(
      'Mark as published?',
      'Confirm you have published this template on the marketplace.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark published',
          onPress: () => {
            markPublished(template.id, publishedUrl.trim() || undefined);
            void logEvent({
              eventType: 'published',
              entityId: template.id,
              title: template.title,
              stage: 'published',
              status: 'published',
              payload: {
                price: price ?? 0,
                currency: template.pricing?.currency ?? 'USD',
                publishedUrl: publishedUrl.trim() || null,
              },
            });
            navigation.navigate('Published');
          },
        },
      ],
    );
  };

  if (!template) {
    return (
      <Screen edges={['top']} padded={false}>
        <Header title="Listing" showBack />
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

  const listingText = listing
    ? [
        listing.title,
        '',
        listing.tagline,
        '',
        ...listing.bulletFeatures.map((b) => `• ${b}`),
        '',
        listing.callToAction,
      ].join('\n')
    : '';

  return (
    <Screen edges={['top']} padded={false}>
      <Header
        title="Marketplace listing"
        subtitle={template.title}
        showBack
        right={
          listing && !editing
            ? [
                {
                  icon: 'create-outline',
                  onPress: () => setEditing(true),
                  accessibilityLabel: 'Edit',
                },
                {
                  icon: 'refresh-outline',
                  onPress: () =>
                    Alert.alert('Regenerate?', 'This will replace the current listing.', [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Regenerate', onPress: () => void handleGenerate() },
                    ]),
                  accessibilityLabel: 'Regenerate',
                },
              ]
            : editing
            ? [
                {
                  icon: 'checkmark',
                  onPress: handleSaveEdits,
                  accessibilityLabel: 'Save',
                },
              ]
            : undefined
        }
      />

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {!listing ? (
          <Card>
            <View className="items-center py-6">
              <View className="w-14 h-14 rounded-full bg-primary/15 items-center justify-center mb-3">
                <Ionicons name="storefront-outline" size={24} color={colors.primary} />
              </View>
              <Text className="text-text dark:text-dark-text text-sm font-semibold text-center">
                No listing yet
              </Text>
              <Text className="text-muted dark:text-dark-muted text-xs text-center mt-1 mb-4 px-4">
                Generate a marketplace listing draft with a title, tagline, feature bullets,
                and call to action.
              </Text>
              <Button
                title={busy ? 'Generating…' : 'Generate listing'}
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
              label="Title"
              value={draft.title}
              onChangeText={(v) => setDraft((p) => (p ? { ...p, title: v } : p))}
            />
            <TextArea
              label="Tagline"
              value={draft.tagline}
              onChangeText={(v) => setDraft((p) => (p ? { ...p, tagline: v } : p))}
              minHeight={70}
            />
            <Input
              label="Target buyer"
              value={draft.targetBuyer}
              onChangeText={(v) => setDraft((p) => (p ? { ...p, targetBuyer: v } : p))}
            />
            <TextArea
              label="Call to action"
              value={draft.callToAction}
              onChangeText={(v) => setDraft((p) => (p ? { ...p, callToAction: v } : p))}
              minHeight={70}
            />
            <SectionHeader title="Feature bullets" />
            {draft.bulletFeatures.map((b, idx) => (
              <Input
                key={idx}
                value={b}
                onChangeText={(v) =>
                  setDraft((p) => {
                    if (!p) return p;
                    const next = [...p.bulletFeatures];
                    next[idx] = v;
                    return { ...p, bulletFeatures: next };
                  })
                }
                placeholder={`Feature ${idx + 1}`}
              />
            ))}
            <Button
              title="Add bullet"
              variant="ghost"
              icon="add"
              onPress={() =>
                setDraft((p) =>
                  p ? { ...p, bulletFeatures: [...p.bulletFeatures, ''] } : p,
                )
              }
            />
          </>
        ) : (
          <>
            <Card>
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-text dark:text-dark-text text-sm font-semibold">
                  Draft
                </Text>
                <Badge
                  label={price !== undefined ? formatCurrency(price, template.pricing?.currency ?? 'USD') : 'No price'}
                  tone={price !== undefined ? 'success' : 'warning'}
                />
              </View>

              <Text className="text-text dark:text-dark-text text-base font-bold mb-1">
                {listing.title}
              </Text>
              <Text className="text-muted dark:text-dark-muted text-sm mb-3">
                {listing.tagline}
              </Text>

              <View className="mb-3">
                {listing.bulletFeatures.map((b, i) => (
                  <View key={i} className="flex-row items-start mb-1.5">
                    <Ionicons
                      name="checkmark-circle"
                      size={14}
                      color={colors.success}
                      style={{ marginTop: 3 }}
                    />
                    <Text className="text-text dark:text-dark-text text-xs ml-2 flex-1 leading-5">
                      {b}
                    </Text>
                  </View>
                ))}
              </View>

              <Text className="text-text dark:text-dark-text text-xs font-medium mb-1">
                Target buyer
              </Text>
              <Text className="text-muted dark:text-dark-muted text-xs mb-3">
                {listing.targetBuyer}
              </Text>

              <Text className="text-primary text-xs font-semibold">
                {listing.callToAction}
              </Text>

              <View className="flex-row gap-2 mt-4 flex-wrap">
                <CopyButton value={listingText} label="Copy full listing" />
                <ShareButton
                  title={`${listing.title}`}
                  message={listingText}
                  label="Share"
                />
              </View>
            </Card>

            <SectionHeader title="Publish" />
            <Card>
              <Input
                label="Marketplace URL (optional)"
                value={publishedUrl}
                onChangeText={setPublishedUrl}
                placeholder="https://..."
                autoCapitalize="none"
                keyboardType="url"
                hint="Paste the public listing link once you've published it."
              />

              <View className="mt-3">
                <Button
                  title="Mark as published"
                  icon="checkmark-done-outline"
                  variant="success"
                  fullWidth
                  onPress={handlePublish}
                />
              </View>

              <View className="mt-4 p-3 rounded-lg bg-warning/15 border border-warning/30">
                <View className="flex-row items-start">
                  <Ionicons
                    name="information-circle-outline"
                    size={16}
                    color={colors.warning}
                    style={{ marginTop: 1 }}
                  />
                  <Text className="text-warning text-[11px] ml-2 flex-1 leading-5">
                    Notion does not allow publishing to the marketplace via API. You must
                    click Publish in Notion manually, then come back and mark it here.
                  </Text>
                </View>
              </View>
            </Card>

            <SectionHeader title="Checklist" />
            <Card>
              <ListItem
                title="Guide generated"
                rightText={template.guide ? 'Yes' : 'No'}
                leading={
                  <Ionicons
                    name={template.guide ? 'checkmark-circle' : 'ellipse-outline'}
                    size={18}
                    color={template.guide ? colors.success : colors.muted}
                  />
                }
              />
              <View className="h-px bg-border dark:bg-border" />
              <ListItem
                title="Pricing set"
                rightText={template.pricing ? 'Yes' : 'No'}
                leading={
                  <Ionicons
                    name={template.pricing ? 'checkmark-circle' : 'ellipse-outline'}
                    size={18}
                    color={template.pricing ? colors.success : colors.muted}
                  />
                }
              />
              <View className="h-px bg-border dark:bg-border" />
              <ListItem
                title="Listing drafted"
                rightText={listing ? 'Yes' : 'No'}
                leading={
                  <Ionicons
                    name={listing ? 'checkmark-circle' : 'ellipse-outline'}
                    size={18}
                    color={listing ? colors.success : colors.muted}
                  />
                }
              />
            </Card>

            <View className="mt-6">
              <Button
                title="Regenerate listing"
                icon="refresh-outline"
                variant="secondary"
                fullWidth
                loading={busy}
                onPress={handleGenerate}
              />
            </View>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}