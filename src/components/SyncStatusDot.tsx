import React from 'react';
import { View, Text } from 'react-native';
import type { SyncStatus } from '@/types/common';

export interface SyncStatusDotProps {
  status: SyncStatus;
  withLabel?: boolean;
  className?: string;
}

const DOT: Record<SyncStatus, string> = {
  synced: 'bg-success',
  pending: 'bg-warning',
  failed: 'bg-danger',
};

const LABEL: Record<SyncStatus, string> = {
  synced: 'Synced',
  pending: 'Pending',
  failed: 'Failed',
};

const TEXT: Record<SyncStatus, string> = {
  synced: 'text-success',
  pending: 'text-warning',
  failed: 'text-danger',
};

export default function SyncStatusDot({
  status,
  withLabel = false,
  className = '',
}: SyncStatusDotProps) {
  return (
    <View className={`flex-row items-center ${className}`}>
      <View className={`w-2 h-2 rounded-full ${DOT[status]}`} />
      {withLabel ? (
        <Text className={`${TEXT[status]} text-[10px] font-medium ml-1.5`}>
          {LABEL[status]}
        </Text>
      ) : null}
    </View>
  );
}