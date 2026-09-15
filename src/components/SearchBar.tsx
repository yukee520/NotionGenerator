import React, { useEffect, useState } from 'react';
import { View, TextInput, Pressable } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '@/hooks/useTheme';

export interface SearchBarProps {
  value: string;
  onChange: (text: string) => void;
  placeholder?: string;
  className?: string;
}

export default function SearchBar({
  value,
  onChange,
  placeholder = 'Search…',
  className = '',
}: SearchBarProps) {
  const { colors } = useTheme();
  const [text, setText] = useState(value);

  useEffect(() => {
    setText(value);
  }, [value]);

  useEffect(() => {
    const handle = setTimeout(() => {
      if (text !== value) onChange(text);
    }, 250);
    return () => {
      clearTimeout(handle);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  return (
    <View
      className={`flex-row items-center bg-card dark:bg-dark-card border border-border dark:border-dark-border rounded-lg px-3 py-2 ${className}`}
    >
      <Ionicons name="search" size={16} color={colors.muted} />
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        className="flex-1 ml-2 text-text dark:text-dark-text text-sm py-0.5"
        returnKeyType="search"
      />
      {text.length > 0 ? (
        <Pressable onPress={() => setText('')} hitSlop={8}>
          <Ionicons name="close-circle" size={16} color={colors.muted} />
        </Pressable>
      ) : null}
    </View>
  );
}