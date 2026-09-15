import { useEffect, useState } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

export interface UseNetInfoResult {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: string;
  state: NetInfoState | null;
}

export function useNetInfo(): UseNetInfoResult {
  const [state, setState] = useState<NetInfoState | null>(null);

  useEffect(() => {
    let mounted = true;
    NetInfo.fetch().then((s) => {
      if (mounted) setState(s);
    });
    const unsubscribe = NetInfo.addEventListener((s) => {
      if (mounted) setState(s);
    });
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const isConnected = state?.isConnected ?? true;
  const isInternetReachable = state?.isInternetReachable ?? null;
  const type = state?.type ?? 'unknown';

  return { isConnected, isInternetReachable, type, state };
}