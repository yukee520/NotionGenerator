import React, { useMemo, useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Ionicons from 'react-native-vector-icons/Ionicons';

import Screen from '@/components/Screen';
import Header from '@/components/Header';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Badge from '@/components/Badge';
import SectionHeader from '@/components/SectionHeader';
import ListItem from '@/components/ListItem';
import EmptyState from '@/components/EmptyState';
import SyncStatusDot from '@/components/SyncStatusDot';
import Input from '@/components/Input';
import TextArea from '@/components/TextArea';

import { useIdeas } from '@/hooks/useIdeas';
import { usePainPoints } from '@/hooks/usePainPoints';
import { useTemplates } from '@/hooks/useTemplates';
import { useTheme } from '@/hooks/useTheme';

import type { RootStackParamList } from '@/navigation/types';
import { canApproveIdea } from '@/services/pipeline';
import { startTemplateBuild } from '@/services/templateBuilder';
import { logEvent } from '@/services/sheetLogger';
import { formatDateTime } from '@/utils/date';
import { validateIdea, hasErrors, ValidationErrors } from '@/utils/validation';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'IdeaDetail'>;

export default function IdeaDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const id = route.params.id;

  const { colors } = useTheme();
  const { getById, update, approve, reject, reopen, remove } = useIdeas();
  const { getManyByIds } = usePainPoints();
  const { getByIdeaId } = useTemplates();

  const [building, setBuilding] = useState(false);
  const [editing, setEditing] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});

  const idea = getById(id);
  const linkedPainPoints = useMemo(
    () => (idea ? getManyByIds(idea.painPointIds) : []),
    [idea, getManyByIds],
  );
  const existingTemplate = idea ? getByIdeaId(idea.id) : undefined;

  const [draft, setDraft] = React.useState({
    title: '',
    oneLiner: '',
    problem: '',
    audience: '',
    monetizationAngle: '',
  });

  React.useEffect(() => {
    if (idea) {
      setDraft({
        title: idea.title,
        oneLiner: idea.oneLiner,
        problem: idea.problem,
        audience: idea.audience,
        monetizationAngle: idea.monetizationAngle,
      });
    }
  }, [idea]);

  if (!idea) {
    return (
      <Screen edges={['top']} padded={false}>
        <Header title="Idea" showBack />
        <EmptyState
          icon="alert-circle-outline"
          title="Idea not found"
          message="It may have been deleted."
          actionLabel="Go back"
          onAction={() => navigation.goBack()}
        />
      </Screen>
    );
  }

  const handleSaveEdit = () => {
    const validation = validateIdea({
      title: draft.title,
      oneLiner: draft.oneLiner,
      problem: draft.problem,
      audience: draft.audience,
      monetizationAngle: draft.monetizationAngle,
      proposedSections: idea.proposedSections,
      painPointIds: idea.painPointIds,
      generatedBy: idea.generatedBy,
    });
    setErrors(validation);
    if (hasErrors(validation)) return;
    update(idea.id, draft);
    setEditing(false);
  };

  const handleApprove = async () => {
    const check = canApproveIdea(idea);
    if (!check.allowed) {
      Alert.alert('Cannot approve', check.reason ?? 'Idea is not ready.');
      return;
    }

    Alert.alert(
      'Approve this idea?',
      'This will start building the Notion template via n8n.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve & build',
          onPress: async () => {
            approve(idea.id);
            await logEvent({
              eventType: 'idea',
              entityId: idea.id,
              title: idea.title,
              stage: 'idea',
              status: 'approved',
              payload: { audience: idea.audience, oneLiner: idea.oneLiner },
            });
            setBuilding(true);
            try {
              const res = await startTemplateBuild(idea.id);
              if (res.error) {
                Alert.alert('Built locally', res.error);
              }
              if (res.template) {
                navigation.navigate('BuildStatus', { templateId: res.template.id });
              }
            } catch (err) {
              Alert.alert('Build failed', 'Please try again.');
            } finally {
              setBuilding(false);
            }
          },
        },
      ],
    );
  };

  const handleReject = () => {
    Alert.alert('Reject this idea?', 'You can reopen it later.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: () => {
          reject(idea.id, 'Rejected by user');
          void logEvent({
            eventType: 'idea',
            entityId: idea.id,
            title: idea.title,
            stage: 'idea',
            status: 'rejected',
            payload: {},
          });
        },
      },
    ]);
  };

  const handleDelete = () => {
    Alert.alert('Delete this idea?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          remove(idea.id);
          navigation.goBack();
        },
      },
    ]);
  };

  const statusTone =
    idea.status === 'approved'
      ? 'success'
      : idea.status === 'rejected'
      ? 'danger'
      : 'info';

  return (
    <Screen scroll edges={['top']} padded={false}>
      <Header
        title={editing ? 'Edit idea' : 'Idea'}
        showBack
        onBack={editing ? () => setEditing(false) : undefined}
        right={
          editing
            ? [
                {
                  icon: 'checkmark',
                  onPress: handleSaveEdit,
                  accessibilityLabel: 'Save',
                },
              ]
            : [
                {
                  icon: 'create-outline',
                  onPress: () => setEditing(true),
                  accessibilityLabel: 'Edit',
                },
                {
                  icon: 'ellipsis-horizontal',
                  onPress: () =>
                    Alert.alert('Actions', undefined, [
                      { text: 'Delete', style: 'destructive', onPress: handleDelete },
                      { text: 'Cancel', style: 'cancel' },
                    ]),
                  accessibilityLabel: 'More',
                },
              ]
        }
      />

      <View className="px-4 pt-4">
        {editing ? (
          <>
            <Input
              label="Title"
              value={draft.title}
              onChangeText={(v) => setDraft((p) => ({ ...p, title: v }))}
              error={errors.title}
              required
            />
            <TextArea
              label="One-liner"
              value={draft.oneLiner}
              onChangeText={(v) => setDraft((p) => ({ ...p, oneLiner: v }))}
              error={errors.oneLiner}
              required
              minHeight={70}
            />
            <TextArea
              label="Problem"
              value={draft.problem}
              onChangeText={(v) => setDraft((p) => ({ ...p, problem: v }))}
              error={errors.problem}
              required
              minHeight={90}
            />
            <Input
              label="Audience"
              value={draft.audience}
              onChangeText={(v) => setDraft((p) => ({ ...p, audience: v }))}
              error={errors.audience}
              required
            />
            <TextArea
              label="Monetization angle"
              value={draft.monetizationAngle}
              onChangeText={(v) => setDraft((p) => ({ ...p, monetizationAngle: v }))}
              minHeight={70}
            />
          </>
        ) : (
          <Card>
            <View className="flex-row items-start justify-between mb-2">
              <Text className="text-text dark:text-dark-text text-lg font-semibold flex-1 mr-2">
                {idea.title}
              </Text>
              <SyncStatusDot status={idea.syncStatus} withLabel />
            </View>

            <Text className="text-muted dark:text-dark-muted text-sm mb-3 leading-5">
              {idea.oneLiner}
            </Text>

            <View className="flex-row flex-wrap gap-2 mb-3">
              <Badge label={idea.status} tone={statusTone} />
              <Badge
                label={idea.generatedBy === 'n8n' ? 'AI Generated' : 'Local'}
                tone={idea.generatedBy === 'n8n' ? 'primary' : 'neutral'}
              />
            </View>

            {idea.problem ? (
              <>
                <Text className="text-text dark:text-dark-text text-xs font-semibold uppercase tracking-wider mt-2 mb-1">
                  Problem
                </Text>
                <Text className="text-text dark:text-dark-text text-sm leading-6">
                  {idea.problem}
                </Text>
              </>
            ) : null}

            {idea.monetizationAngle ? (
              <>
                <Text className="text-text dark:text-dark-text text-xs font-semibold uppercase tracking-wider mt-4 mb-1">
                  Monetization
                </Text>
                <Text className="text-text dark:text-dark-text text-sm leading-6">
                  {idea.monetizationAngle}
                </Text>
              </>
            ) : null}
          </Card>
        )}

        <SectionHeader title="Proposed sections" />
        {idea.proposedSections.length === 0 ? (
          <Card>
            <Text className="text-muted dark:text-dark-muted text-sm text-center py-2">
              No sections defined.
            </Text>
          </Card>
        ) : (
          <Card padded={false}>
            {idea.proposedSections.map((s, idx) => (
              <View key={s.id} className="px-4">
                <ListItem
                  title={s.title}
                  subtitle={s.description}
                  leading={
                    <View className="w-7 h-7 rounded-full bg-primary/15 items-center justify-center">
                      <Text className="text-primary text-xs font-bold">{idx + 1}</Text>
                    </View>
                  }
                />
                {idx < idea.proposedSections.length - 1 ? (
                  <View className="h-px bg-border dark:bg-border" />
                ) : null}
              </View>
            ))}
          </Card>
        )}

        <SectionHeader title={`Linked pain points (${linkedPainPoints.length})`} />
        <Card padded={false}>
          {linkedPainPoints.map((p, idx) => (
            <View key={p.id} className="px-4">
              <ListItem
                title={p.title}
                subtitle={`${p.topic} • ${p.audience}`}
                onPress={() => navigation.navigate('PainPointDetail', { id: p.id })}
              />
              {idx < linkedPainPoints.length - 1 ? (
                <View className="h-px bg-border dark:bg-border" />
              ) : null}
            </View>
          ))}
        </Card>

        {existingTemplate ? (
          <>
            <SectionHeader title="Template" />
            <Card>
              <ListItem
                title={existingTemplate.title}
                subtitle={`Stage: ${existingTemplate.stage}`}
                leading={
                  <Ionicons
                    name="document-text-outline"
                    size={20}
                    color={colors.primary}
                  />
                }
                showChevron
                onPress={() =>
                  navigation.navigate('TemplateDetail', { id: existingTemplate.id })
                }
              />
            </Card>
          </>
        ) : null}

        <View className="mt-6 gap-3 mb-6">
          {idea.status === 'draft' ? (
            <>
              <Button
                title={building ? 'Building…' : 'Approve & build template'}
                icon="checkmark-circle-outline"
                variant="primary"
                fullWidth
                loading={building}
                onPress={handleApprove}
              />
              <Button
                title="Reject idea"
                icon="close-circle-outline"
                variant="danger"
                fullWidth
                onPress={handleReject}
              />
            </>
          ) : null}

          {idea.status === 'rejected' ? (
            <Button
              title="Reopen as draft"
              icon="arrow-undo-outline"
              variant="secondary"
              fullWidth
              onPress={() => reopen(idea.id)}
            />
          ) : null}

          {idea.status === 'approved' && !existingTemplate ? (
            <Button
              title={building ? 'Building…' : 'Build template'}
              icon="construct-outline"
              variant="primary"
              fullWidth
              loading={building}
              onPress={async () => {
                setBuilding(true);
                try {
                  const res = await startTemplateBuild(idea.id);
                  if (res.template) {
                    navigation.navigate('BuildStatus', { templateId: res.template.id });
                  }
                } finally {
                  setBuilding(false);
                }
              }}
            />
          ) : null}

          <Button
            title="View details"
            icon="information-circle-outline"
            variant="ghost"
            fullWidth
            onPress={() =>
              Alert.alert(
                'Idea details',
                `Created: ${formatDateTime(idea.createdAt)}\nUpdated: ${formatDateTime(
                  idea.updatedAt,
                )}\nID: ${idea.id}`,
              )
            }
          />
        </View>
      </View>
    </Screen>
  );
}