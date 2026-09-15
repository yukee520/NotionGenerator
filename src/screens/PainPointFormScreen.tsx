import React, { useEffect, useMemo, useState } from 'react';
import { View, Alert } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import Screen from '@/components/Screen';
import Header from '@/components/Header';
import Input from '@/components/Input';
import TextArea from '@/components/TextArea';
import Select from '@/components/Select';
import Button from '@/components/Button';
import Card from '@/components/Card';
import SectionHeader from '@/components/SectionHeader';

import { usePainPoints } from '@/hooks/usePainPoints';
import { useClipboard } from '@/hooks/useClipboard';

import type { RootStackParamList } from '@/navigation/types';
import type {
  PainPointInput,
  PainPointSeverity,
  PainPointSource,
} from '@/types/painPoint';
import type { SelectOption } from '@/types/common';
import { validatePainPoint, hasErrors, ValidationErrors } from '@/utils/validation';
import { logEvent } from '@/services/sheetLogger';
import { newId } from '@/utils/id';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'PainPointForm'>;

const SOURCE_OPTIONS: SelectOption<PainPointSource>[] = [
  { value: 'reddit', label: 'Reddit' },
  { value: 'twitter', label: 'X / Twitter' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'forum', label: 'Forum / Community' },
  { value: 'personal', label: 'Personal Experience' },
  { value: 'other', label: 'Other' },
];

const SEVERITY_OPTIONS: SelectOption<PainPointSeverity>[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

const EMPTY: PainPointInput = {
  title: '',
  description: '',
  source: 'personal',
  sourceUrl: '',
  topic: '',
  audience: '',
  severity: 'medium',
  status: 'inbox',
  tags: [],
};

export default function PainPointFormScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const id = route.params?.id;

  const { getById, add, update, remove } = usePainPoints();
  const { copy } = useClipboard();

  const existing = id ? getById(id) : undefined;
  const isEditing = Boolean(existing);

  const [form, setForm] = useState<PainPointInput>(EMPTY);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (existing) {
      setForm({
        title: existing.title,
        description: existing.description,
        source: existing.source,
        sourceUrl: existing.sourceUrl ?? '',
        topic: existing.topic,
        audience: existing.audience,
        severity: existing.severity,
        status: existing.status,
        tags: existing.tags,
      });
    }
  }, [existing]);

  const title = useMemo(
    () => (isEditing ? 'Edit pain point' : 'New pain point'),
    [isEditing],
  );

  const patch = (p: Partial<PainPointInput>) => {
    setForm((prev) => ({ ...prev, ...p }));
  };

  const handleAddTag = () => {
    const t = tagInput.trim();
    if (!t) return;
    if (form.tags.includes(t)) {
      setTagInput('');
      return;
    }
    patch({ tags: [...form.tags, t] });
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    patch({ tags: form.tags.filter((t) => t !== tag) });
  };

  const handleSave = async () => {
    const v = validatePainPoint(form);
    setErrors(v);
    if (hasErrors(v)) return;

    setSaving(true);
    try {
      if (isEditing && id) {
        update(id, form);
        await logEvent({
          eventType: 'pain_point',
          entityId: id,
          title: form.title,
          stage: 'pain_point',
          status: 'updated',
          payload: {
            source: form.source,
            severity: form.severity,
            topic: form.topic,
            audience: form.audience,
          },
        });
      } else {
        const created = add(form);
        await logEvent({
          eventType: 'pain_point',
          entityId: created.id,
          title: created.title,
          stage: 'pain_point',
          status: 'created',
          payload: {
            source: created.source,
            severity: created.severity,
            topic: created.topic,
            audience: created.audience,
          },
        });
      }
      navigation.goBack();
    } catch (err) {
      Alert.alert('Save failed', 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!id) return;
    Alert.alert(
      'Delete pain point?',
      'This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            remove(id);
            navigation.goBack();
          },
        },
      ],
    );
  };

  const handleDuplicate = () => {
    const clone = { ...form, title: `${form.title} (copy)` };
    const created = add(clone);
    void copy(newId('pp'), '');
    navigation.replace('PainPointForm', { id: created.id });
  };

  return (
    <Screen scroll edges={['top']} padded={false}>
      <Header
        title={title}
        showBack
        right={
          isEditing
            ? [
                {
                  icon: 'trash-outline',
                  onPress: handleDelete,
                  accessibilityLabel: 'Delete',
                },
              ]
            : undefined
        }
      />

      <View className="px-4 pt-4">
        <Input
          label="Title"
          value={form.title}
          onChangeText={(v) => patch({ title: v })}
          placeholder="e.g. People struggle to track freelance invoices"
          error={errors.title}
          required
        />

        <TextArea
          label="Description"
          value={form.description}
          onChangeText={(v) => patch({ description: v })}
          placeholder="Describe the pain point in detail. Who feels it, when, and how often?"
          error={errors.description}
          required
          minHeight={120}
        />

        <View className="flex-row gap-3">
          <View className="flex-1">
            <Select
              label="Source"
              value={form.source}
              options={SOURCE_OPTIONS}
              onChange={(v) => patch({ source: v })}
            />
          </View>
          <View className="flex-1">
            <Select
              label="Severity"
              value={form.severity}
              options={SEVERITY_OPTIONS}
              onChange={(v) => patch({ severity: v })}
            />
          </View>
        </View>

        <Input
          label="Source URL"
          value={form.sourceUrl ?? ''}
          onChangeText={(v) => patch({ sourceUrl: v })}
          placeholder="https://…"
          autoCapitalize="none"
          keyboardType="url"
          error={errors.sourceUrl}
          hint="Optional. Link to the post or thread."
        />

        <View className="flex-row gap-3">
          <View className="flex-1">
            <Input
              label="Topic"
              value={form.topic}
              onChangeText={(v) => patch({ topic: v })}
              placeholder="e.g. Freelancing"
              error={errors.topic}
              required
            />
          </View>
          <View className="flex-1">
            <Input
              label="Audience"
              value={form.audience}
              onChangeText={(v) => patch({ audience: v })}
              placeholder="e.g. Freelancers"
              error={errors.audience}
              required
            />
          </View>
        </View>

        <SectionHeader title="Tags" />
        <View className="flex-row items-center mb-3">
          <View className="flex-1 mr-2">
            <Input
              value={tagInput}
              onChangeText={setTagInput}
              placeholder="Add a tag and tap +"
              onSubmitEditing={handleAddTag}
              returnKeyType="done"
            />
          </View>
          <Button title="Add" onPress={handleAddTag} variant="secondary" icon="add" />
        </View>

        {form.tags.length > 0 ? (
          <View className="flex-row flex-wrap gap-2 mb-4">
            {form.tags.map((tag) => (
              <Card
                key={tag}
                padded={false}
                className="px-3 py-1.5 mr-2 mb-2"
                onPress={() => removeTag(tag)}
              >
                <View className="flex-row items-center">
                  <View className="w-1.5 h-1.5 rounded-full bg-primary mr-2" />
                  <View className="w-0.5" />
                  <View className="w-0.5" />
                </View>
              </Card>
            ))}
          </View>
        ) : null}
      </View>
    </Screen>
  );
}