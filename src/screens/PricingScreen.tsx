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
import Badge from '@/components/Badge';
import SectionHeader from '@/components/SectionHeader';
import EmptyState from '@/components/EmptyState';
import ListItem from '@/components/ListItem';

import { useTemplates } from '@/hooks/useTemplates';
import { useIdeas } from '@/hooks/useIdeas';
import { usePainPoints } from '@/hooks/usePainPoints';
import { useTheme } from '@/hooks/useTheme';

import type { RootStackParamList } from '@/navigation/types';
import type { GeneratePriceRequest } from '@/types/n8n';
import { generatePrice } from '@/api/n8n';
import { useSettingsStore } from '@/store/useSettingsStore';
import { buildPricing } from '@/utils/pricingHeuristic';
import { formatCurrency } from '@/utils/format';
import { canGeneratePricing } from '@/services/pipeline';
import { logEvent } from '@/services/sheetLogger';
import { userMessage } from '@/api/errors';
import { nowIso } from '@/utils/date';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'Pricing'>;

const CURRENCIES = ['USD', 'EUR', 'GBP', 'MYR', 'SGD', 'AUD'];

export default function PricingScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const templateId = route.params.id;

  const { colors } = useTheme();
  const { getById, setPricing, overridePrice } = useTemplates();
  const { getById: getIdea } = useIdeas();
  const { getManyByIds: getPainPoints } = usePainPoints();

  const [busy, setBusy] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [currency, setCurrency] = useState('USD');

  const template = getById(templateId);

  const severity = useMemo(() => {
    if (!template) return 'medium' as const;
    const idea = getIdea(template.ideaId);
    if (!idea) return 'medium' as const;
    const pps = getPainPoints(idea.painPointIds);
    if (pps.length === 0) return 'medium' as const;
    const order = ['critical', 'high', 'medium', 'low'] as const;
    for (const level of order) {
      if (pps.some((p) => p.severity === level)) return level;
    }
    return 'medium' as const;
  }, [template, getIdea, getPainPoints]);

  useEffect(() => {
    if (template?.pricing) {
      setCurrency(template.pricing.currency);
      if (template.pricing.manualOverride !== undefined) {
        setManualInput(String(template.pricing.manualOverride));
      } else {
        setManualInput('');
      }
    }
  }, [template?.pricing]);

  const handleGenerate = async () => {
    if (!template) return;
    const check = canGeneratePricing(template);
    if (!check.allowed) {
      Alert.alert('Cannot generate', check.reason ?? 'Build sheet missing.');
      return;
    }
    setBusy(true);
    try {
      const settings = useSettingsStore.getState().settings;
      const counts = {
        totalDatabases: template.buildSheet?.totalDatabases ?? 0,
        totalViews: template.buildSheet?.totalViews ?? 0,
        totalFormulas: template.buildSheet?.totalFormulas ?? 0,
      };

      if (settings.n8nWebhookUrl) {
        try {
          const body: GeneratePriceRequest = {
            templateId: template.id,
            title: template.title,
            oneLiner: template.oneLiner,
            audience: template.audience,
            totalDatabases: counts.totalDatabases,
            totalViews: counts.totalViews,
            totalFormulas: counts.totalFormulas,
            painPointSeverity: severity,
          };
          const res = await generatePrice(settings, body);
          setPricing(template.id, {
            suggested: res.suggested,
            currency: res.currency ?? currency,
            rationale: res.rationale,
            complexityScore: res.complexityScore,
            computedAt: res.computedAt ?? nowIso(),
          });
          void logEvent({
            eventType: 'pricing',
            entityId: template.id,
            title: template.title,
            stage: 'pricing',
            status: 'generated',
            payload: { source: 'n8n', suggested: res.suggested, severity },
          });
        } catch (err) {
          const message = userMessage(err);
          const local = buildPricing({
            severity,
            ...counts,
            currency,
          });
          setPricing(template.id, local);
          Alert.alert('n8n unavailable', `Generated locally.\n\n${message}`);
        }
      } else {
        const local = buildPricing({
          severity,
          ...counts,
          currency,
        });
        setPricing(template.id, local);
        void logEvent({
          eventType: 'pricing',
          entityId: template.id,
          title: template.title,
          stage: 'pricing',
          status: 'local',
          payload: { source: 'local', suggested: local.suggested, severity },
        });
      }
    } finally {
      setBusy(false);
    }
  };

  const applyManual = () => {
    if (!template) return;
    const parsed = Number(manualInput);
    if (!Number.isFinite(parsed) || parsed < 0) {
      Alert.alert('Invalid price', 'Enter a positive number.');
      return;
    }
    overridePrice(template.id, parsed);
    void logEvent({
      eventType: 'pricing',
      entityId: template.id,
      title: template.title,
      stage: 'pricing',
      status: 'override',
      payload: { manual: parsed, currency },
    });
  };

  const clearManual = () => {
    if (!template) return;
    overridePrice(template.id, undefined);
    setManualInput('');
  };

  if (!template) {
    return (
      <Screen edges={['top']} padded={false}>
        <Header title="Pricing" showBack />
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

  const pricing = template.pricing;

  return (
    <Screen edges={['top']} padded={false}>
      <Header title="Pricing" subtitle={template.title} showBack />

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {!pricing ? (
          <Card>
            <View className="items-center py-6">
              <View className="w-14 h-14 rounded-full bg-primary/15 items-center justify-center mb-3">
                <Ionicons name="pricetag-outline" size={24} color={colors.primary} />
              </View>
              <Text className="text-text dark:text-dark-text text-sm font-semibold text-center">
                No pricing yet
              </Text>
              <Text className="text-muted dark:text-dark-muted text-xs text-center mt-1 mb-4 px-4">
                Let the app suggest a price based on complexity, severity, and
                audience.
              </Text>
              <Button
                title={busy ? 'Generating…' : 'Generate price'}
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
              <Text className="text-muted dark:text-dark-muted text-xs uppercase tracking-wider mb-1">
                Suggested price
              </Text>
              <View className="flex-row items-baseline mb-3">
                <Text className="text-text dark:text-dark-text text-3xl font-bold">
                  {formatCurrency(pricing.suggested, pricing.currency)}
                </Text>
                {pricing.manualOverride !== undefined ? (
                  <Badge label="Overridden" tone="warning" className="ml-2" />
                ) : (
                  <Badge label="Auto" tone="success" className="ml-2" />
                )}
              </View>

              <Text className="text-muted dark:text-dark-muted text-xs">
                Complexity score: {pricing.complexityScore}
              </Text>
              <Text className="text-muted dark:text-dark-muted text-xs mt-1">
                Computed {formatCurrency(pricing.suggested, pricing.currency)}
              </Text>

              <View className="mt-3 p-3 rounded-lg bg-border/40 dark:bg-dark-border">
                <Text className="text-text dark:text-dark-text text-[11px] leading-5 font-mono">
                  {pricing.rationale}
                </Text>
              </View>
            </Card>

            <SectionHeader title="Manual override" />
            <Card>
              <Input
                label="Your price"
                value={manualInput}
                onChangeText={setManualInput}
                keyboardType="decimal-pad"
                placeholder={String(pricing.suggested)}
                hint={`Currency: ${pricing.currency}`}
              />

              <View className="flex-row gap-2 mt-1">
                <Button
                  title="Apply override"
                  variant="primary"
                  icon="checkmark"
                  onPress={applyManual}
                />
                <Button
                  title="Clear"
                  variant="secondary"
                  icon="close"
                  onPress={clearManual}
                />
              </View>

              <View className="mt-4">
                <Text className="text-text dark:text-dark-text text-xs font-medium mb-2">
                  Currency
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {CURRENCIES.map((c) => (
                    <Button
                      key={c}
                      title={c}
                      size="sm"
                      variant={currency === c ? 'primary' : 'secondary'}
                      onPress={() => setCurrency(c)}
                    />
                  ))}
                </View>
              </View>
            </Card>

            <SectionHeader title="Price signals" />
            <Card>
              <ListItem
                title="Pain severity"
                rightText={severity}
                leading={<Ionicons name="flame-outline" size={18} color={colors.muted} />}
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
            </Card>

            <View className="mt-6 gap-3">
              <Button
                title="Regenerate price"
                icon="refresh-outline"
                variant="secondary"
                fullWidth
                loading={busy}
                onPress={handleGenerate}
              />
              <Button
                title="Continue to listing"
                icon="storefront-outline"
                variant="primary"
                fullWidth
                onPress={() => navigation.navigate('Listing', { id: template.id })}
              />
            </View>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}