import { useEffect, useRef, useState } from 'react';

export interface UsePollingArgs<T> {
  fn: () => Promise<T>;
  enabled: boolean;
  intervalMs?: number;
  shouldStop?: (result: T) => boolean;
  onResult?: (result: T) => void;
  onError?: (error: unknown) => void;
}

export interface UsePollingResult<T> {
  data?: T;
  error?: unknown;
  loading: boolean;
  start: () => void;
  stop: () => void;
  refresh: () => Promise<void>;
}

export function usePolling<T>(args: UsePollingArgs<T>): UsePollingResult<T> {
  const { fn, enabled, intervalMs = 3000, shouldStop, onResult, onError } = args;

  const [data, setData] = useState<T | undefined>(undefined);
  const [error, setError] = useState<unknown>(undefined);
  const [loading, setLoading] = useState<boolean>(enabled);

  const stoppedRef = useRef<boolean>(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fnRef = useRef(fn);
  const shouldStopRef = useRef(shouldStop);
  const onResultRef = useRef(onResult);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    fnRef.current = fn;
  }, [fn]);
  useEffect(() => {
    shouldStopRef.current = shouldStop;
  }, [shouldStop]);
  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);
  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  const clearTimer = () => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const tick = async () => {
    if (stoppedRef.current) return;
    try {
      const result = await fnRef.current();
      if (stoppedRef.current) return;
      setData(result);
      setError(undefined);
      onResultRef.current?.(result);
      if (shouldStopRef.current?.(result)) {
        setLoading(false);
        return;
      }
    } catch (err) {
      if (stoppedRef.current) return;
      setError(err);
      onErrorRef.current?.(err);
    } finally {
      if (!stoppedRef.current) {
        timerRef.current = setTimeout(() => {
          void tick();
        }, intervalMs);
      }
    }
  };

  const start = () => {
    clearTimer();
    stoppedRef.current = false;
    setLoading(true);
    void tick();
  };

  const stop = () => {
    stoppedRef.current = true;
    clearTimer();
    setLoading(false);
  };

  const refresh = async (): Promise<void> => {
    try {
      const result = await fnRef.current();
      setData(result);
      setError(undefined);
    } catch (err) {
      setError(err);
    }
  };

  useEffect(() => {
    if (enabled) {
      start();
    } else {
      stop();
    }
    return () => {
      stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  return { data, error, loading, start, stop, refresh };
}