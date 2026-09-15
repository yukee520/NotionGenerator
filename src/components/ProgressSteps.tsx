import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '@/hooks/useTheme';

export interface ProgressStep {
  key: string;
  label: string;
}

export interface ProgressStepsProps {
  steps: ProgressStep[];
  currentIndex: number;
  className?: string;
}

export default function ProgressSteps({
  steps,
  currentIndex,
  className = '',
}: ProgressStepsProps) {
  const { colors } = useTheme();

  return (
    <View className={`my-3 ${className}`}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ alignItems: 'center', paddingRight: 8 }}
      >
        {steps.map((step, idx) => {
          const isDone = idx < currentIndex;
          const isActive = idx === currentIndex;
          const isLast = idx === steps.length - 1;

          const circleColor = isDone
            ? colors.success
            : isActive
            ? colors.primary
            : colors.border;

          const textColor = isDone
            ? colors.success
            : isActive
            ? colors.primary
            : colors.muted;

          return (
            <View key={step.key} className="flex-row items-center">
              <View className="items-center" style={{ width: 76 }}>
                <View
                  className="w-7 h-7 rounded-full items-center justify-center mb-1"
                  style={{ backgroundColor: circleColor }}
                >
                  {isDone ? (
                    <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                  ) : (
                    <Text className="text-white text-xs font-bold">{idx + 1}</Text>
                  )}
                </View>
                <Text
                  className="text-[10px] font-medium text-center"
                  style={{ color: textColor }}
                  numberOfLines={2}
                >
                  {step.label}
                </Text>
              </View>

              {!isLast ? (
                <View
                  className="h-0.5 w-4 mb-4"
                  style={{
                    backgroundColor: isDone ? colors.success : colors.border,
                  }}
                />
              ) : null}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}