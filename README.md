# hello2cc

`hello2cc` 是一个面向 Claude Code 的“原生优先”插件，目标不是替你绑定 provider，也不是强行规定你必须使用哪一家模型，而是让**已经通过你自己的网关、provider profile、ccswitch 或模型映射层接入 Claude Code 的第三方模型**，尽可能获得接近原生 `Opus / Sonnet` 的使用体验。

它只做一件事：在不侵入 Claude Code 原生工作流的前提下，补齐第三方模型在任务编排、原生 Agent 调用、验证链路和输出风格上的体验差异。

## 为什么要做 hello2cc

很多“把第三方模型接进 Claude Code”的方案，最后都会退化成下面两种体验：

1. 只是在 prompt 里提醒模型“记得先去加载某个 skill”
2. 通过 skills / 自定义 agents 去模拟工作流，但和 Claude Code 原生能力脱节

`hello2cc` 的目标不是再造一层伪代理系统，而是做一个足够薄、足够稳的 orchestration shim：

- 复杂任务优先进入 Claude Code 原生计划与任务链路
- 研究型任务优先走原生 `Claude Code Guide`、`Explore`、`Plan`
- 并行任务优先走原生 `Agent` 或 `TeamCreate + Task*`
- 原生 `Agent` 调用缺少 `model` 时静默补齐合适模型
- 通过一次性可选的 output style，减少“每次任务前都要加载 skill”的摩擦

## 核心能力

- 通过 `SessionStart` 和 `UserPromptSubmit` 提供原生优先的轻量编排提示
- 通过 `PreToolUse(Agent)` 为原生 `Agent` 调用静默注入 `model`
- 提供一次设置、持续生效的输出风格：`hello2cc Native`
- 保留手动 skills 作为备用入口，但不再把 skills 当作默认主路径
- 提供插件校验脚本与自动化测试，保证路由与 hook 行为可验证

## 设计原则

- **Provider 无关**：网关、provider profile、ccswitch、模型映射层都放在 `hello2cc` 之外
- **原生优先**：Claude Code 自带能力优先于 skills
- **低侵入**：只增加真正能提升编排体验的 hooks
- **默认静默**：安装并配置后，大部分行为应尽量无感
- **安全切换**：切换模型映射或切回原生模型时，不需要重写插件

## 架构

```text
第三方模型 API
        │
        ▼
网关 / provider profile / ccswitch
        │
        ▼
Claude Code 模型槽位映射
        │
        ▼
hello2cc
├─ SessionStart       -> 建立原生优先的编排基线
├─ UserPromptSubmit   -> 注入轻量路由提示
├─ PreToolUse(Agent)  -> 静默补齐 Agent.model
└─ output-styles      -> 一次设置后长期生效的输出风格
```

## 原生优先行为

启用插件后，`hello2cc` 会把模型尽量往 Claude Code 的原生能力上引导：

- 优先用 `ToolSearch` 判断能力是否存在，而不是靠猜
- 对非平凡任务优先进入 `EnterPlanMode()` 或 `TaskCreate / TaskUpdate / TaskList`
- 对开放式代码库探索优先使用 `Agent(Explore)` / `Agent(Plan)`
- 遇到 Claude Code / Agent SDK / hooks / MCP 问题时优先使用 `Agent(claude-code-guide)`
- 多线并行任务优先使用原生 `Agent` 并行调用或 `TeamCreate + Task*`
- 宣称完成前先做窄验证，避免“没验就交付”

现在的 `hello2cc` 已不再把 skills 当作默认执行路径。
skills 仍然可用，但定位是**手动备用入口**，而不是主工作流。

## 静默模型注入

`hello2cc` 最关键的兼容层是 `PreToolUse(Agent)`。

当 Claude Code 准备调用原生 `Agent`，但工具输入里**没有显式传入 `model`** 时，`hello2cc` 会根据插件配置自动补上合适的模型名。

### 默认映射

这些默认值来自当前代码实现：

| 原生目标 | 配置键 | 默认值 |
|---|---|---|
| 主会话 / 高能力兜底 | `primary_model` | `cc-gpt-5.4` |
| 通用子 Agent 兜底 | `subagent_model` | `cc-gpt-5.4` |
| `Claude Code Guide` | `guide_model` | `cc-gpt-5.4` |
| `Explore` | `explore_model` | `cc-gpt-5.3-codex-medium` |
| `Plan` | `plan_model` | `cc-gpt-5.4` |
| `General-Purpose` | `general_model` | `cc-gpt-5.4` |
| 带 `team_name` 的 teammates | `team_model` | 继承 `subagent_model` |

### 行为边界

- 如果 Claude Code 已经明确传入了 `model`，`hello2cc` **不会覆盖**
- 如果你切换了网关映射，或切回 Claude Code 原生一方模型，插件仍可继续工作
- `hello2cc` **不会替代** Claude Code 自己的模型配置系统
- `hello2cc` **不会绑定 provider**，只会在缺失时补齐 `Agent.model`

