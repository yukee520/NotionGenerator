import { useCallback } from 'react';
import { Share, Platform } from 'react-native';
import Toast from 'react-native-toast-message';

export interface ShareArgs {
  title?: string;
  message: string;
  url?: string;
}

export interface UseShareResult {
  share: (args: ShareArgs) => Promise<void>;
}

export function useShare(): UseShareResult {
  const share = useCallback(async (args: ShareArgs) => {
    try {
      const message =
        Platform.OS === 'android' && args.url
          ? `${args.message}\n\n${args.url}`
          : args.message;
      await Share.share({
        title: args.title,
        message,
        url: args.url,
      });
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Sharing failed',
        text2: 'Please try again.',
      });
    }
  }, []);

  return { share };
}