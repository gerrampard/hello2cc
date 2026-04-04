import { FORCED_OUTPUT_STYLE_NAME } from './config.mjs';
import { buildSessionStartHostState } from './host-state-context.mjs';
import {
  buildAgentSurfaceLines,
  buildObservedSurfaceLines,
  buildSkillWorkflowLines,
  buildSpecificityLines,
} from './session-guidance-capability-sections.mjs';
import {
  buildSessionModelLines,
  buildTeamCoordinationLines,
  buildToolSearchLines,
  buildWebSearchLines,
  buildWorkingHabitLines,
} from './session-guidance-core-sections.mjs';

export function buildSessionStartContext(sessionContext = {}) {
  const state = buildSessionStartHostState(sessionContext);

  return [
    '# hello2cc',
    '',
    'hello2cc 会让第三方模型在 Claude Code 里尽量按 Opus-compatible 的宿主原生方式工作：优先使用已暴露的工具、agent、skills / workflows、MCP 与计划协作能力，而不是退回模型自己的默认工作流。',
    '',
    '## 优先级',
    '- 用户当前消息、Claude Code 宿主规则、`CLAUDE.md` / `AGENTS.md` / 项目规则，始终高于 hello2cc。',
    '- hello2cc 只补充“如何更像 Claude Code 原生 Opus 一样工作”，不覆盖既有工作流、输出格式、命令路由、顶部/底部信息栏或项目约定。',
    '',
    ...buildSessionModelLines(sessionContext),
    '',
    ...buildWorkingHabitLines(),
    '',
    ...buildSpecificityLines(sessionContext),
    '',
    ...buildSkillWorkflowLines(sessionContext),
    '',
    ...buildObservedSurfaceLines(sessionContext),
    '',
    ...buildAgentSurfaceLines(sessionContext),
    '',
    ...buildTeamCoordinationLines(),
    '',
    ...buildToolSearchLines(),
    '',
    ...buildWebSearchLines(sessionContext),
    '',
    '## 输出风格',
    `- 当前插件输出风格：\`${FORCED_OUTPUT_STYLE_NAME}\`。`,
    '- 如果更高优先级规则没有指定格式，保持 Claude Code 原生、简洁、结果导向的表达。',
    '- 如果需要表格，优先 Markdown 表格；只有 Markdown 明显不适合时再使用 ASCII。',
    '',
    '## 宿主状态快照',
    '```json',
    JSON.stringify(state, null, 2),
    '```',
  ].join('\n');
}
