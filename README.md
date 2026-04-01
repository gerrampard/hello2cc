# hello2cc

`hello2cc` 是一个面向 Claude Code 的静默型、native-first 插件。

它不负责 provider、gateway、模型映射或账号权限；它负责的是：

**当你已经把第三方模型接进 Claude Code 后，让这些模型尽量像原生 Opus / Sonnet 一样使用 Claude Code。**

当前版本：`0.2.6`

---

## 它的目标

如果你已经通过下面任一方式把第三方模型接进 Claude Code：

- `ccswitch`
- provider profile / gateway
- 原生模型槽位映射
- 第三方 API 代理

那么 `hello2cc` 解决的是下一层问题：

> 如何让第三方模型在 Claude Code 里更像原生模型那样工作：
>
> - 更自然地发现并使用原生工具
> - 更自然地优先 `ToolSearch`
> - 更自然地进入 `EnterPlanMode()`、`Task*`
> - 更自然地使用 `Explore`、`Plan`、`General-Purpose`、`Claude Code Guide`
> - 更自然地并行使用原生 `Agent`
> - 只在真正需要团队编排时才使用 `TeamCreate` / `TeamDelete`
> - 更自然地使用 `SendMessage`、`TaskStop`、`AskUserQuestion`
> - 更自然地优先 MCP / connected tools / `ListMcpResources` / `ReadMcpResource`
> - 输出更接近 Claude Code 原生的简洁、结构化、行动优先风格

---

## 0.2.6 重点改进

`0.2.6` 重点修复了两个直接影响体验的问题：

- **普通对话更稳**：普通 subagent 场景不会再轻易被误判成 agent team
- **团队边界更清楚**：只有显式团队工作流才会继续走 `TeamCreate` / `team_name`
- **语言跟随更自然**：更倾向跟随用户当前语言输出，减少无故切到英文
- **输出更像原生**：减少“我打算 / let’s / 我正在思考”这类显眼的元叙述
- **仍然保持静默**：不需要 skills，不需要每次手动加载，不需要单独切换另一套工作流

---

## 装上以后你会得到什么

| 能力方向 | 体验效果 |
|---|---|
| 原生工具发现 | 更容易主动去找并使用 Claude Code 原生工具 |
| `ToolSearch` | 更自然地作为默认优先入口 |
| 规划与任务 | 复杂任务优先 `EnterPlanMode()`；只有真的需要任务盘时再用 `TaskCreate` / `TaskList` / `TaskUpdate` / `TaskGet` |
| 原生 agent | 更自然地用 `Explore` / `Plan` / `General-Purpose` / `Claude Code Guide` |
| 多代理协作 | 普通多线任务优先并行原生 `Agent`；续派优先 `SendMessage`，跑偏时再用 `TaskStop` |
| 团队能力 | 只有明确团队编排需求时才走 `TeamCreate` / `TeamDelete`，避免普通对话误进 team |
| 用户交互 | 只被一个真实决策阻塞时，更自然地用 `AskUserQuestion` |
| MCP / connected tools | 更自然地优先 `ListMcpResources` / `ReadMcpResource` 与原生 MCP 工具 |
| 输出风格 | 默认更接近 Claude Code 的简洁、结构化、行动优先表达；能用 Markdown 表格就优先用 Markdown 表格 |
| 语言表现 | 更倾向跟随用户当前语言输出，而不是无故切成英文 |

---

## 它不会做什么

`hello2cc` **不会**：

- 接管你的 provider / gateway / 模型槽位映射
- 替你强行打开宿主没有提供的能力
- 覆盖你已经显式传入的 `model`
- 把 Claude Code 变成另一套“插件专属工作流”
- 要求你每轮手动加载 skills
- 覆盖 `CLAUDE.md` / `AGENTS.md` / 项目规则中已经明确写好的格式、路由和行为

它追求的是：

**在不打扰 Claude Code 原生工作方式的前提下，静默增强第三方模型的原生感。**

---

## 适合谁用

如果你符合下面任一场景，`hello2cc` 会很适合：

- 你已经把第三方模型映射到了 Claude Code 的 `opus / sonnet / haiku` 槽位
- 你希望第三方模型在 Claude Code 里更主动使用工具、计划、子代理、MCP
- 你不想每次手动加载 skills
- 你希望外接模型尽可能像原生 Opus 一样静默、无感地工作
- 你希望普通对话不会误触发 agent team
- 你希望中文会话尽量保持中文输出风格

---

## 安装

### 1）添加本地 marketplace

```text
/plugin marketplace add /path/to/hello2cc
```

### 2）安装插件

```text
/plugin install hello2cc@hello2cc-local
```

### 3）新开会话后直接使用

安装后不需要再加载 skills，也不需要手动切换 output style。

默认会发生：

- 主线程默认进入 `hello2cc:native`
- 插件输出风格自动生效
- 第三方模型更倾向原生工具、原生 agent、原生计划流程和原生 worker 协调方式
- `Explore`、`Claude Code Guide` 等关键路径会尽量与当前会话模型保持一致

---

## 重装 / 升级

如果你想重装或清理旧缓存，推荐顺序如下：

```text
/plugin uninstall hello2cc@hello2cc-local
/plugin install hello2cc@hello2cc-local
```

