import React from 'react';
import { View, Text, Linking, Platform } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import Screen from '@/components/Screen';
import Header from '@/components/Header';
import Card from '@/components/Card';
import Button from '@/components/Button';
import SectionHeader from '@/components/SectionHeader';
import ListItem from '@/components/ListItem';

import { useTheme } from '@/hooks/useTheme';

import type { RootStackParamList } from '@/navigation/types';
import { APP_VERSION } from '@/utils/version';
import { useSettings } from '@/hooks/useSettings';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function AboutScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const { settings } = useSettings();

  const handleOpen = (url: string) => {
    void Linking.openURL(url);
  };

  return (
    <Screen scroll edges={['top']} padded={false}>
      <Header title="About" showBack />

      <View className="px-4 pt-6 items-center">
        <View className="w-20 h-20 rounded-2xl bg-primary items-center justify-center mb-4">
          <Ionicons name="sparkles" size={38} color="#FFFFFF" />
        </View>
        <Text className="text-text dark:text-dark-text text-xl font-bold">
          NotionGenerator
        </Text>
        <Text className="text-muted dark:text-dark-muted text-xs mt-1">
          Version {APP_VERSION} • {Platform.OS}
        </Text>
        <Text className="text-text dark:text-dark-text text-sm text-center mt-4 leading-6 px-4">
          Turn real-world pain points into sellable Notion templates — from idea to build,
          QA, guide, pricing, listing, and marketing.
        </Text>
      </View>

      <View className="px-4 mt-6">
        <SectionHeader title="Pipeline" />
        <Card>
          <ListItem
            title="Capture"
            subtitle="Log pain points from anywhere"
            leading={<Ionicons name="bulb-outline" size={18} color={colors.warning} />}
          />
          <View className="h-px bg-border dark:bg-border" />
          <ListItem
            title="Ideate"
            subtitle="AI-assisted Notion template ideas"
            leading={<Ionicons name="sparkles-outline" size={18} color={colors.primary} />}
          />
          <View className="h-px bg-border dark:bg-border" />
          <ListItem
            title="Build"
            subtitle="n8n creates the Notion template"
            leading={<Ionicons name="construct-outline" size={18} color={colors.info ?? colors.primary} />}
          />
          <View className="h-px bg-border dark:bg-border" />
          <ListItem
            title="Test & approve"
            subtitle="QA checklist before shipping"
            leading={<Ionicons name="clipboard-outline" size={18} color={colors.danger} />}
          />
          <View className="h-px bg-border dark:bg-border" />
          <ListItem
            title="Guide & price"
            subtitle="Buyer guide and auto-pricing"
            leading={<Ionicons name="book-outline" size={18} color={colors.success} />}
          />
          <View className="h-px bg-border dark:bg-border" />
          <ListItem
            title="Publish"
            subtitle="List on the marketplace"
            leading={<Ionicons name="storefront-outline" size={18} color={colors.primary} />}
          />
          <View className="h-px bg-border dark:bg-border" />
          <ListItem
            title="Market"
            subtitle="Auto-generate channel content"
            leading={<Ionicons name="megaphone-outline" size={18} color={colors.warning} />}
          />
        </Card>

        <SectionHeader title="Configuration" />
        <Card>
          <ListItem
            title="n8n webhook"
            rightText={settings.n8nWebhookUrl ? 'Configured' : 'Not set'}
            leading={
              <Ionicons
                name={settings.n8nWebhookUrl ? 'cloud-done-outline' : 'cloud-offline-outline'}
                size={18}
                color={settings.n8nWebhookUrl ? colors.success : colors.muted}
              />
            }
            showChevron
            onPress={() => navigation.navigate('Settings')}
          />
          <View className="h-px bg-border dark:bg-border" />
          <ListItem
            title="Google Sheet"
            rightText={settings.googleSheetId ? 'Connected' : 'Not set'}
            leading={
              <Ionicons
                name="grid-outline"
                size={18}
                color={settings.googleSheetId ? colors.success : colors.muted}
              />
            }
            showChevron
            onPress={() => navigation.navigate('Settings')}
          />
        </Card>

        <SectionHeader title="Links" />
        <Card>
          <ListItem
            title="Notion"
            subtitle="notion.so"
            leading={<Ionicons name="document-text-outline" size={18} color={colors.text} />}
            showChevron
            onPress={() => handleOpen('https://www.notion.so')}
          />
          <View className="h-px bg-border dark:bg-border" />
          <ListItem
            title="n8n"
            subtitle="n8n.io"
            leading={<Ionicons name="git-network-outline" size={18} color={colors.primary} />}
            showChevron
            onPress={() => handleOpen('https://n8n.io')}
          />
          <View className="h-px bg-border dark:bg-border" />
          <ListItem
            title="SocialClaw"
            subtitle="socialclaw.com"
            leading={<Ionicons name="megaphone-outline" size={18} color={colors.warning} />}
            showChevron
            onPress={() => handleOpen('https://www.socialclaw.com')}
          />
        </Card>

        <View className="mt-6 items-center">
          <Text className="text-muted dark:text-dark-muted text-[11px] text-center">
            Built locally. No accounts. No tracking.{'\n'}
            All data lives on your device.
          </Text>
        </View>

        <View className="mt-6 mb-8">
          <Button
            title="Back to settings"
            icon="arrow-back-outline"
            variant="ghost"
            fullWidth
            onPress={() => navigation.goBack()}
          />
        </View>
      </View>
    </Screen>
  );
}