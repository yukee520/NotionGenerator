import type { ID } from '@/types/common';
import type { Idea, IdeaInput } from '@/types/idea';
import type { PainPoint } from '@/types/painPoint';
import type { GenerateIdeasRequest, GenerateIdeasResponse } from '@/types/n8n';
import { generateIdeas } from '@/api/n8n';
import { normalizeError, userMessage } from '@/api/errors';
import { useSettingsStore } from '@/store/useSettingsStore';
import { usePainPointStore } from '@/store/usePainPointStore';
import { useIdeaStore } from '@/store/useIdeaStore';
import { enqueueTask } from './syncQueue';
import { logEvent } from './sheetLogger';
import { newId } from '@/utils/id';
import { logger } from '@/utils/logger';

export interface GenerateIdeasArgs {
  painPointIds: ID[];
  count?: number;
  tone?: 'professional' | 'casual' | 'playful';
}

export interface GenerateIdeasResult {
  ideas: Idea[];
  source: 'n8n' | 'local-heuristic';
  error?: string;
}

function pickFields(p: PainPoint): GenerateIdeasRequest['painPoints'][number] {
  return {
    id: p.id,
    title: p.title,
    description: p.description,
    topic: p.topic,
    audience: p.audience,
    severity: p.severity,
    source: p.source,
  };
}

function slugifyTitle(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim();
}

function heuristicIdeas(painPoints: PainPoint[], count: number): IdeaInput[] {
  const results: IdeaInput[] = [];
  const primary = painPoints[0];
  const audience = primary.audience || 'general users';
  const topic = primary.topic || 'productivity';

  const templates: Array<{ title: string; oneLiner: string; problem: string; sections: string[] }> = [
    {
      title: `${topic} Command Center`,
      oneLiner: `A single Notion hub to tame ${topic} chaos for ${audience}.`,
      problem: `People in ${audience} struggle to keep ${topic} organized across tools.`,
      sections: ['Dashboard', 'Inbox', 'Projects Database', 'Weekly Review', 'Archive'],
    },
    {
      title: `${audience} ${topic} Tracker`,
      oneLiner: `Track every ${topic} item without spreadsheets.`,
      problem: `Tracking ${topic} manually is error-prone and demotivating.`,
      sections: ['Tracker Database', 'Quick Add', 'Progress View', 'Reports', 'Notes'],
    },
    {
      title: `${topic} Planning System`,
      oneLiner: `Plan, execute, and review ${topic} in one place.`,
      problem: `Planning ${topic} requires context-switching and lost notes.`,
      sections: ['Goals', 'Plan Board', 'Daily Log', 'Review', 'Resources'],
    },
    {
      title: `${audience} Habit Builder for ${topic}`,
      oneLiner: `Build consistent ${topic} habits with streaks and reflection.`,
      problem: `People lose momentum on ${topic} after a few days.`,
      sections: ['Habits Database', 'Streak Tracker', 'Daily Check-in', 'Reflections'],
    },
    {
      title: `${topic} Client Portal`,
      oneLiner: `A clean, shareable portal for ${audience} to manage ${topic}.`,
      problem: `Sharing ${topic} status with others is messy.`,
      sections: ['Overview', 'Deliverables', 'Timeline', 'Files', 'Updates'],
    },
  ];

  const limit = Math.max(1, Math.min(count, templates.length));
  for (let i = 0; i < limit; i += 1) {
    const t = templates[i];
    const sections = t.sections.map((title) => ({
      id: newId('sec'),
      title,
      description: `${title} section for ${topic}.`,
    }));
    results.push({
      title: t.title,
      oneLiner: t.oneLiner,
      problem: t.problem,
      audience,
      monetizationAngle: 'Sell as a ready-to-use Notion template on the marketplace.',
      proposedSections: sections,
      painPointIds: painPoints.map((p) => p.id),
      generatedBy: 'local-heuristic',
    });
  }
  return results;
}

function responseToInput(
  res: GenerateIdeasResponse,
  painPointIds: ID[],
): IdeaInput[] {
  return res.ideas.map((idea) => ({
    title: idea.title,
    oneLiner: idea.oneLiner,
    problem: idea.problem,
    audience: idea.audience,
    monetizationAngle: idea.monetizationAngle,
    proposedSections: idea.proposedSections.map((s) => ({
      id: newId('sec'),
      title: s.title,
      description: s.description,
    })),
    painPointIds,
    generatedBy: 'n8n',
  }));
}

export async function generateIdeasForPainPoints(
  args: GenerateIdeasArgs,
): Promise<GenerateIdeasResult> {
  const painPointStore = usePainPointStore.getState();
  const ideaStore = useIdeaStore.getState();
  const settings = useSettingsStore.getState().settings;

  const painPoints = painPointStore.getManyByIds(args.painPointIds);
  if (painPoints.length === 0) {
    return { ideas: [], source: 'local-heuristic', error: 'No pain points selected.' };
  }

  const count = args.count ?? 3;

  // Try n8n first
  if (settings.n8nWebhookUrl) {
    try {
      const response = await generateIdeas(settings, {
        painPoints: painPoints.map(pickFields),
        count,
        tone: args.tone,
      });
      const inputs = responseToInput(response, args.painPointIds);
      const created = ideaStore.addMany(inputs, 'n8n');
      painPoints.forEach((p) => painPointStore.linkIdea(p.id, created[0]?.id ?? ''));
      created.forEach((idea) => {
        void logEvent({
          eventType: 'idea',
          entityId: idea.id,
          title: idea.title,
          stage: 'idea',
          status: idea.status,
          payload: {
            source: 'n8n',
            oneLiner: idea.oneLiner,
            audience: idea.audience,
          },
        });
      });
      return { ideas: created, source: 'n8n' };
    } catch (err) {
      const message = userMessage(err);
      logger.warn('n8n generateIdeas failed, falling back to heuristic', message);
      enqueueTask('generate_ideas', args.painPointIds[0], {
        painPoints: painPoints.map(pickFields),
        count,
        tone: args.tone,
      });
      const inputs = heuristicIdeas(painPoints, count);
      const created = ideaStore.addMany(inputs, 'local-heuristic');
      created.forEach((idea) => {
        void logEvent({
          eventType: 'idea',
          entityId: idea.id,
          title: idea.title,
          stage: 'idea',
          status: idea.status,
          payload: { source: 'local-heuristic', oneLiner: idea.oneLiner },
        });
      });
      return { ideas: created, source: 'local-heuristic', error: message };
    }
  }

  // Pure local heuristic
  const inputs = heuristicIdeas(painPoints, count);
  const created = ideaStore.addMany(inputs, 'local-heuristic');
  created.forEach((idea) => {
    void logEvent({
      eventType: 'idea',
      entityId: idea.id,
      title: idea.title,
      stage: 'idea',
      status: idea.status,
      payload: { source: 'local-heuristic', oneLiner: idea.oneLiner },
    });
  });
  return { ideas: created, source: 'local-heuristic' };
}

export async function retryGenerateIdeas(args: GenerateIdeasArgs): Promise<GenerateIdeasResult> {
  return generateIdeasForPainPoints(args);
}

export function normalizeErrorSafe(err: unknown): string {
  return normalizeError(err).message;
}