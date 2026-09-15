import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

export interface MarkdownViewProps {
  markdown: string;
  className?: string;
}

interface Block {
  type: 'h1' | 'h2' | 'h3' | 'paragraph' | 'bullet' | 'numbered' | 'divider' | 'quote';
  text: string;
  index: number;
}

function parseMarkdown(markdown: string): Block[] {
  const lines = markdown.split('\n');
  const blocks: Block[] = [];
  let numberedIndex = 0;

  for (let i = 0; i < lines.length; i += 1) {
    const raw = lines[i];
    const line = raw.trim();

    if (line.length === 0) {
      continue;
    }

    if (/^---+$/.test(line) || /^\*\*\*+$/.test(line)) {
      blocks.push({ type: 'divider', text: '', index: i });
      numberedIndex = 0;
      continue;
    }

    const headingMatch = /^(#{1,6})\s+(.*)$/.exec(line);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const text = headingMatch[2].trim();
      const type = level <= 1 ? 'h1' : level === 2 ? 'h2' : 'h3';
      blocks.push({ type, text, index: i });
      numberedIndex = 0;
      continue;
    }

    const bulletMatch = /^[-*+]\s+(.*)$/.exec(line);
    if (bulletMatch) {
      blocks.push({ type: 'bullet', text: bulletMatch[1].trim(), index: i });
      continue;
    }

    const numberedMatch = /^\d+\.\s+(.*)$/.exec(line);
    if (numberedMatch) {
      numberedIndex += 1;
      blocks.push({
        type: 'numbered',
        text: numberedMatch[1].trim(),
        index: numberedIndex,
      });
      continue;
    }

    const quoteMatch = /^>\s?(.*)$/.exec(line);
    if (quoteMatch) {
      blocks.push({ type: 'quote', text: quoteMatch[1].trim(), index: i });
      continue;
    }

    blocks.push({ type: 'paragraph', text: line, index: i });
    numberedIndex = 0;
  }

  return blocks;
}

function stripInlineMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/_(.*?)_/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1');
}

export default function MarkdownView({ markdown, className = '' }: MarkdownViewProps) {
  const { colors } = useTheme();
  const blocks = React.useMemo(() => parseMarkdown(markdown ?? ''), [markdown]);

  if (blocks.length === 0) {
    return (
      <View className={`py-6 items-center ${className}`}>
        <Text className="text-muted dark:text-dark-muted text-sm">
          Nothing to display yet.
        </Text>
      </View>
    );
  }

  return (
    <View className={className}>
      {blocks.map((block, idx) => {
        const key = `${block.type}-${idx}`;
        if (block.type === 'divider') {
          return (
            <View
              key={key}
              className="h-px bg-border dark:bg-dark-border my-3"
            />
          );
        }
        if (block.type === 'h1') {
          return (
            <Text
              key={key}
              className="text-text dark:text-dark-text text-xl font-bold mt-4 mb-2"
            >
              {stripInlineMarkdown(block.text)}
            </Text>
          );
        }
        if (block.type === 'h2') {
          return (
            <Text
              key={key}
              className="text-text dark:text-dark-text text-lg font-semibold mt-3 mb-1.5"
            >
              {stripInlineMarkdown(block.text)}
            </Text>
          );
        }
        if (block.type === 'h3') {
          return (
            <Text
              key={key}
              className="text-text dark:text-dark-text text-base font-semibold mt-3 mb-1"
            >
              {stripInlineMarkdown(block.text)}
            </Text>
          );
        }
        if (block.type === 'bullet') {
          return (
            <View key={key} className="flex-row mb-1.5">
              <Text
                className="text-text dark:text-dark-text text-sm mr-2"
                style={{ color: colors.primary }}
              >
                •
              </Text>
              <Text className="text-text dark:text-dark-text text-sm flex-1 leading-6">
                {stripInlineMarkdown(block.text)}
              </Text>
            </View>
          );
        }
        if (block.type === 'numbered') {
          return (
            <View key={key} className="flex-row mb-1.5">
              <Text
                className="text-sm mr-2 font-semibold"
                style={{ color: colors.primary }}
              >
                {block.index}.
              </Text>
              <Text className="text-text dark:text-dark-text text-sm flex-1 leading-6">
                {stripInlineMarkdown(block.text)}
              </Text>
            </View>
          );
        }
        if (block.type === 'quote') {
          return (
            <View
              key={key}
              className="border-l-4 border-primary/40 pl-3 my-2 bg-primary/5 dark:bg-primary/10 py-2 rounded-r"
            >
              <Text className="text-text dark:text-dark-text text-sm italic leading-6">
                {stripInlineMarkdown(block.text)}
              </Text>
            </View>
          );
        }
        return (
          <Text
            key={key}
            className="text-text dark:text-dark-text text-sm leading-6 mb-2"
          >
            {stripInlineMarkdown(block.text)}
          </Text>
        );
      })}
    </View>
  );
}