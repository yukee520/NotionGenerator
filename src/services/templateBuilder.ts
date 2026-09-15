import type { ID } from '@/types/common';
import type { Idea } from '@/types/idea';
import type { BuildSheet, BuildSheetSection, Template } from '@/types/template';
import type { BuildStatusResponse } from '@/types/n8n';
import { buildTemplate as apiBuildTemplate, getBuildStatus } from '@/api/n8n';
import { normalizeError, userMessage } from '@/api/errors';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useIdeaStore } from '@/store/useIdeaStore';
import { useTemplateStore } from '@/store/useTemplateStore';
import { enqueueTask } from './syncQueue';
import { logEvent } from './sheetLogger';
import { newId } from '@/utils/id';
import { nowIso } from '@/utils/date';
import { logger } from '@/utils/logger';

export interface BuildStartResult {
  template: Template;
  jobId?: string;
  source: 'n8n' | 'local-heuristic';
  error?: string;
}

function makeSection(
  title: string,
  type: BuildSheetSection['type'],
  description: string,
): BuildSheetSection {
  return {
    id: newId('sec'),
    title,
    type,
    description,
  };
}

function heuristicBuildSheet(idea: Idea): BuildSheet {
  const sections: BuildSheetSection[] = [
    makeSection('Welcome / Instructions', 'page', 'How to duplicate and use the template.'),
    ...idea.proposedSections.map((s) =>
      makeSection(s.title, 'database', s.description),
    ),
    makeSection('Archive', 'toggle', 'Collapsed archive for completed items.'),
    makeSection('Resources', 'page', 'Links, templates, and references.'),
  ];
  const totalDatabases = sections.filter((s) => s.type === 'database').length;
  const totalViews = totalDatabases * 2;
  const totalFormulas = totalDatabases;
  return {
    id: newId('sheet'),
    sections,
    totalDatabases,
    totalViews,
    totalFormulas,
    estimatedBuildMinutes: 10 + totalDatabases * 5,
    generatedAt: nowIso(),
  };
}

function responseToBuildSheet(res: BuildStatusResponse): BuildSheet | undefined {
  if (!res.sections) return undefined;
  const sections: BuildSheetSection[] = res.sections.map((s) => ({
    id: newId('sec'),
    title: s.title,
    type: s.type,
    description: s.description,
    properties: s.properties,
    sampleRows: s.sampleRows,
    formulas: s.formulas,
    relations: s.relations,
    rollups: s.rollups,
  }));
  return {
    id: newId('sheet'),
    sections,
    totalDatabases: res.totalDatabases ?? 0,
    totalViews: res.totalViews ?? 0,
    totalFormulas: res.totalFormulas ?? 0,
    estimatedBuildMinutes: res.estimatedBuildMinutes ?? 15,
    generatedAt: nowIso(),
  };
}

export async function startTemplateBuild(ideaId: ID): Promise<BuildStartResult> {
  const settings = useSettingsStore.getState().settings;
  const ideaStore = useIdeaStore.getState();
  const templateStore = useTemplateStore.getState();

  const idea = ideaStore.getById(ideaId);
  if (!idea) {
    throw new Error('Idea not found.');
  }

  let template = templateStore.getByIdeaId(ideaId);
  if (!template) {
    template = templateStore.create({
      ideaId: idea.id,
      title: idea.title,
      oneLiner: idea.oneLiner,
      audience: idea.audience,
    });
    ideaStore.setTemplateId(idea.id, template.id);
  }

  if (settings.n8nWebhookUrl) {
    try {
      const res = await apiBuildTemplate(settings, {
        ideaId: idea.id,
        title: idea.title,
        oneLiner: idea.oneLiner,
        problem: idea.problem,
        audience: idea.audience,
        proposedSections: idea.proposedSections,
      });
      templateStore.setJobId(template.id, res.jobId);
      void logEvent({
        eventType: 'template',
        entityId: template.id,
        title: template.title,
        stage: 'building',
        status: 'queued',
        payload: { jobId: res.jobId, source: 'n8n' },
      });
      return { template, jobId: res.jobId, source: 'n8n' };
    } catch (err) {
      const message = userMessage(err);
      logger.warn('n8n buildTemplate failed, falling back to local sheet', message);
      enqueueTask('build_template', template.id, {
        ideaId: idea.id,
        title: idea.title,
        oneLiner: idea.oneLiner,
        problem: idea.problem,
        audience: idea.audience,
        proposedSections: idea.proposedSections,
      });
      const sheet = heuristicBuildSheet(idea);
      templateStore.setBuildSheet(template.id, sheet);
      void logEvent({
        eventType: 'template',
        entityId: template.id,
        title: template.title,
        stage: 'built_pending_test',
        status: 'local',
        payload: { source: 'local-heuristic' },
      });
      return { template, source: 'local-heuristic', error: message };
    }
  }

  const sheet = heuristicBuildSheet(idea);
  templateStore.setBuildSheet(template.id, sheet);
  void logEvent({
    eventType: 'template',
    entityId: template.id,
    title: template.title,
    stage: 'built_pending_test',
    status: 'local',
    payload: { source: 'local-heuristic' },
  });
  return { template, source: 'local-heuristic' };
}

export interface PollResult {
  status: BuildStatusResponse['status'];
  progress: number;
  message?: string;
  notionUrl?: string;
  buildSheet?: BuildSheet;
  error?: string;
}

export async function pollBuildStatus(
  templateId: ID,
  jobId: string,
): Promise<PollResult> {
  const settings = useSettingsStore.getState().settings;
  const templateStore = useTemplateStore.getState();
  try {
    const res = await getBuildStatus(settings, jobId);
    if (res.status === 'completed') {
      const sheet = responseToBuildSheet(res);
      if (sheet) templateStore.setBuildSheet(templateId, sheet);
      if (res.notionUrl) templateStore.setNotionUrl(templateId, res.notionUrl);
      void logEvent({
        eventType: 'template',
        entityId: templateId,
        title: templateStore.getById(templateId)?.title ?? '',
        stage: 'built_pending_test',
        status: 'completed',
        payload: { jobId, notionUrl: res.notionUrl ?? null },
      });
    } else if (res.status === 'failed') {
      void logEvent({
        eventType: 'template',
        entityId: templateId,
        title: templateStore.getById(templateId)?.title ?? '',
        stage: 'building',
        status: 'failed',
        payload: { jobId, error: res.error ?? 'unknown' },
      });
    }
    return {
      status: res.status,
      progress: res.progress,
      message: res.message,
      notionUrl: res.notionUrl,
      buildSheet: res.status === 'completed' ? responseToBuildSheet(res) : undefined,
      error: res.error,
    };
  } catch (err) {
    return {
      status: 'failed',
      progress: 0,
      error: normalizeError(err).message,
    };
  }
}