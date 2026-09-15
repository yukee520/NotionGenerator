import React, { useEffect } from 'react';
import { StatusBar, LogBox } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';

import RootNavigator from '@/navigation/RootNavigator';
import { useTheme } from '@/hooks/useTheme';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useSyncQueue } from '@/hooks/useSyncQueue';
import { logEvent } from '@/services/sheetLogger';

import './global.css';

LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
]);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

function ThemedStatusBar() {
  const { isDark } = useTheme();
  return (
    <StatusBar
      barStyle={isDark ? 'light-content' : 'dark-content'}
      backgroundColor={isDark ? '#0F172A' : '#F8FAFC'}
      translucent={false}
    />
  );
}

function NavigationRoot() {
  const { isDark, colors } = useTheme();

  const navTheme = React.useMemo(() => {
    const base = isDark ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: colors.primary,
        background: colors.background,
        card: colors.card,
        text: colors.text,
        border: colors.border,
        notification: colors.danger,
      },
    };
  }, [isDark, colors]);

  return (
    <NavigationContainer theme={navTheme}>
      <RootNavigator />
    </NavigationContainer>
  );
}

function StartupEffects() {
  const hydrated = useSettingsStore((s) => s.hydrated);
  const onboarded = useSettingsStore((s) => s.settings.onboarded);

  useSyncQueue();

  useEffect(() => {
    if (!hydrated) return;
    void logEvent({
      eventType: 'template',
      entityId: 'app',
      title: 'App launched',
      stage: 'system',
      status: 'launch',
      payload: {
        onboarded,
        platform: 'android',
        at: new Date().toISOString(),
      },
    });
  }, [hydrated, onboarded]);

  return null;
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ThemedStatusBar />
          <NavigationRoot />
          <StartupEffects />
          <Toast position="bottom" bottomOffset={80} />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}