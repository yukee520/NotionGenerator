import { useCallback } from 'react';
import { Clipboard, Platform } from 'react-native';
import Toast from 'react-native-toast-message';

export interface UseClipboardResult {
  copy: (text: string, label?: string) => Promise<void>;
}

function isAvailable(): boolean {
  if (Platform.OS === 'web') return false;
  return typeof Clipboard?.setString === 'function';
}

export function useClipboard(): UseClipboardResult {
  const copy = useCallback(async (text: string, label = 'Copied to clipboard') => {
    try {
      if (!isAvailable()) {
        Toast.show({
          type: 'error',
          text1: 'Clipboard unavailable',
          text2: 'Your device does not support clipboard access.',
        });
        return;
      }
      Clipboard.setString(text);
      Toast.show({
        type: 'success',
        text1: label,
        visibilityTime: 1500,
      });
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Copy failed',
        text2: 'Please try again.',
      });
    }
  }, []);

  return { copy };
}