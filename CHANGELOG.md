# Changelog

## 0.0.5 - 2026-03-30

- Added finer-grained native routing for `General-Purpose`, `TeamCreate`, `TaskCreate`, `TaskUpdate`, `TaskList`, and MCP-oriented workflows
- Added `SubagentStart` guidance for built-in `Explore`, `Plan`, and `general-purpose` agents
- Added `SubagentStop` / `TaskCompleted` guards so native teammates must return concrete summaries, exact paths, and completion evidence
- Added `scripts/claude-real-regression.mjs` and `npm run test:real` for local real-session Claude Code regression checks
- Made `UserPromptSubmit` routing robust to structured prompt payloads seen in real Claude Code sessions
- Kept the orchestration layer compatible with the currently installed Claude Code runtime by avoiding unsupported hook keys

## 0.0.2 - 2026-03-30

- Removed all bundled `skills/` from the core plugin to make `hello2cc` fully skill-free by default
- Stopped exposing `skills` in `.claude-plugin/plugin.json` and enforced this in validation
- Simplified runtime prompts and output style so the plugin no longer mentions manual skill fallbacks
- Updated tests, packaging metadata, and Chinese README for the skill-free native-first architecture

## 0.0.1 - 2026-03-30

- Switched `hello2cc` to a native-first routing model instead of skill-first prompt routing
- Fixed `PreToolUse(Agent)` model injection to use Claude Code’s documented permission fields
- Added one-time selectable `hello2cc Native` output style for silent, persistent formatting behavior
- Added automated validation and unit tests for routing and model injection
- Rewrote `README.md` for public release and GitHub distribution
