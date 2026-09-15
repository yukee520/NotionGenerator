import React, { useState } from 'react';
import { View, Text, Alert, Linking } from 'react-native';
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
import SyncStatusDot from '@/components/SyncStatusDot';
import LoadingView from '@/components/LoadingView';

import { usePainPoints } from '@/hooks/usePainPoints';
import { useIdeas } from '@/hooks/useIdeas';
import { useTheme } from '@/hooks/useTheme';

import type { RootStackParamList } from '@/navigation/types';
import type { PainPointSeverity } from '@/types/painPoint';
import {
  PAIN_POINT_SEVERITY_LABELS,
  PAIN_POINT_SOURCE_LABELS,
} from '@/types/painPoint';
import { formatDateTime } from '@/utils/date';
import { generateIdeasForPainPoints } from '@/services/ideaGenerator';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'PainPointDetail'>;

const SEVERITY_TONE: Record<PainPointSeverity, BadgeTone> = {
  low: 'info',
  medium: 'primary',
  high: 'warning',
  critical: 'danger',
};

export default function PainPointDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const id = route.params.id;

  const { colors } = useTheme();
  const { getById, markUsed, archive, restore, remove } = usePainPoints();
  const { getByPainPoint } = useIdeas();

  const [generating, setGenerating] = useState(false);

  const painPoint = getById(id);
  const linkedIdeas = getByPainPoint(id);

  if (!painPoint) {
    return (
      <Screen edges={['top']} padded={false}>
        <Header title="Pain Point" showBack />
        <EmptyState
          icon="alert-circle-outline"
          title="Pain point not found"
          message="It may have been deleted."
          actionLabel="Go back"
          onAction={() => navigation.goBack()}
        />
      </Screen>
    );
  }

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const result = await generateIdeasForPainPoints({
        painPointIds: [painPoint.id],
        count: 3,
      });
      markUsed(painPoint.id);
      if (result.error) {
        Alert.alert(
          'Generated locally',
          `n8n could not be reached (${result.error}). We generated ${result.ideas.length} idea(s) using the local engine.`,
        );
      }
      if (result.ideas.length === 1) {
        navigation.navigate('IdeaDetail', { id: result.ideas[0].id });
      } else if (result.ideas.length > 1) {
        navigation.navigate('Tabs', { screen: 'Ideas' });
      }
    } catch (err) {
      Alert.alert('Generation failed', 'Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleArchive = () => {
    Alert.alert('Archive this pain point?', 'You can restore it later.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Archive',
        onPress: () => {
          archive(painPoint.id);
          navigation.goBack();
        },
      },
    ]);
  };

  const handleDelete = () => {
    Alert.alert('Delete this pain point?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          remove(painPoint.id);
          navigation.goBack();
        },
      },
    ]);
  };

  const handleOpenUrl = () => {
    if (painPoint.sourceUrl) {
      void Linking.openURL(painPoint.sourceUrl);
    }
  };

  return (
    <Screen scroll edges={['top']} padded={false}>
      <Header
        title="Pain Point"
        showBack
        right={[
          {
            icon: 'create-outline',
            onPress: () => navigation.navigate('PainPointForm', { id: painPoint.id }),
            accessibilityLabel: 'Edit',
          },
          {
            icon: 'ellipsis-horizontal',
            onPress: () =>
              Alert.alert('Actions', undefined, [
                { text: 'Archive', onPress: handleArchive },
                { text: 'Delete', style: 'destructive', onPress: handleDelete },
                { text: 'Cancel', style: 'cancel' },
              ]),
            accessibilityLabel: 'More',
          },
        ]}
      />

      <View className="px-4 pt-4">
        <Card>
          <View className="flex-row items-start justify-between mb-2">
            <Text className="text-text dark:text-dark-text text-base font-semibold flex-1 mr-2">
              {painPoint.title}
            </Text>
            <SyncStatusDot status={painPoint.syncStatus} withLabel />
          </View>

          <View className="flex-row flex-wrap gap-2 mb-3">
            <Badge
              label={PAIN_POINT_SEVERITY_LABELS[painPoint.severity]}
              tone={SEVERITY_TONE[painPoint.severity]}
            />
            <Badge label={PAIN_POINT_SOURCE_LABELS[painPoint.source]} tone="neutral" />
            <Badge
              label={painPoint.status === 'inbox' ? 'Inbox' : painPoint.status === 'used' ? 'Used' : 'Archived'}
              tone={painPoint.status === 'used' ? 'success' : painPoint.status === 'archived' ? 'neutral' : 'info'}
            />
          </View>

          <Text className="text-text dark:text-dark-text text-sm leading-6">
            {painPoint.description}
          </Text>
        </Card>

        <SectionHeader title="Details" />
        <Card>
          <ListItem
            title="Topic"
            rightText={painPoint.topic || '—'}
            leading={<Ionicons name="pricetag-outline" size={18} color={colors.muted} />}
          />
          <View className="h-px bg-border dark:bg-border" />
          <ListItem
            title="Audience"
            rightText={painPoint.audience || '—'}
            leading={<Ionicons name="people-outline" size={18} color={colors.muted} />}
          />
          {painPoint.sourceUrl ? (
            <>
              <View className="h-px bg-border dark:bg-border" />
              <ListItem
                title="Source URL"
                subtitle={painPoint.sourceUrl}
                leading={<Ionicons name="link-outline" size={18} color={colors.primary} />}
                showChevron
                onPress={handleOpenUrl}
              />
            </>
          ) : null}
          <View className="h-px bg-border dark:bg-border" />
          <ListItem
            title="Created"
            rightText={formatDateTime(painPoint.createdAt)}
            leading={<Ionicons name="time-outline" size={18} color={colors.muted} />}
          />
        </Card>

        {painPoint.tags.length > 0 ? (
          <>
            <SectionHeader title="Tags" />
            <View className="flex-row flex-wrap">
              {painPoint.tags.map((tag) => (
                <View key={tag} className="mr-2 mb-2">
                  <Badge label={`#${tag}`} tone="info" />
                </View>
              ))}
            </View>
          </>
        ) : null}

        <SectionHeader title={`Linked ideas (${linkedIdeas.length})`} />
        {linkedIdeas.length === 0 ? (
          <Card>
            <Text className="text-muted dark:text-dark-muted text-sm text-center py-2">
              No ideas generated from this pain point yet.
            </Text>
          </Card>
        ) : (
          <Card padded={false}>
            {linkedIdeas.map((idea, idx) => (
              <View key={idea.id} className="px-4">
                <ListItem
                  title={idea.title}
                  subtitle={idea.oneLiner}
                  rightText={idea.status}
                  onPress={() => navigation.navigate('IdeaDetail', { id: idea.id })}
                />
                {idx < linkedIdeas.length - 1 ? (
                  <View className="h-px bg-border dark:bg-border" />
                ) : null}
              </View>
            ))}
          </Card>
        )}

        <View className="mt-6 gap-3">
          <Button
            title={generating ? 'Generating…' : 'Generate ideas with AI'}
            icon="sparkles-outline"
            variant="primary"
            fullWidth
            loading={generating}
            onPress={handleGenerate}
          />

          {painPoint.status === 'archived' ? (
            <Button
              title="Restore from archive"
              icon="arrow-undo-outline"
              variant="secondary"
              fullWidth
              onPress={() => {
                restore(painPoint.id);
              }}
            />
          ) : (
            <Button
              title="Archive"
              icon="archive-outline"
              variant="secondary"
              fullWidth
              onPress={handleArchive}
            />
          )}
        </View>
      </View>
    </Screen>
  );
}

export { LoadingView };