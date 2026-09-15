import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import TabNavigator from './TabNavigator';
import DashboardScreen from '@/screens/DashboardScreen';
import PainPointFormScreen from '@/screens/PainPointFormScreen';
import PainPointDetailScreen from '@/screens/PainPointDetailScreen';
import IdeaDetailScreen from '@/screens/IdeaDetailScreen';
import BuildStatusScreen from '@/screens/BuildStatusScreen';
import TemplateDetailScreen from '@/screens/TemplateDetailScreen';
import TemplateTestScreen from '@/screens/TemplateTestScreen';
import GuideScreen from '@/screens/GuideScreen';
import PricingScreen from '@/screens/PricingScreen';
import ListingScreen from '@/screens/ListingScreen';
import MarketingListScreen from '@/screens/MarketingListScreen';
import MarketingDetailScreen from '@/screens/MarketingDetailScreen';
import PublishedScreen from '@/screens/PublishedScreen';
import SettingsScreen from '@/screens/SettingsScreen';
import AboutScreen from '@/screens/AboutScreen';

import { useTheme } from '@/hooks/useTheme';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { colors, isDark } = useTheme();

  return (
    <Stack.Navigator
      initialRouteName="Tabs"
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
        },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Tabs" component={TabNavigator} />
      <Stack.Screen name="PainPointForm" component={PainPointFormScreen} />
      <Stack.Screen name="PainPointDetail" component={PainPointDetailScreen} />
      <Stack.Screen name="IdeaDetail" component={IdeaDetailScreen} />
      <Stack.Screen name="BuildStatus" component={BuildStatusScreen} />
      <Stack.Screen name="TemplateDetail" component={TemplateDetailScreen} />
      <Stack.Screen name="TemplateTest" component={TemplateTestScreen} />
      <Stack.Screen name="Guide" component={GuideScreen} />
      <Stack.Screen name="Pricing" component={PricingScreen} />
      <Stack.Screen name="Listing" component={ListingScreen} />
      <Stack.Screen name="MarketingList" component={MarketingListScreen} />
      <Stack.Screen name="MarketingDetail" component={MarketingDetailScreen} />
      <Stack.Screen name="Published" component={PublishedScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="About" component={AboutScreen} />
    </Stack.Navigator>
  );
}