这也是它不会“永久劫持” Claude Code 模型栈的原因。

## 与原生槽位映射共存

如果你已经通过 `ccswitch`、provider profile 或网关，把第三方模型映射到了 Claude Code 的原生槽位（例如 `opus`、`sonnet`），`hello2cc` 也可以和这种方案共存。

推荐理解方式如下：

- **Claude Code 负责模型槽位选择**
- **你的网关/映射层负责把槽位转成真实第三方模型**
- **hello2cc 只负责在原生 Agent 调用里补齐缺失的 `model` 字段**

也就是说，`hello2cc` 的定位不是“重新定义模型系统”，而是“让第三方模型更顺滑地接入 Claude Code 原生工作流”。

如果你希望完全对齐原生槽位体验，可以把 `primary_model`、`subagent_model`、`guide_model`、`plan_model`、`general_model`、`team_model` 等配置成 `opus`，再把 `explore_model` 配成 `sonnet`；此时插件注入的是原生槽位名，最终仍由你的映射层决定实际落到哪一个第三方模型。

## 一次性输出风格

比起“每次任务前先加载一个 skill”，更接近理想体验的方案其实是：

**只做一次输出风格设置，然后长期静默生效。**

`hello2cc` 内置了 `hello2cc Native` 输出风格，会把模型输出往这些方向收敛：

- 简洁、结构化的响应
- 更贴近 Claude Code 原生工作流
- 只有在真正有帮助时才使用 ASCII 表格 / 图示
- 明确报告验证结果，而不是只给结论

一旦设置完成，后续会话会持续生效，不需要每次重新加载 skill。

## 安装

### 1）添加本地 marketplace

```text
/plugin marketplace add /absolute/path/to/hello2cc
```

### 2）安装插件

```text
/plugin install hello2cc@hello2cc-local
```

### 3）一次性启用输出风格

使用 `/config` 设置：

```json
{
  "outputStyle": "hello2cc Native"
}
```

完成后，一般不需要再在每次任务前手动加载 skill。

## 配置项

`hello2cc` 当前暴露以下配置键：

- `routing_policy`
- `primary_model`
- `subagent_model`
- `guide_model`
- `explore_model`
- `plan_model`
- `general_model`
- `team_model`

### 推荐策略

- `routing_policy = native-inject`

这会保持“原生优先”路由，并且只在 `Agent.model` 缺失时补齐。

### 方案一：直接使用第三方模型别名

适合你的网关本身已经支持诸如 `cc-gpt-5.4`、`cc-gpt-5.3-codex-medium` 这类模型名：

- `primary_model = cc-gpt-5.4`
- `subagent_model = cc-gpt-5.4`
- `guide_model = cc-gpt-5.4`
- `explore_model = cc-gpt-5.3-codex-medium`

### 方案二：兼容优先，直接对齐原生槽位

适合你已经用 `ccswitch` 或网关把第三方模型映射到了 Claude Code 原生槽位：

- `primary_model = opus`
- `subagent_model = opus`
- `guide_model = opus`
- `plan_model = opus`
- `general_model = opus`
- `team_model = opus`
- `explore_model = sonnet`

这种配置下，`hello2cc` 不会妨碍你在 Claude Code 中切回原生模型，也不会阻止你切换到其他映射后的模型；它只是补齐缺失的 `model` 字段。

## 手动备用 skills

这些 skills 仍然保留，但不再是默认主路径：

- `hello2cc:hello2cc-research`
- `hello2cc:hello2cc-orchestrate`
- `hello2cc:hello2cc-swarm`
- `hello2cc:hello2cc-diagram`
- `hello2cc:hello2cc-verify`

只有当你想显式走手动入口时，才需要主动使用它们。

## 仓库结构

```text
hello2cc/
├── .claude-plugin/
│   ├── marketplace.json
│   └── plugin.json
├── hooks/
│   └── hooks.json
├── output-styles/
│   └── hello2cc-native.md
├── scripts/
│   ├── lib/
│   │   ├── agent-models.mjs
│   │   ├── config.mjs
│   │   └── prompt-signals.mjs
│   ├── orchestrator.mjs
│   └── validate-plugin.mjs
├── skills/
│   ├── hello2cc-diagram/
│   ├── hello2cc-orchestrate/
│   ├── hello2cc-research/
│   ├── hello2cc-swarm/
│   └── hello2cc-verify/
├── tests/
│   └── orchestrator.test.mjs
├── CHANGELOG.md
├── LICENSE
├── package.json
└── README.md
```

## 本地验证

```bash
npm run validate
npm test
npm run check
```

## 当前限制

- `hello2cc` 可以增强显式的原生 `Agent` / `TeamCreate` 流程，但无法保证拦截 Claude Code 内部所有隐藏模型路径
- Claude Code 一方模型上的某些官方 `auto` 行为，依然是产品边界，无法被第三方 provider 完整克隆
- `ToolSearch` 等能力最终仍依赖你的网关和 provider 兼容性

## 版本

当前公开版本：`0.0.1`

## 许可证

Apache-2.0
