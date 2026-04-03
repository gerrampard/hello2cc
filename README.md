# hello2cc

`hello2cc` 是一个面向 Claude Code 的静默增强插件。

它不负责接入模型、配置 provider、处理网关或替你开通权限；它负责的是另一层问题：

**当你已经把 GPT、Kimi、DeepSeek、Gemini、Qwen 等第三方模型接进 Claude Code 之后，让它们更容易发现并正确使用 Claude Code 当前已经暴露出来的能力。**

当前版本：`0.3.0`

---

## 一句话理解

如果模型已经能在 Claude Code 里跑起来，`hello2cc` 解决的是：

> **别让第三方模型只会聊天、瞎猜或绕路，而是尽量像原生体验那样去使用你当前会话里已经可用的工具、Agent、Skill、workflow、MCP 和其他能力。**

---

## 功能介绍

| 常见问题 | hello2cc 的改善 |
|---|---|
| 明明已有 skill / workflow，模型却反复重写流程 | 更倾向续用当前会话里已经暴露或已经加载过的流程 |
| 明明知道 MCP resource 或工具已可直接调用，模型却还在泛搜 | 更容易走现成能力，减少重复发现 |
| 普通并行任务被误判成 team / worktree 语义 | 减少 subagent 创建失败、误路由和 0 tool uses |
| 第三方模型不容易选对 Claude Code 的内建能力 | 更容易在研究、规划、执行等场景下走对入口 |
| 多插件一起启用时提示互相打架 | 提供更保守的兼容模式，减少 system-reminder 冲突 |
| 中文会话里无故切英文、元叙述过多 | 更接近简洁、行动优先的原生风格 |

---

## 适合谁

如果你符合下面任一场景，`hello2cc` 会比较有价值：

- 你已经通过 CCSwitch、provider profile、API gateway、反代或其他映射层，把第三方模型接进 Claude Code
- 你希望第三方模型更像原生模型一样使用 Claude Code 已有能力
- 你不想每轮都手动提醒“去用 skill / workflow / MCP / agent”
- 你本地已经装了不少 skill、插件或 MCP，希望第三方模型也更容易发现并使用它们
- 你希望普通并行 worker 少走错 team / worktree 路径

---

## 它不做什么

`hello2cc` 不会：

- 接管你的 provider、gateway、API key 或账号权限
- 替 Claude Code 打开原本就没有暴露的工具
- 替代 CCSwitch 这类模型接入/映射层
- 屏蔽你已有的 skill、workflow、MCP 或插件能力
- 覆盖高优先级的 `CLAUDE.md`、`AGENTS.md`、项目规则和用户明确要求
- 决定你的主模型、默认模型或推理模型应该映射到哪里

它追求的是：

**静默增强，而不是接管 Claude Code。**

---

## 安装与使用

### 1）添加本地 marketplace

```bash
claude plugin marketplace add "D:\GitHub\dev\hello2cc"
```

### 2）安装插件

```bash
claude plugin install hello2cc@hello2cc-local
```

### 3）重新打开 Claude Code 会话

通常不需要你再手动切 output style，也不需要额外指定入口。

安装后默认会生效的内容：

- 第三方模型会更倾向使用当前会话里已经可用的能力
- 普通 subagent 更不容易误走 team / worktree 路径
- 多插件共存时可切换到更保守的兼容模式

---

## 重装 / 清理旧版本 / 升级

如果你修改了本地仓库，或者想彻底清掉旧缓存，建议按下面顺序：

### 1）卸载旧插件

```bash
claude plugin uninstall --scope user hello2cc@hello2cc-local
```

### 2）移除旧 marketplace（推荐）

```bash
claude plugin marketplace remove hello2cc-local
```

### 3）重新添加 marketplace

```bash
claude plugin marketplace add "D:\GitHub\dev\hello2cc"
```

### 4）重新安装

```bash
claude plugin install hello2cc@hello2cc-local
```

### 5）建议重开会话或执行 `/reload`

---

## 配置建议

### 方案 A：最省心

适合：模型已经通过 CCSwitch 或其他方式接好，只想让行为更接近原生。

```json
{
  "mirror_session_model": true
}
```

### 方案 B：统一设置默认 Agent 模型

适合：你希望多数 Agent 默认走同一个 Claude 槽位。

```json
{
  "mirror_session_model": true,
  "default_agent_model": "opus"
}
```

如果你的默认模型映射由 CCSwitch 管理，请继续在 CCSwitch 中设置真实落点；hello2cc 只负责让接入后的行为更自然。

### 方案 C：多插件共存

适合：你同时启用了其他也会注入额外提醒或上下文的插件。

```json
{
  "compatibility_mode": "sanitize-only"
}
```

这个模式会尽量减少提示冲突，只保留必要的兼容处理。

---

## 常用配置项

| 配置键 | 作用 |
|---|---|
| `mirror_session_model` | 优先跟随当前会话模型语义 |
| `default_agent_model` | 为多数 Agent 统一设置默认 Claude 槽位 |
| `routing_policy` | 选择只做行为引导，还是在需要时补齐原生 Agent 的安全模型槽位 |
| `compatibility_mode` | 与其他同类插件共存时可切 `sanitize-only` |

---

## 排错

### 1）安装后感觉没有生效

先按下面顺序检查：

1. 重新打开 Claude Code 会话，或执行 `/reload`
2. 确认插件已安装并启用
3. 如果是升级本地版本，先卸载旧插件和旧 marketplace，再重装

### 2）多个插件一起用时，模型像是在“打架”

如果你同时启用了多个会注入额外提示的插件，建议切到：

```json
{
  "compatibility_mode": "sanitize-only"
}
```

这样会尽量减少提示冲突。

### 3）Agent / subagent 报参数错误

优先检查两点：

1. 真实模型别名和默认模型落点，是否已经在 CCSwitch 中正确映射
2. hello2cc 配置里是否直接写入了第三方模型别名

更稳妥的做法是：

- 模型映射交给 CCSwitch
- hello2cc 只填写 Claude Code 能稳定接受的槽位，或直接留空

### 4）模型还是没有使用你想要的工具或 MCP

hello2cc 只能帮助模型更好地使用**已经暴露**的能力，不能替 Claude Code 打开原本不存在的工具。

如果遇到这种情况，先确认：

1. 该工具、skill、workflow 或 MCP 资源当前确实已可用
2. 当前会话里已经把相关能力暴露出来
3. 高优先级项目规则或用户指令没有禁止它使用相关能力

---

## 常见问题

### 安装后还需要手动切 output style 吗？

通常不需要。

### hello2cc 会不会阻止 skill / plugin / MCP？

不会。它的目标正相反：尽量让第三方模型更容易发现并使用这些已经存在的能力。

### hello2cc 会不会替我打开本来不存在的工具？

不会。它只能帮助模型更好地使用**已经暴露**的宿主能力，不能替宿主创造能力。

### 是否建议把第三方模型别名直接写进 hello2cc 配置？

不建议。更推荐把真实模型别名、映射关系、默认落点放在模型接入层处理，hello2cc 只写 Claude Code 能稳定接受的槽位。

### 如果我后面继续用 CCSwitch 调整模型映射，会和 hello2cc 冲突吗？

通常不会。只要模型映射层真的把能力暴露出来，hello2cc 会更倾向帮助第三方模型去发现和使用这些能力，而不是挡住它们。

### 多插件一起用时，什么时候建议切 `sanitize-only`？

当你发现多个插件同时注入提示，导致模型不知道该听谁，或者对话里出现明显互相打架的行为时，建议切到 `sanitize-only`。


---

## 许可证

Apache-2.0
