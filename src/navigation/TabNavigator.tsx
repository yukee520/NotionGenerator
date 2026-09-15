import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';

import DashboardScreen from '@/screens/DashboardScreen';
import PainPointListScreen from '@/screens/PainPointListScreen';
import IdeaListScreen from '@/screens/IdeaListScreen';
import TemplateListScreen from '@/screens/TemplateListScreen';
import MarketingListScreen from '@/screens/MarketingListScreen';
import { useTheme } from '@/hooks/useTheme';
import type { TabParamList } from './types';

const Tab = createBottomTabNavigator<TabParamList>();

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const ICONS: Record<keyof TabParamList, { focused: IconName; unfocused: IconName }> = {
  Dashboard: { focused: 'home', unfocused: 'home-outline' },
  PainPoints: { focused: 'bulb', unfocused: 'bulb-outline' },
  Ideas: { focused: 'sparkles', unfocused: 'sparkles-outline' },
  Templates: { focused: 'document-text', unfocused: 'document-text-outline' },
  Marketing: { focused: 'megaphone', unfocused: 'megaphone-outline' },
};

export default function TabNavigator() {
  const { colors, isDark } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
          borderTopColor: isDark ? '#334155' : '#E2E8F0',
          borderTopWidth: 1,
          paddingBottom: 6,
          paddingTop: 6,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
        tabBarIcon: ({ focused, color, size }) => {
          const icon = ICONS[route.name as keyof TabParamList];
          return (
            <Ionicons
              name={focused ? icon.focused : icon.unfocused}
              size={size}
              color={color}
            />
          );
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Home' }} />
      <Tab.Screen
        name="PainPoints"
        component={PainPointListScreen}
        options={{ title: 'Pain Points' }}
      />
      <Tab.Screen name="Ideas" component={IdeaListScreen} options={{ title: 'Ideas' }} />
      <Tab.Screen
        name="Templates"
        component={TemplateListScreen}
        options={{ title: 'Templates' }}
      />
      <Tab.Screen
        name="Marketing"
        component={MarketingListScreen}
        options={{ title: 'Marketing' }}
      />
    </Tab.Navigator>
  );
}