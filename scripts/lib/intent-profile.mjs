import { extractIntentSlots, promptMentionsAny } from './intent-slots.mjs';

function appendTrack(tracks, value) {
  if (!tracks.includes(value)) {
    tracks.push(value);
  }
}

function compact(value) {
  if (Array.isArray(value)) {
    const items = value
      .map((item) => compact(item))
      .filter((item) => item !== undefined);
    return items.length ? items : undefined;
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value)
      .map(([key, nestedValue]) => [key, compact(nestedValue)])
      .filter(([, nestedValue]) => nestedValue !== undefined);

    if (!entries.length) return undefined;
    return Object.fromEntries(entries);
  }

  if (value === '' || value === null || value === undefined || value === false) {
    return undefined;
  }

  return value;
}

function buildTracks({ frontend, backend, research, implement, review, verify }) {
  const tracks = [];

  if (frontend) appendTrack(tracks, 'frontend');
  if (backend) appendTrack(tracks, 'backend');
  if (research && (implement || review || verify) && !tracks.includes('research')) {
    tracks.unshift('research');
  }
  if (implement && (research || verify || review)) {
    appendTrack(tracks, 'implementation');
  }
  if (review && !verify) {
    appendTrack(tracks, 'review');
  }
  if (verify) {
    appendTrack(tracks, 'verification');
  }

  return tracks;
}

function knownSurfaceMentioned(text, sessionContext = {}) {
  return promptMentionsAny(text, [
    ...(Array.isArray(sessionContext?.loadedCommandNames) ? sessionContext.loadedCommandNames : []),
    ...(Array.isArray(sessionContext?.workflowNames) ? sessionContext.workflowNames : []),
    ...(Array.isArray(sessionContext?.surfacedSkillNames) ? sessionContext.surfacedSkillNames : []),
  ]);
}

export function analyzeIntentProfile(prompt, sessionContext = {}) {
  const slots = extractIntentSlots(prompt);
  const actions = new Set(slots.actions);
  const topics = new Set(slots.topics);
  const collaboration = new Set(slots.collaboration);
  const structure = new Set(slots.structure);

  const questionIntent = slots.questionIntent;
  const research = actions.has('research');
  const implement = actions.has('implement');
  const verify = actions.has('verify');
  const review = actions.has('review');
  const planRequest = actions.has('plan');
  const compare = actions.has('compare');
  const currentInfo = actions.has('current_info');
  const frontend = topics.has('frontend');
  const backend = topics.has('backend');
  const mcp = topics.has('mcp');
  const skillSurface = topics.has('skills');
  const explicitHostFeature = topics.has('tools');
  const guideTopic =
    topics.has('claude_code') ||
    topics.has('hooks') ||
    topics.has('api_sdk') ||
    topics.has('settings');
  const workflowContinuation = structure.has('continuation') || knownSurfaceMentioned(slots.text, sessionContext);
  const explicitTeamWorkflow = collaboration.has('team') || collaboration.has('task_board');
  const coordinationHeavy = collaboration.has('task_board') || collaboration.has('owner_handoff');
  const explicitParallelIntent = collaboration.has('parallel') || explicitTeamWorkflow;
  const proactiveTeamWorkflow =
    !explicitTeamWorkflow &&
    coordinationHeavy &&
    (research || implement || verify || review);
  const teamSemantics = explicitTeamWorkflow || proactiveTeamWorkflow;
  const architectureHeavy = structure.has('architecture');
  const decisionHeavy = questionIntent && (compare || structure.has('decision') || architectureHeavy);
  const plan = planRequest || (
    architectureHeavy &&
    !questionIntent &&
    !compare &&
    (research || implement || verify || review || structure.has('scope_heavy'))
  );
  const taskList = plan || explicitTeamWorkflow || proactiveTeamWorkflow;
  const complex =
    structure.has('scope_heavy') ||
    architectureHeavy ||
    (frontend && backend && (research || implement || verify || review));
  const claudeGuide = guideTopic && (questionIntent || research || compare || planRequest);
  const capabilityQuery =
    (questionIntent && (guideTopic || explicitHostFeature || mcp || skillSurface || explicitTeamWorkflow || collaboration.has('worktree'))) ||
    (explicitHostFeature && questionIntent);
  const codeResearch = research && !capabilityQuery && !claudeGuide;
  const skillWorkflowLike = skillSurface || workflowContinuation;
  const tracks = buildTracks({ frontend, backend, research, implement, review, verify });
  const swarm = explicitParallelIntent || (tracks.length > 1 && proactiveTeamWorkflow);
  const boundedImplementation =
    implement &&
    !research &&
    !review &&
    !swarm &&
    tracks.length <= 1 &&
    !frontend &&
    !backend;

  return {
    questionIntent,
    compare,
    diagram: structure.has('diagram') || compare,
    research,
    currentInfo,
    swarm,
    teamWorkflow: explicitTeamWorkflow,
    proactiveTeamWorkflow,
    teamSemantics,
    verify,
    complex,
    tools: explicitHostFeature,
    claudeGuide,
    plan,
    taskList,
    implement,
    review,
    mcp,
    frontend,
    backend,
    decisionHeavy,
    capabilityQuery,
    codeResearch,
    skillSurface,
    skillWorkflowLike,
    workflowContinuation,
    tracks,
    boundedImplementation,
    toolSearchFirst: capabilityQuery,
    wantsWorktree: collaboration.has('worktree') || topics.has('worktree'),
    webSearchRetry: currentInfo && structure.has('retry'),
  };
}

export function summarizeIntentForState(intent = {}) {
  return compact({
    actions: [
      ...(intent.research ? ['research'] : []),
      ...(intent.implement ? ['implement'] : []),
      ...(intent.review ? ['review'] : []),
      ...(intent.verify ? ['verify'] : []),
      ...(intent.plan ? ['plan'] : []),
      ...(intent.currentInfo ? ['current_info'] : []),
    ],
    collaboration: compact({
      parallel_requested: intent.swarm || undefined,
      team_workflow: intent.teamWorkflow || undefined,
      proactive_team: intent.proactiveTeamWorkflow || undefined,
      wants_worktree: intent.wantsWorktree || undefined,
      task_board: intent.taskList || undefined,
    }),
    routing: compact({
      claude_guide: intent.claudeGuide || undefined,
      capability_query: intent.capabilityQuery || undefined,
      workflow_continuation: intent.workflowContinuation || undefined,
      compare: intent.compare || undefined,
      diagram: intent.diagram || undefined,
    }),
    tracks: intent.tracks,
  });
}
