import React from 'react';
import { View, ScrollView, RefreshControl, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';

export interface ScreenProps {
  children: React.ReactNode;
  scroll?: boolean;
  padded?: boolean;
  edges?: Edge[];
  refreshing?: boolean;
  onRefresh?: () => void;
  keyboardAvoid?: boolean;
  className?: string;
  contentClassName?: string;
}

export default function Screen({
  children,
  scroll = false,
  padded = true,
  edges = ['top', 'bottom'],
  refreshing,
  onRefresh,
  keyboardAvoid = false,
  className = '',
  contentClassName = '',
}: ScreenProps) {
  const padding = padded ? 'px-4' : '';
  const base = `flex-1 bg-background dark:bg-dark-background ${className}`;
  const contentBase = `${padding} ${contentClassName}`;

  const body = scroll ? (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1, paddingBottom: 32 }}
      className={contentBase}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh
          ? (
              <RefreshControl
                refreshing={Boolean(refreshing)}
                onRefresh={onRefresh}
                tintColor="#2563EB"
                colors={['#2563EB']}
              />
            )
          : undefined
      }
    >
      {children}
    </ScrollView>
  ) : (
    <View className={`flex-1 ${contentBase}`}>{children}</View>
  );

  const wrapped = keyboardAvoid ? (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {body}
    </KeyboardAvoidingView>
  ) : (
    body
  );

  return (
    <SafeAreaView className={base} edges={edges}>
      {wrapped}
    </SafeAreaView>
  );
}