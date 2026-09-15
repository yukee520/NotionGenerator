import type { PainPointSeverity } from '@/types/painPoint';
import type { Pricing } from '@/types/template';
import { nowIso } from '@/utils/date';

const SEVERITY_WEIGHT: Record<PainPointSeverity, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

const BASE_PRICE = 9;
const DB_VALUE = 3;
const VIEW_VALUE = 1;
const FORMULA_VALUE = 2;
const SEVERITY_VALUE = 2;

export interface PricingInput {
  totalDatabases: number;
  totalViews: number;
  totalFormulas: number;
  severity: PainPointSeverity;
  audienceSizeHint?: 'niche' | 'moderate' | 'broad';
  audienceSizeHintCustom?: string;
}

export interface PricingResult {
  suggested: number;
  rationale: string;
  complexityScore: number;
}

function audienceMultiplier(hint?: string): { factor: number; label: string } {
  if (!hint) return { factor: 1, label: 'standard audience' };
  const normalized = hint.toLowerCase();
  if (normalized.includes('niche') || normalized.includes('small')) {
    return { factor: 0.9, label: 'niche audience' };
  }
  if (normalized.includes('broad') || normalized.includes('large')) {
    return { factor: 1.2, label: 'broad audience' };
  }
  return { factor: 1, label: 'moderate audience' };
}

function roundToPrice(value: number): number {
  const candidates = [5, 7, 9, 12, 15, 19, 24, 29, 39, 49, 59, 79, 99];
  let closest = candidates[0];
  let bestDiff = Math.abs(value - closest);
  for (const c of candidates) {
    const diff = Math.abs(value - c);
    if (diff < bestDiff) {
      bestDiff = diff;
      closest = c;
    }
  }
  return closest;
}

export function computePricing(input: PricingInput): PricingResult {
  const severityScore = SEVERITY_WEIGHT[input.severity];
  const complexityScore =
    input.totalDatabases * DB_VALUE +
    input.totalViews * VIEW_VALUE +
    input.totalFormulas * FORMULA_VALUE +
    severityScore * SEVERITY_VALUE;

  const { factor, label } = audienceMultiplier(input.audienceSizeHintCustom);

  const raw = (BASE_PRICE + complexityScore) * factor;
  const suggested = roundToPrice(raw);

  const rationale = [
    `Base price $${BASE_PRICE}`,
    `+ ${input.totalDatabases} database(s) × $${DB_VALUE}`,
    `+ ${input.totalViews} view(s) × $${VIEW_VALUE}`,
    `+ ${input.totalFormulas} formula(s) × $${FORMULA_VALUE}`,
    `+ severity "${input.severity}" × $${SEVERITY_VALUE}`,
    `× ${factor.toFixed(2)} (${label})`,
    `→ rounded to $${suggested}`,
  ].join('\n');

  return { suggested, rationale, complexityScore };
}

export function computePricingFromCounts(args: {
  severity: PainPointSeverity;
  totalDatabases: number;
  totalViews: number;
  totalFormulas: number;
  audienceSizeHint?: string;
}): PricingResult {
  return computePricing({
    severity: args.severity,
    totalDatabases: args.totalDatabases,
    totalViews: args.totalViews,
    totalFormulas: args.totalFormulas,
    audienceSizeHintCustom: args.audienceSizeHint,
  });
}

export function buildPricing(args: {
  severity: PainPointSeverity;
  totalDatabases: number;
  totalViews: number;
  totalFormulas: number;
  audienceSizeHint?: string;
  currency?: string;
}): Pricing {
  const result = computePricingFromCounts(args);
  return {
    suggested: result.suggested,
    currency: args.currency ?? 'USD',
    rationale: result.rationale,
    complexityScore: result.complexityScore,
    computedAt: nowIso(),
  };
}

export function effectivePrice(pricing?: Pricing): number | undefined {
  if (!pricing) return undefined;
  if (typeof pricing.manualOverride === 'number') return pricing.manualOverride;
  return pricing.suggested;
}