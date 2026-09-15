import React from 'react';
import { ScrollView, View } from 'react-native';
import Chip, { ChipVariant } from './Chip';

export interface FilterOption<T extends string> {
  value: T;
  label: string;
  variant?: ChipVariant;
}

export interface FilterBarProps<T extends string> {
  options: FilterOption<T>[];
  selected: T[];
  onToggle: (value: T) => void;
  onClear?: () => void;
  className?: string;
}

export default function FilterBar<T extends string>({
  options,
  selected,
  onToggle,
  onClear,
  className = '',
}: FilterBarProps<T>) {
  return (
    <View className={`my-2 ${className}`}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingRight: 8 }}
      >
        {onClear && selected.length > 0 ? (
          <Chip
            label="Clear"
            variant="danger"
            onPress={onClear}
            className="mr-2"
          />
        ) : null}
        {options.map((opt) => {
          const isActive = selected.includes(opt.value);
          return (
            <Chip
              key={opt.value}
              label={opt.label}
              variant={isActive ? opt.variant ?? 'primary' : 'default'}
              onPress={() => onToggle(opt.value)}
              selected={isActive}
              className="mr-2"
            />
          );
        })}
      </ScrollView>
    </View>
  );
}