import { configuredModels } from './config.mjs';
import { buildPromptHostState, compactState } from './host-state-context.mjs';
import { analyzeIntentProfile, summarizeIntentForState } from './intent-profile.mjs';
import {
  buildDeferredToolStep,
  buildMcpSpecificityStep,
  buildSkillWorkflowStep,
  hasSpecificContinuationSurface,
} from './route-guidance-capability-steps.mjs';
import {
  buildCurrentInfoStep,
  buildResearchStep,
  buildSwarmStep,
  buildTaskPlanningLine,
  buildTaskTrackingLine,
} from './route-guidance-execution-steps.mjs';

function buildRouteStepsFromIntent(signals, sessionContext = {}) {
  const config = configuredModels(sessionContext);
  const specialSteps = [];
  const specificContinuationSurface = hasSpecificContinuationSurface(sessionContext);

  const skillWorkflowStep = buildSkillWorkflowStep(signals, sessionContext);
  if (skillWorkflowStep) {
    specialSteps.push(skillWorkflowStep);
  }

  const mcpSpecificityStep = buildMcpSpecificityStep(signals, sessionContext);
  if (mcpSpecificityStep) {
    specialSteps.push(mcpSpecificityStep);
  }

  const deferredToolStep = buildDeferredToolStep(signals, sessionContext);
  if (deferredToolStep) {
    specialSteps.push(deferredToolStep);
  }

  if (signals.toolSearchFirst && specificContinuationSurface) {
    specialSteps.push('只有当更具体的 workflow / skill / MCP resource / deferred tool 线索都不覆盖时，再 `ToolSearch` 确认可用工具、原生 agent 类型、MCP 能力、权限与边界。');
  } else if (signals.toolSearchFirst) {
    specialSteps.push('先 `ToolSearch` 确认可用工具、原生 agent 类型、MCP 能力、权限与边界，不要凭记忆猜。');
  }

  if (signals.mcp) {
    specialSteps.push('如果任务涉及外部系统、数据源或集成平台，优先 `ListMcpResources` / `ReadMcpResource` 或对应 MCP / connected tools。');
  }

  const researchStep = buildResearchStep(signals);
  if (researchStep) {
    specialSteps.push(researchStep);
  }

  const currentInfoStep = buildCurrentInfoStep(signals, sessionContext);
  if (currentInfoStep) {
    specialSteps.push(currentInfoStep);
  }

  if (signals.boundedImplementation) {
    specialSteps.push('这是边界清晰的实现 / 修复 / 验证切片：优先直接推进，必要时再把单一切片交给 `General-Purpose`，不要先把探索、规划和实现混成一团。');
  }

  if (signals.compare || (signals.capabilityQuery && signals.questionIntent && signals.diagram)) {
    specialSteps.push('这是比较 / 选型 / 能力边界问题：默认直接给出“一句话判断 + 紧凑 Markdown 对比表 + 选型建议 / 结论”；除非用户明确要求方案设计或实施计划，不要先进入计划模式。');
  }

  if (signals.plan) {
    specialSteps.push(buildTaskPlanningLine(signals));
    specialSteps.push('只有当实现路径存在真实歧义、明显架构取舍，或需要先探索再定方案时，才进入计划模式；路径清晰时直接推进。');
  }

  if (signals.taskList) {
    specialSteps.push(buildTaskTrackingLine(signals));
  }

  if (signals.decisionHeavy && !signals.compare) {
    specialSteps.push('如果执行过程中出现单一真实阻塞选择，优先用 `AskUserQuestion` 发起结构化选择，不要把确认埋在长段落里。');
  }

  if (signals.swarm) {
    specialSteps.push(buildSwarmStep(signals));
  }

  if (signals.wantsWorktree) {
    specialSteps.push('用户明确要求隔离工作树：只有确实需要隔离工作区、分支式实验或并行修改时才进入 `EnterWorktree`。');
  }

  if (signals.diagram) {
    specialSteps.push('需要结构化表达：优先标准 Markdown 表格或图示；只有 Markdown 明显不适合时再使用 ASCII。');
  }

  if (signals.verify && specialSteps.length > 0) {
    specialSteps.push('收尾前先做最贴近改动范围的验证，再视结果扩大范围；未验证不要声称已完成。');
  }

  if (!specialSteps.length) {
    return '';
  }

  if (config.routingPolicy !== 'prompt-only') {
    specialSteps.push('如果原生 `Agent` 调用没有显式 `model`，优先与当前会话模型保持一致；显式传入的 `model` 永远优先。');
  }

  return [
    '按下面顺序优先决策：',
    '',
    '1. 可见文本默认跟随用户当前语言；不要输出“我打算 / 我应该 / let’s”这类内部思考式元叙述。',
    ...specialSteps.map((step, index) => `${index + 2}. ${step}`),
  ].join('\n');
}

export function buildRouteStateContext(prompt, sessionContext = {}) {
  const signals = analyzeIntentProfile(prompt, sessionContext);
  const routeSteps = buildRouteStepsFromIntent(signals, sessionContext);
  const hostState = buildPromptHostState(sessionContext);

  if (!routeSteps && !hostState) {
    return '';
  }

  const snapshot = compactState({
    operator_profile: 'opus-compatible-claude-code',
    intent: summarizeIntentForState(signals),
    ...hostState,
  });

  return [
    '# hello2cc routing',
    '',
    'Treat this as host-side routing guidance for Opus-compatible Claude Code behavior.',
    'Higher-priority user instructions, native tool contracts, and explicit tool inputs always win.',
    '',
    ...(routeSteps ? [routeSteps, ''] : []),
    '```json',
    JSON.stringify(snapshot, null, 2),
    '```',
  ].join('\n');
}
