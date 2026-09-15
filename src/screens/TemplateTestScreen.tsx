import React, { useMemo, useState } from 'react';
import { View, Text, Alert, ScrollView } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Ionicons from 'react-native-vector-icons/Ionicons';

import Screen from '@/components/Screen';
import Header from '@/components/Header';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Badge from '@/components/Badge';
import TextArea from '@/components/TextArea';
import SectionHeader from '@/components/SectionHeader';
import EmptyState from '@/components/EmptyState';

import { useTemplates } from '@/hooks/useTemplates';
import { useTheme } from '@/hooks/useTheme';

import type { RootStackParamList } from '@/navigation/types';
import type { QAItem, QAItemStatus } from '@/types/template';
import { canApproveTesting } from '@/services/pipeline';
import { logEvent } from '@/services/sheetLogger';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'TemplateTest'>;

const STATUS_OPTIONS: { value: QAItemStatus; label: string; tone: 'success' | 'danger' | 'neutral' }[] = [
  { value: 'pass', label: 'Pass', tone: 'success' },
  { value: 'fail', label: 'Fail', tone: 'danger' },
  { value: 'na', label: 'N/A', tone: 'neutral' },
];

export default function TemplateTestScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const templateId = route.params.id;

  const { colors } = useTheme();
  const { getById, updateQaItem, setQaNotes, approveTesting, sendBack } = useTemplates();
  const [notes, setNotes] = useState('');

  const template = getById(templateId);

  const qaItems = useMemo(() => template?.qaItems ?? [], [template]);

  React.useEffect(() => {
    if (template?.qaNotes) setNotes(template.qaNotes);
  }, [template?.qaNotes]);

  if (!template) {
    return (
      <Screen edges={['top']} padded={false}>
        <Header title="Test template" showBack />
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

  const required = qaItems.filter((q) => q.required);
  const passed = qaItems.filter((q) => q.status === 'pass').length;
  const failed = qaItems.filter((q) => q.status === 'fail').length;
  const unchecked = qaItems.filter((q) => q.status === 'unchecked').length;

  const handleApprove = () => {
    const check = canApproveTesting(template);
    if (!check.allowed) {
      Alert.alert('Cannot approve', check.reason ?? 'Complete QA first.');
      return;
    }

    Alert.alert(
      'Approve testing?',
      'This confirms the Notion template is ready for the guide and pricing step.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: () => {
            setQaNotes(template.id, notes);
            approveTesting(template.id);
            void logEvent({
              eventType: 'template',
              entityId: template.id,
              title: template.title,
              stage: 'tested_approved',
              status: 'approved',
              payload: {
                passed,
                failed,
                unchecked,
                requiredTotal: required.length,
              },
            });
            navigation.navigate('TemplateDetail', { id: template.id });
          },
        },
      ],
    );
  };

  const handleSendBack = () => {
    if (!notes.trim()) {
      Alert.alert('Notes required', 'Please describe what needs to be fixed.');
      return;
    }
    Alert.alert('Send back for fixes?', 'The build will be reopened.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Send back',
        style: 'destructive',
        onPress: () => {
          sendBack(template.id, notes);
          void logEvent({
            eventType: 'template',
            entityId: template.id,
            title: template.title,
            stage: 'building',
            status: 'sent_back',
            payload: { reason: notes },
          });
          navigation.goBack();
        },
      },
    ]);
  };

  const cycleStatus = (item: QAItem) => {
    const order: QAItemStatus[] = ['unchecked', 'pass', 'fail', 'na'];
    const idx = order.indexOf(item.status);
    const next = order[(idx + 1) % order.length];
    updateQaItem(template.id, item.id, { status: next });
  };

  return (
    <Screen edges={['top']} padded={false}>
      <Header
        title="Test template"
        subtitle={template.title}
        showBack
      />

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <Card>
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center">
              <Ionicons name="clipboard-outline" size={20} color={colors.primary} />
              <Text className="text-text dark:text-dark-text text-sm font-semibold ml-2">
                QA checklist
              </Text>
            </View>
            <Badge
              label={`${passed}/${qaItems.length} pass`}
              tone={failed > 0 ? 'danger' : unchecked > 0 ? 'warning' : 'success'}
            />
          </View>

          <View className="flex-row gap-2 flex-wrap">
            <Badge label={`${passed} passed`} tone="success" />
            <Badge label={`${failed} failed`} tone="danger" />
            <Badge label={`${unchecked} unchecked`} tone="warning" />
            <Badge label={`${required.length} required`} tone="info" />
          </View>
        </Card>

        {template.notionUrl ? (
          <>
            <SectionHeader title="Notion page" />
            <Card>
              <Text className="text-primary text-xs" numberOfLines={2}>
                {template.notionUrl}
              </Text>
            </Card>
          </>
        ) : null}

        <SectionHeader
          title="Checklist"
          actionLabel="Mark all pass"
          onAction={() => {
            Alert.alert(
              'Mark all as pass?',
              'This will mark every QA item as passing.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Mark all',
                  onPress: () => {
                    qaItems.forEach((q) =>
                      updateQaItem(template.id, q.id, { status: 'pass' }),
                    );
                  },
                },
              ],
            );
          }}
        />

        {qaItems.length === 0 ? (
          <Card>
            <Text className="text-muted dark:text-dark-muted text-sm text-center py-4">
              No QA items available.
            </Text>
          </Card>
        ) : (
          qaItems.map((item) => {
            const statusTone =
              item.status === 'pass'
                ? 'success'
                : item.status === 'fail'
                ? 'danger'
                : item.status === 'na'
                ? 'neutral'
                : 'warning';
            return (
              <Card key={item.id} className="mb-2">
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 mr-3">
                    <View className="flex-row items-center">
                      <Text className="text-text dark:text-dark-text text-sm font-medium flex-1">
                        {item.label}
                      </Text>
                      {item.required ? (
                        <Text className="text-danger text-xs ml-1">*</Text>
                      ) : null}
                    </View>
                    {item.description ? (
                      <Text className="text-muted dark:text-dark-muted text-xs mt-1">
                        {item.description}
                      </Text>
                    ) : null}
                  </View>
                  <Badge
                    label={
                      item.status === 'unchecked'
                        ? 'Unchecked'
                        : item.status === 'pass'
                        ? 'Pass'
                        : item.status === 'fail'
                        ? 'Fail'
                        : 'N/A'
                    }
                    tone={statusTone}
                  />
                </View>

                <View className="flex-row gap-2 mt-3">
                  {STATUS_OPTIONS.map((opt) => {
                    const active = item.status === opt.value;
                    return (
                      <Button
                        key={opt.value}
                        title={opt.label}
                        size="sm"
                        variant={active ? opt.tone === 'success' ? 'success' : opt.tone === 'danger' ? 'danger' : 'secondary' : 'ghost'}
                        onPress={() => updateQaItem(template.id, item.id, { status: opt.value })}
                      />
                    );
                  })}
                </View>
              </Card>
            );
          })
        )}

        <SectionHeader title="Notes" />
        <TextArea
          value={notes}
          onChangeText={setNotes}
          placeholder="What needs to be fixed, or what you verified?"
          minHeight={100}
        />

        <View className="mt-6 gap-3">
          <Button
            title="Approve testing"
            icon="checkmark-circle-outline"
            variant="success"
            fullWidth
            onPress={handleApprove}
          />
          <Button
            title="Send back for fixes"
            icon="arrow-undo-outline"
            variant="danger"
            fullWidth
            onPress={handleSendBack}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}