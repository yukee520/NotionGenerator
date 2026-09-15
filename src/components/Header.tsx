import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '@/hooks/useTheme';

export interface HeaderAction {
  icon: string;
  onPress: () => void;
  accessibilityLabel?: string;
  tint?: string;
}

export interface HeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  right?: HeaderAction[];
  className?: string;
}

export default function Header({
  title,
  subtitle,
  showBack = false,
  onBack,
  right,
  className = '',
}: HeaderProps) {
  const navigation = useNavigation();
  const { colors } = useTheme();

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    if (navigation.canGoBack()) navigation.goBack();
  };

  return (
    <View
      className={`flex-row items-center px-4 py-3 bg-background dark:bg-dark-background border-b border-border dark:border-dark-border ${className}`}
    >
      {showBack ? (
        <Pressable
          onPress={handleBack}
          className="mr-3 p-1"
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
      ) : null}

      <View className="flex-1">
        <Text
          className="text-text dark:text-dark-text text-lg font-semibold"
          numberOfLines={1}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            className="text-muted dark:text-dark-muted text-xs mt-0.5"
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>

      {right && right.length > 0 ? (
        <View className="flex-row items-center">
          {right.map((action, idx) => (
            <Pressable
              key={`${action.icon}-${idx}`}
              onPress={action.onPress}
              hitSlop={10}
              className="ml-3 p-1"
              accessibilityRole="button"
              accessibilityLabel={action.accessibilityLabel ?? action.icon}
            >
              <Ionicons
                name={action.icon}
                size={22}
                color={action.tint ?? colors.text}
              />
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}