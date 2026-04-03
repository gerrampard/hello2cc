import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';

const scriptPath = resolve('scripts/subagent-context.mjs');

function isolatedEnv(overrides = {}) {
  const root = mkdtempSync(join(tmpdir(), 'hello2cc-subagent-test-'));

  return {
    HOME: root,
    USERPROFILE: root,
    CLAUDE_PLUGIN_DATA: join(root, 'plugin-data'),
    CLAUDE_PLUGIN_ROOT: resolve('.'),
    ...overrides,
  };
}

function run(mode, payload, env = {}) {
  const result = spawnSync(process.execPath, [scriptPath, mode], {
    cwd: resolve('.'),
    env: {
      ...process.env,
      ...env,
    },
    input: payload ? JSON.stringify(payload) : '',
    encoding: 'utf8',
  });

  assert.equal(result.status, 0, result.stderr);
  return result.stdout ? JSON.parse(result.stdout) : {};
}

test('subagent-context keeps ordinary workers free of teammate overlay', () => {
  const env = isolatedEnv();
  const output = run('general', {
    session_id: 'plain-worker',
    agent_id: 'agent-1234',
    agent_type: 'general-purpose',
  }, env);
  const context = output.hookSpecificOutput.additionalContext;

  assert.match(context, /hello2cc General-Purpose mode/);
  assert.doesNotMatch(context, /teammate overlay/);
  assert.doesNotMatch(context, /TaskList/);
});

test('subagent-context reinforces team semantics for writable teammates', () => {
  const env = isolatedEnv();
  const output = run('general', {
    session_id: 'team-worker',
    agent_id: 'frontend-dev@delivery-squad',
    agent_type: 'general-purpose',
  }, env);
  const context = output.hookSpecificOutput.additionalContext;

  assert.match(context, /hello2cc teammate overlay/);
  assert.match(context, /frontend-dev/);
  assert.match(context, /delivery-squad/);
  assert.match(context, /SendMessage/);
  assert.match(context, /TaskList/);
  assert.match(context, /TaskGet/);
  assert.match(context, /TaskUpdate/);
  assert.match(context, /可写 teammate/);
  assert.match(context, /idle 是正常行为/);
});

test('subagent-context keeps read-only teammates on native read-only behavior', () => {
  const env = isolatedEnv();
  const output = run('explore', {
    session_id: 'team-explore',
    agent_id: 'researcher@delivery-squad',
    agent_type: 'Explore',
  }, env);
  const context = output.hookSpecificOutput.additionalContext;

  assert.match(context, /hello2cc Explore mode/);
  assert.match(context, /只读 teammate/);
  assert.match(context, /若任务其实需要改文件或验证，立刻用 `SendMessage` 告知 team lead 重新分派/);
});
