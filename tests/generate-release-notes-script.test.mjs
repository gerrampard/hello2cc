import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const scriptPath = resolve('scripts/generate-release-notes.mjs');

function git(cwd, ...args) {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

test('generate-release-notes falls back to commit subjects when changelog section is missing', () => {
  const repo = mkdtempSync(join(tmpdir(), 'hello2cc-release-notes-'));
  const changelogPath = join(repo, 'CHANGELOG.md');
  const readmePath = join(repo, 'README.md');
  const outputPath = join(repo, 'release-notes.md');

  git(repo, 'init');
  git(repo, 'config', 'user.email', 'test@example.com');
  git(repo, 'config', 'user.name', 'Test User');

  writeFileSync(changelogPath, '# Changelog\n\n## 1.0.0 - 2026-04-01\n\n- Initial release\n', 'utf8');
  writeFileSync(readmePath, 'initial\n', 'utf8');
  git(repo, 'add', 'CHANGELOG.md', 'README.md');
  git(repo, 'commit', '-m', 'feat: initial release');
  git(repo, 'tag', 'v1.0.0');

  writeFileSync(readmePath, 'patched\n', 'utf8');
  git(repo, 'add', 'README.md');
  git(repo, 'commit', '-m', 'fix: fallback release notes #12');
  git(repo, 'tag', 'v1.0.1');

  const result = spawnSync(process.execPath, [
    scriptPath,
    '--repo', 'example/repo',
    '--tag', 'v1.0.1',
    '--output', outputPath,
    '--changelog', 'CHANGELOG.md',
  ], {
    cwd: repo,
    encoding: 'utf8',
  });

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stderr, /Missing CHANGELOG section.*falling back/i);

  const notes = readFileSync(outputPath, 'utf8');
  assert.match(notes, /^## 1\.0\.1 - \d{4}-\d{2}-\d{2}/m);
  assert.match(notes, /- fix: fallback release notes #12/);
  assert.match(notes, /\*\*完整变更对比\*\*：https:\/\/github\.com\/example\/repo\/compare\/v1\.0\.0\.\.\.v1\.0\.1/);
});
