import type { ID } from '@/types/common';
import type { Idea, IdeaStatus } from '@/types/idea';
import type { Template, TemplateStage } from '@/types/template';
import { TEMPLATE_STAGE_ORDER } from '@/types/template';
import type { MarketingContent, MarketingChannel } from '@/types/marketing';

export interface PipelineTransitionResult {
  allowed: boolean;
  reason?: string;
}

const IDEA_TRANSITIONS: Record<IdeaStatus, IdeaStatus[]> = {
  draft: ['approved', 'rejected'],
  approved: ['draft'],
  rejected: ['draft'],
};

const TEMPLATE_TRANSITIONS: Record<TemplateStage, TemplateStage[]> = {
  idea_approved: ['building'],
  building: ['built_pending_test'],
  built_pending_test: ['tested_approved', 'building'],
  tested_approved: ['guide_ready'],
  guide_ready: ['listed'],
  listed: ['published'],
  published: [],
};

export function canTransitionIdea(from: IdeaStatus, to: IdeaStatus): PipelineTransitionResult {
  if (from === to) return { allowed: true };
  const allowed = IDEA_TRANSITIONS[from] ?? [];
  if (!allowed.includes(to)) {
    return {
      allowed: false,
      reason: `Cannot move idea from "${from}" to "${to}".`,
    };
  }
  return { allowed: true };
}

export function canTransitionTemplate(
  from: TemplateStage,
  to: TemplateStage,
): PipelineTransitionResult {
  if (from === to) return { allowed: true };
  const allowed = TEMPLATE_TRANSITIONS[from] ?? [];
  if (!allowed.includes(to)) {
    return {
      allowed: false,
      reason: `Cannot move template from "${from}" to "${to}".`,
    };
  }
  return { allowed: true };
}

export function canApproveIdea(idea: Idea): PipelineTransitionResult {
  if (idea.status !== 'draft') {
    return { allowed: false, reason: 'Only draft ideas can be approved.' };
  }
  if (!idea.title.trim()) {
    return { allowed: false, reason: 'Idea must have a title.' };
  }
  if (!idea.oneLiner.trim()) {
    return { allowed: false, reason: 'Idea must have a one-liner.' };
  }
  if (idea.proposedSections.length === 0) {
    return { allowed: false, reason: 'Idea must have at least one proposed section.' };
  }
  if (idea.painPointIds.length === 0) {
    return { allowed: false, reason: 'Idea must link to at least one pain point.' };
  }
  return { allowed: true };
}

export function canBuildTemplate(template: Template): PipelineTransitionResult {
  if (template.stage !== 'idea_approved') {
    return { allowed: false, reason: 'Only idea-approved templates can be built.' };
  }
  return { allowed: true };
}

export function canApproveTesting(template: Template): PipelineTransitionResult {
  if (template.stage !== 'built_pending_test') {
    return { allowed: false, reason: 'Template must be built before testing.' };
  }
  const requiredQa = template.qaItems.filter((q) => q.required);
  const failed = requiredQa.filter((q) => q.status === 'fail');
  if (failed.length > 0) {
    return {
      allowed: false,
      reason: `${failed.length} required QA item(s) failed. Fix them before approving.`,
    };
  }
  const unchecked = requiredQa.filter((q) => q.status === 'unchecked');
  if (unchecked.length > 0) {
    return {
      allowed: false,
      reason: `${unchecked.length} required QA item(s) are still unchecked.`,
    };
  }
  return { allowed: true };
}

export function canGenerateGuide(template: Template): PipelineTransitionResult {
  if (template.stage !== 'tested_approved' && template.stage !== 'guide_ready') {
    return { allowed: false, reason: 'Template must be tested & approved first.' };
  }
  return { allowed: true };
}

export function canGeneratePricing(template: Template): PipelineTransitionResult {
  if (!template.buildSheet) {
    return { allowed: false, reason: 'Build sheet is required before pricing.' };
  }
  return { allowed: true };
}

export function canGenerateListing(template: Template): PipelineTransitionResult {
  if (template.stage !== 'guide_ready' && template.stage !== 'listed') {
    return { allowed: false, reason: 'Generate the guide and pricing first.' };
  }
  if (!template.pricing) {
    return { allowed: false, reason: 'Pricing is required before listing.' };
  }
  return { allowed: true };
}

export function canPublish(template: Template): PipelineTransitionResult {
  if (template.stage !== 'listed') {
    return { allowed: false, reason: 'Template must be listed before publishing.' };
  }
  if (!template.listing) {
    return { allowed: false, reason: 'Listing copy is required before publishing.' };
  }
  return { allowed: true };
}

export function canGenerateMarketing(template: Template): PipelineTransitionResult {
  if (template.stage !== 'published') {
    return { allowed: false, reason: 'Template must be published before marketing.' };
  }
  return { allowed: true };
}

export function stageIndex(stage: TemplateStage): number {
  return TEMPLATE_STAGE_ORDER.indexOf(stage);
}

export function isStageBefore(a: TemplateStage, b: TemplateStage): boolean {
  return stageIndex(a) < stageIndex(b);
}

export function isStageAfter(a: TemplateStage, b: TemplateStage): boolean {
  return stageIndex(a) > stageIndex(b);
}

export function suggestedNextStage(stage: TemplateStage): TemplateStage | undefined {
  const i = stageIndex(stage);
  if (i < 0 || i >= TEMPLATE_STAGE_ORDER.length - 1) return undefined;
  return TEMPLATE_STAGE_ORDER[i + 1];
}

export function canPostMarketing(content: MarketingContent): PipelineTransitionResult {
  if (!content.title.trim() && !content.body.trim()) {
    return { allowed: false, reason: 'Marketing content is empty.' };
  }
  if (content.status === 'posted') {
    return { allowed: false, reason: 'This content is already marked as posted.' };
  }
  return { allowed: true };
}

export function nextChannelToDraft(
  map: Partial<Record<MarketingChannel, MarketingContent>>,
  allChannels: MarketingChannel[],
): MarketingChannel | undefined {
  return allChannels.find((c) => !map[c] || map[c]?.status === 'draft');
}