如果你是从本地目录 marketplace 安装，升级后建议：

- 重新打开 Claude Code 会话
- 或执行 `/reload`

这样更容易拿到最新缓存内容。

---

## 推荐使用方式

### 方案 A：你已经用 `ccswitch` 或网关把第三方模型映射到 Claude Code 原生槽位

这是最推荐的方式。

建议：

- `mirror_session_model = true`
- 其余模型覆盖项尽量留空

效果：

- 主线程沿用当前会话模型槽位
- 必要时 `Claude Code Guide` / `Explore` 跟随当前会话模型
- `Plan` / `General-Purpose` 等路径尽量保留 Claude Code 原生行为

### 方案 B：你只想修正少数原生 agent 的模型

建议：

- `mirror_session_model = true`
- 按需填写 `guide_model`、`explore_model`
- 其他覆盖项尽量留空

### 方案 C：你要强制某些原生 agent 固定走某个槽位

可以按需填写：

- `guide_model = opus`
- `explore_model = sonnet`
- `general_model = opus`
- `team_model = sonnet`

注意：

这些覆盖项建议填写 **Claude Code 原生槽位**：

- `opus`
- `sonnet`
- `haiku`

如果你真正想让背后跑的是第三方模型，请在 `ccswitch`、provider profile、gateway 或模型映射层把这些槽位映射到你的模型，而不是把第三方别名直接写进 hello2cc 配置。

---

## 配置项

| 配置键 | 默认行为 | 说明 |
|---|---|---|
| `routing_policy` | `native-inject` | `native-inject` 会在必要路径静默补 `Agent.model`；`prompt-only` 只做行为引导，不改工具输入 |
| `mirror_session_model` | `true` | 优先镜像当前会话模型槽位 |
| `primary_model` | 空 | 高能力原生 agent 的显式槽位；建议填写 `opus / sonnet / haiku` |
| `subagent_model` | 空 | 为未显式设模的原生 agent 提供统一槽位；建议填写 `opus / sonnet / haiku` |
| `guide_model` | 空 | `Claude Code Guide` 的显式槽位 |
| `explore_model` | 空 | `Explore` 的显式槽位 |
| `plan_model` | 空 | 仅当你想强制覆盖 `Plan` 时填写 |
| `general_model` | 空 | 仅当你想强制覆盖 `General-Purpose` 时填写 |
| `team_model` | 空 | 仅当你想强制覆盖真实团队 teammate 时填写 |

---

## 使用效果上的几个关键点

### 1）不靠 skills

`hello2cc` 当前默认就是 skill-free 路线。

也就是说：

- 不需要每轮先加载 skills
- 不需要先执行一个额外入口
- 不需要在任务开始前手动提醒“请像 Opus 一样工作”

### 2）普通对话尽量不误进 team

这是 `0.2.6` 重点增强点之一。

现在普通对话下，更倾向：

- 先走普通原生 `Agent`
- 普通 worker 并行完成后回传结果
- 不因为一次探索任务就误变成 `TeamCreate`

### 3）只有真正需要时才走团队编排

真正明确的团队工作流，例如：

- 持久团队
- 明确 teammate 身份
- 多人长期协同
- 明确使用 `TeamCreate`

才更适合走团队路径。

### 4）更倾向跟随用户语言

如果你在中文会话里使用 Claude Code，`hello2cc` 会更倾向让第三方模型：

- 继续使用中文
- 减少无故英文自述
- 减少“我打算 / let’s / I’m thinking”这类显眼元叙述

---

## 常见问题

### 安装后还需要手动切 output style 吗？

通常不需要。

插件启用后，默认会走插件自己的输出风格与主线程 agent 设置。

### 可以直接把 `cc-gpt-*` 这类别名写进配置吗？

不建议。

更推荐把第三方模型别名映射到 Claude Code 原生槽位，然后让 hello2cc 只处理原生行为层。

### 装了 hello2cc 会不会影响其他工作流？

目标是尽量不影响。

只要更高优先级规则已经规定了格式、路由、行为或工作流，hello2cc 会尽量让位。

### 能做到和原生 Opus 100% 一模一样吗？

插件层会尽量逼近，但最终体验仍会受到以下因素影响：

- 第三方模型本身能力
- gateway / provider 对工具协议的兼容程度
- Claude Code 当前会话真实暴露的工具与能力

所以更准确的目标是：

**在插件层可控范围内，尽可能逼近原生 Opus 的使用体验。**

---

## 兼容范围

当前重点保证：

- Claude Code `2.1.76+`

如果你使用更新版本，建议升级到最新 hello2cc 版本后再观察效果。

---

## 本地验证

```bash
npm run validate
npm test
npm run check
npm run test:real
```

说明：

- `npm run validate`：校验 manifest、hooks、settings、output style 和脚本结构
- `npm test`：运行自动化测试
- `npm run check`：组合执行 `validate + test`
- `npm run test:real`：调用本机 Claude Code CLI 做真实会话回归

---

## 发布

hello2cc 已配置 npm 自动发布工作流：

- 推送 `v*` tag 自动发布
- 支持手动 `workflow_dispatch`
- 发布前自动执行 `npm run check`
- 发布前自动执行 `npm pack --dry-run`
- 发布后自动创建或更新对应 GitHub Release

---

## 许可证

Apache-2.0
