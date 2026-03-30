import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const scriptPath = resolve('scripts/task-lifecycle.mjs');

function run(payload) {
  return spawnSync(process.execPath, [scriptPath], {
    cwd: resolve('.'),
    input: JSON.stringify(payload),
    encoding: 'utf8',
  });
}

test('task-completed blocks vague task subjects', () => {
  const result = run({
    task_subject: 'fix',
    task_description: 'Implement something and test it.',
  });

  assert.equal(result.status, 2);
  assert.match(result.stderr, /too vague/i);
});

test('task-completed blocks missing completion evidence', () => {
  const result = run({
    task_subject: 'Inspect MCP routing for GitHub access',
    task_description: 'Analyze how the plugin should inspect GitHub via MCP and summarize the flow.',
  });

  assert.equal(result.status, 2);
  assert.match(result.stderr, /completion evidence/i);
});

test('task-completed accepts concrete deliverable with evidence', () => {
  const result = run({
    task_subject: 'Inspect MCP routing for GitHub access',
    task_description: 'Analyze MCP routing for GitHub access, summarize the path selection, and verify the findings with exact file paths and test evidence.',
  });

  assert.equal(result.status, 0, result.stderr);
});

test('task-completed accepts well-specified tasks', () => {
  const result = run({
    task_subject: 'Verify TeamCreate task flow',
    task_description: 'Review the TeamCreate task flow, document the result, and verify completion with exact paths and regression evidence.',
  });

  assert.equal(result.status, 0, result.stderr);
});
