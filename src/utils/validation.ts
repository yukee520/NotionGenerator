import type { PainPointInput } from '@/types/painPoint';
import type { IdeaInput } from '@/types/idea';
import type { AppSettings } from '@/types/settings';

export function isNonEmpty(value: string | undefined | null): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

export function hasMinLength(value: string | undefined | null, min: number): boolean {
  return typeof value === 'string' && value.trim().length >= min;
}

export function isValidUrl(value: string | undefined | null): boolean {
  if (!isNonEmpty(value)) return false;
  try {
    const url = new URL(value as string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export interface ValidationErrors {
  [key: string]: string | undefined;
}

export function validatePainPoint(input: PainPointInput): ValidationErrors {
  const errors: ValidationErrors = {};
  if (!hasMinLength(input.title, 3)) {
    errors.title = 'Title must be at least 3 characters';
  }
  if (!hasMinLength(input.description, 10)) {
    errors.description = 'Describe the pain point in at least 10 characters';
  }
  if (!isNonEmpty(input.topic)) {
    errors.topic = 'Topic is required';
  }
  if (!isNonEmpty(input.audience)) {
    errors.audience = 'Audience is required';
  }
  if (input.sourceUrl && !isValidUrl(input.sourceUrl)) {
    errors.sourceUrl = 'Source URL must start with http:// or https://';
  }
  return errors;
}

export function validateIdea(input: IdeaInput): ValidationErrors {
  const errors: ValidationErrors = {};
  if (!hasMinLength(input.title, 3)) {
    errors.title = 'Title must be at least 3 characters';
  }
  if (!hasMinLength(input.oneLiner, 5)) {
    errors.oneLiner = 'One-liner must be at least 5 characters';
  }
  if (!hasMinLength(input.problem, 10)) {
    errors.problem = 'Problem description must be at least 10 characters';
  }
  if (!isNonEmpty(input.audience)) {
    errors.audience = 'Audience is required';
  }
  if (input.proposedSections.length === 0) {
    errors.proposedSections = 'Add at least one section';
  }
  return errors;
}

export function validateSettings(input: AppSettings): ValidationErrors {
  const errors: ValidationErrors = {};
  if (input.n8nWebhookUrl && !isValidUrl(input.n8nWebhookUrl)) {
    errors.n8nWebhookUrl = 'Webhook URL must start with http:// or https://';
  }
  if (input.syncIntervalSeconds < 10) {
    errors.syncIntervalSeconds = 'Sync interval must be at least 10 seconds';
  }
  if (input.syncIntervalSeconds > 3600) {
    errors.syncIntervalSeconds = 'Sync interval must be at most 3600 seconds';
  }
  return errors;
}

export function hasErrors(errors: ValidationErrors): boolean {
  return Object.values(errors).some((v) => typeof v === 'string' && v.length > 0);
}