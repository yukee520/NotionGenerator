type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : false;

const LEVEL_PREFIX: Record<LogLevel, string> = {
  debug: '[debug]',
  info: '[info]',
  warn: '[warn]',
  error: '[error]',
};

function safeConsole(method: LogLevel, args: unknown[]): void {
  if (method === 'debug' && !isDev) return;
  const fn =
    method === 'debug'
      ? console.log
      : method === 'info'
      ? console.log
      : method === 'warn'
      ? console.warn
      : console.error;
  fn(LEVEL_PREFIX[method], ...args);
}

export const logger = {
  debug(...args: unknown[]): void {
    safeConsole('debug', args);
  },
  info(...args: unknown[]): void {
    safeConsole('info', args);
  },
  warn(...args: unknown[]): void {
    safeConsole('warn', args);
  },
  error(...args: unknown[]): void {
    safeConsole('error', args);
  },
};

export function describeError(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  try {
    return JSON.stringify(err);
  } catch {
    return 'Unknown error';
  }
}