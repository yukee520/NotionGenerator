import React, { useEffect, useState } from 'react';
import { View, Text, Alert, ScrollView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Ionicons from 'react-native-vector-icons/Ionicons';

import Screen from '@/components/Screen';
import Header from '@/components/Header';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Badge from '@/components/Badge';
import SectionHeader from '@/components/SectionHeader';
import ListItem from '@/components/ListItem';
import Divider from '@/components/Divider';

import { useSettings } from '@/hooks/useSettings';
import { useSyncQueue } from '@/hooks/useSyncQueue';
import { useTheme } from '@/hooks/useTheme';
import { useClipboard } from '@/hooks/useClipboard';

import type { RootStackParamList } from '@/navigation/types';
import type { ThemeMode } from '@/types/common';
import { validateSettings, hasErrors, ValidationErrors } from '@/utils/validation';
import { restartSyncWorker } from '@/services/syncQueue';
import { formatDateTime } from '@/utils/date';
import { APP_VERSION } from '@/utils/version';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const THEME_OPTIONS: { value: ThemeMode; label: string; icon: string }[] = [
  { value: 'light', label: 'Light', icon: 'sunny-outline' },
  { value: 'dark', label: 'Dark', icon: 'moon-outline' },
  { value: 'system', label: 'System', icon: 'phone-portrait-outline' },
];

export default function SettingsScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const { settings, update, reset, checkHealth } = useSettings();
  const { pending, failed, total, clearDone, clearAll, runNow } = useSyncQueue();
  const { copy } = useClipboard();

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [checking, setChecking] = useState(false);
  const [urlDraft, setUrlDraft] = useState(settings.n8nWebhookUrl);
  const [apiKeyDraft, setApiKeyDraft] = useState(settings.n8nApiKey ?? '');
  const [sheetIdDraft, setSheetIdDraft] = useState(settings.googleSheetId ?? '');
  const [intervalDraft, setIntervalDraft] = useState(
    String(settings.syncIntervalSeconds),
  );

  useEffect(() => {
    setUrlDraft(settings.n8nWebhookUrl);
    setApiKeyDraft(settings.n8nApiKey ?? '');
    setSheetIdDraft(settings.googleSheetId ?? '');
    setIntervalDraft(String(settings.syncIntervalSeconds));
  }, [settings]);

  const saveIntegration = () => {
    const next = {
      ...settings,
      n8nWebhookUrl: urlDraft.trim(),
      n8nApiKey: apiKeyDraft.trim() || undefined,
      googleSheetId: sheetIdDraft.trim() || undefined,
      syncIntervalSeconds: Number(intervalDraft) || 30,
    };
    const v = validateSettings(next);
    setErrors(v);
    if (hasErrors(v)) return;

    update({
      n8nWebhookUrl: next.n8nWebhookUrl,
      n8nApiKey: next.n8nApiKey,
      googleSheetId: next.googleSheetId,
      syncIntervalSeconds: next.syncIntervalSeconds,
    });
    restartSyncWorker();
    Alert.alert('Saved', 'Integration settings updated.');
  };

  const handleHealthCheck = async () => {
    setChecking(true);
    try {
      const result = await checkHealth();
      if (result.ok) {
        Alert.alert('n8n is reachable', result.version ?? 'Health check passed.');
      } else {
        Alert.alert('Cannot reach n8n', result.message ?? 'Check the webhook URL.');
      }
    } finally {
      setChecking(false);
    }
  };

  const handleResetApp = () => {
    Alert.alert(
      'Reset settings?',
      'This will clear the webhook URL, API key, and preferences. Your data stays.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            reset();
            restartSyncWorker();
          },
        },
      ],
    );
  };

  const handleClearQueue = () => {
    Alert.alert(
      'Clear sync queue?',
      `This will remove ${total} queued task(s). Failed tasks will be lost.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => clearAll(),
        },
      ],
    );
  };

  return (
    <Screen edges={['top']} padded={false}>
      <Header title="Settings" showBack />

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <SectionHeader title="n8n integration" />
        <Card>
          <Input
            label="Webhook base URL"
            value={urlDraft}
            onChangeText={setUrlDraft}
            placeholder="https://n8n.example.com/webhook/notiongen"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            error={errors.n8nWebhookUrl}
            hint="The base webhook URL from your n8n instance."
          />

          <Input
            label="API key (optional)"
            value={apiKeyDraft}
            onChangeText={setApiKeyDraft}
            placeholder="Bearer token for your n8n endpoint"
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
          />

          <Input
            label="Google Sheet ID (optional)"
            value={sheetIdDraft}
            onChangeText={setSheetIdDraft}
            placeholder="1AbCdEfGhIjKlMnOpQrStUvWxYz"
            autoCapitalize="none"
            autoCorrect={false}
            hint="Found in the URL of your Google Sheet."
          />

          <Input
            label="Auto-sync interval (seconds)"
            value={intervalDraft}
            onChangeText={setIntervalDraft}
            keyboardType="number-pad"
            error={errors.syncIntervalSeconds}
            hint="Minimum 10, maximum 3600."
          />

          <View className="flex-row gap-2 mt-2">
            <Button
              title="Save"
              variant="primary"
              icon="checkmark"
              onPress={saveIntegration}
            />
            <Button
              title={checking ? 'Checking…' : 'Test connection'}
              variant="secondary"
              icon="pulse-outline"
              loading={checking}
              onPress={handleHealthCheck}
            />
          </View>

          {settings.lastHealthCheckAt ? (
            <View className="mt-4 flex-row items-center justify-between">
              <Text className="text-muted dark:text-dark-muted text-xs">
                Last checked {formatDateTime(settings.lastHealthCheckAt)}
              </Text>
              <Badge
                label={settings.lastHealthCheckOk ? 'Online' : 'Offline'}
                tone={settings.lastHealthCheckOk ? 'success' : 'danger'}
              />
            </View>
          ) : null}
        </Card>

        <SectionHeader title="Sync" />
        <Card>
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-text dark:text-dark-text text-sm font-medium">
              Auto-sync
            </Text>
            <Button
              title={settings.autoSyncEnabled ? 'On' : 'Off'}
              size="sm"
              variant={settings.autoSyncEnabled ? 'success' : 'secondary'}
              onPress={() =>
                update({ autoSyncEnabled: !settings.autoSyncEnabled })
              }
            />
          </View>

          <Divider className="my-3" />

          <ListItem
            title="Pending tasks"
            rightText={String(pending)}
            leading={<Ionicons name="hourglass-outline" size={18} color={colors.muted} />}
          />
          <ListItem
            title="Failed tasks"
            rightText={String(failed)}
            leading={
              <Ionicons
                name="alert-circle-outline"
                size={18}
                color={failed > 0 ? colors.danger : colors.muted}
              />
            }
          />

          <View className="flex-row gap-2 mt-3 flex-wrap">
            <Button
              title="Sync now"
              size="sm"
              variant="primary"
              icon="sync-outline"
              onPress={() => {
                void runNow();
              }}
            />
            <Button
              title="Clear completed"
              size="sm"
              variant="secondary"
              onPress={clearDone}
            />
            <Button
              title="Clear all"
              size="sm"
              variant="danger"
              onPress={handleClearQueue}
              disabled={total === 0}
            />
          </View>
        </Card>

        <SectionHeader title="Appearance" />
        <Card>
          <Text className="text-text dark:text-dark-text text-xs font-medium mb-3">
            Theme
          </Text>
          <View className="flex-row gap-2">
            {THEME_OPTIONS.map((opt) => {
              const active = settings.themeMode === opt.value;
              return (
                <Button
                  key={opt.value}
                  title={opt.label}
                  size="sm"
                  icon={opt.icon}
                  variant={active ? 'primary' : 'secondary'}
                  onPress={() => update({ themeMode: opt.value })}
                />
              );
            })}
          </View>
        </Card>

        <SectionHeader title="Google Sheet" />
        <Card>
          <Text className="text-muted dark:text-dark-muted text-xs leading-5 mb-3">
            Every stage is logged to your Google Sheet via n8n:{'\n'}
            Pain points, ideas, templates, guides, pricing, listings, marketing, and
            publish status.
          </Text>
          {settings.googleSheetId ? (
            <>
              <ListItem
                title="Sheet ID"
                subtitle={settings.googleSheetId}
                leading={
                  <Ionicons name="grid-outline" size={18} color={colors.success} />
                }
              />
              <View className="flex-row gap-2 mt-2">
                <Button
                  title="Copy ID"
                  size="sm"
                  variant="secondary"
                  icon="copy-outline"
                  onPress={() => {
                    void copy(settings.googleSheetId ?? '', 'Sheet ID copied');
                  }}
                />
              </View>
            </>
          ) : (
            <Badge label="Not configured" tone="warning" />
          )}
        </Card>

        <SectionHeader title="Data" />
        <Card>
          <ListItem
            title="Reset settings"
            subtitle="Clear integration config, keep your data"
            leading={<Ionicons name="refresh-outline" size={18} color={colors.muted} />}
            showChevron
            onPress={handleResetApp}
          />
          <View className="h-px bg-border dark:bg-border" />
          <ListItem
            title="About"
            subtitle={`Version ${APP_VERSION}`}
            leading={
              <Ionicons
                name="information-circle-outline"
                size={18}
                color={colors.muted}
              />
            }
            showChevron
            onPress={() => navigation.navigate('About')}
          />
        </Card>

        <View className="mt-6 items-center">
          <Text className="text-muted dark:text-dark-muted text-[11px]">
            NotionGenerator v{APP_VERSION} • {Platform.OS}
          </Text>
        </View>
      </ScrollView>
    </Screen>
  );
}