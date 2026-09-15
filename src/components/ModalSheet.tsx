import React from 'react';
import { Modal, View, Text, Pressable, ScrollView } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '@/hooks/useTheme';

export interface ModalSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  scroll?: boolean;
  className?: string;
}

export default function ModalSheet({
  visible,
  onClose,
  title,
  children,
  scroll = true,
  className = '',
}: ModalSheetProps) {
  const { colors } = useTheme();

  const content = scroll ? (
    <ScrollView
      contentContainerStyle={{ paddingBottom: 32 }}
      className="px-4 pt-4"
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  ) : (
    <View className="px-4 pt-4 flex-1">{children}</View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View
        className={`flex-1 bg-background dark:bg-dark-background ${className}`}
      >
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-border dark:border-dark-border">
          <Text className="text-text dark:text-dark-text text-base font-semibold flex-1">
            {title ?? ''}
          </Text>
          <Pressable
            onPress={onClose}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <Ionicons name="close" size={22} color={colors.text} />
          </Pressable>
        </View>
        {content}
      </View>
    </Modal>
  );
}