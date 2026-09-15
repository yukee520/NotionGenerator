import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import ModalSheet from './ModalSheet';
import { useTheme } from '@/hooks/useTheme';
import type { SelectOption } from '@/types/common';

export interface SelectProps<T extends string> {
  label?: string;
  value?: T;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  className?: string;
}

export default function Select<T extends string>({
  label,
  value,
  options,
  onChange,
  placeholder = 'Select…',
  error,
  required = false,
  className = '',
}: SelectProps<T>) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);
  const hasError = Boolean(error);

  const handleSelect = (val: T) => {
    onChange(val);
    setOpen(false);
  };

  return (
    <View className={`mb-3 ${className}`}>
      {label ? (
        <View className="flex-row items-center mb-1.5">
          <Text className="text-text dark:text-dark-text text-sm font-medium">
            {label}
          </Text>
          {required ? <Text className="text-danger text-sm ml-1">*</Text> : null}
        </View>
      ) : null}

      <Pressable
        onPress={() => setOpen(true)}
        className={`bg-card dark:bg-dark-card border ${
          hasError ? 'border-danger' : 'border-border dark:border-dark-border'
        } rounded-lg px-3 py-3 flex-row items-center justify-between`}
        accessibilityRole="button"
      >
        <Text
          className={`text-sm ${
            selected
              ? 'text-text dark:text-dark-text'
              : 'text-muted dark:text-dark-muted'
          }`}
          numberOfLines={1}
        >
          {selected ? selected.label : placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color={colors.muted} />
      </Pressable>

      {hasError ? (
        <Text className="text-danger text-xs mt-1">{error}</Text>
      ) : null}

      <ModalSheet visible={open} onClose={() => setOpen(false)} title={label ?? 'Select'}>
        {options.length === 0 ? (
          <View className="py-6 items-center">
            <Text className="text-muted dark:text-dark-muted text-sm">
              No options available
            </Text>
          </View>
        ) : (
          options.map((opt) => {
            const isActive = opt.value === value;
            return (
              <Pressable
                key={opt.value}
                onPress={() => handleSelect(opt.value)}
                className={`py-3 px-3 rounded-lg mb-1 flex-row items-center ${
                  isActive ? 'bg-primary/10' : 'active:bg-border dark:active:bg-dark-border'
                }`}
              >
                <View className="flex-1">
                  <Text
                    className={`text-sm ${
                      isActive
                        ? 'text-primary font-semibold'
                        : 'text-text dark:text-dark-text'
                    }`}
                  >
                    {opt.label}
                  </Text>
                  {opt.description ? (
                    <Text className="text-muted dark:text-dark-muted text-xs mt-0.5">
                      {opt.description}
                    </Text>
                  ) : null}
                </View>
                {isActive ? (
                  <Ionicons name="checkmark" size={18} color={colors.primary} />
                ) : null}
              </Pressable>
            );
          })
        )}
      </ModalSheet>
    </View>
  );
}