import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import type { AppSettings } from '@/types/settings';
import { ApiError, normalizeError } from './errors';
import { logger } from '@/utils/logger';

const DEFAULT_TIMEOUT_MS = 30000;

export interface RequestOptions extends AxiosRequestConfig {
  webhookUrl: string;
  apiKey?: string;
}

function buildInstance(): AxiosInstance {
  const instance = axios.create({
    timeout: DEFAULT_TIMEOUT_MS,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });

  instance.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error: unknown) => Promise.reject(normalizeError(error)),
  );

  return instance;
}

const instance = buildInstance();

function ensureUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) {
    throw new ApiError(
      'client',
      'n8n webhook URL is not configured. Open Settings to add it.',
    );
  }
  if (!/^https?:\/\//i.test(trimmed)) {
    throw new ApiError(
      'client',
      'n8n webhook URL must start with http:// or https://',
    );
  }
  return trimmed;
}

async function post<TReq, TRes>(
  path: string,
  body: TReq,
  options: RequestOptions,
): Promise<TRes> {
  const base = ensureUrl(options.webhookUrl);
  const url = `${base.replace(/\/+$/, '')}${path.startsWith('/') ? path : `/${path}`}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (options.apiKey) {
    headers.Authorization = `Bearer ${options.apiKey}`;
  }

  try {
    logger.debug('POST', url);
    const response = await instance.post<TRes>(url, body, {
      ...options,
      headers: { ...headers, ...(options.headers ?? {}) },
    });
    return response.data;
  } catch (err) {
    logger.warn('POST failed', url, err);
    throw normalizeError(err);
  }
}

async function get<TRes>(
  path: string,
  options: RequestOptions & { params?: Record<string, string | number> },
): Promise<TRes> {
  const base = ensureUrl(options.webhookUrl);
  const url = `${base.replace(/\/+$/, '')}${path.startsWith('/') ? path : `/${path}`}`;

  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  if (options.apiKey) {
    headers.Authorization = `Bearer ${options.apiKey}`;
  }

  try {
    logger.debug('GET', url);
    const response = await instance.get<TRes>(url, {
      ...options,
      headers: { ...headers, ...(options.headers ?? {}) },
    });
    return response.data;
  } catch (err) {
    logger.warn('GET failed', url, err);
    throw normalizeError(err);
  }
}

export const apiClient = { post, get };

export function optionsFromSettings(settings: AppSettings): RequestOptions {
  return {
    webhookUrl: settings.n8nWebhookUrl,
    apiKey: settings.n8nApiKey,
  };
}