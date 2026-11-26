<div align="center">

<a href="https://github.com/mugonk/antigravity-wallpaper-engine">
  <img src="assets/logo.svg" alt="Antigravity Wallpaper Engine Logo" width="108" height="108" />
</a>

<h1>Antigravity Wallpaper Engine</h1>

<p>
  <strong>把本机 Wallpaper Engine 动态壁纸与 iOS 风格液态玻璃，无感带入 Antigravity 2.0 桌面端</strong>
</p>

<p>
  <a href="https://github.com/mugonk/antigravity-wallpaper-engine/stargazers"><img src="https://img.shields.io/github/stars/mugonk/antigravity-wallpaper-engine?style=flat-square&logo=github&color=38bdf8" alt="GitHub Stars" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-6366f1?style=flat-square" alt="License: MIT" /></a>
  <img src="https://img.shields.io/badge/Node.js-%3E%3D20.0.0-22c55e?style=flat-square&logo=node.js&logoColor=white" alt="Node.js >= 20" />
  <img src="https://img.shields.io/badge/Platform-Windows%20%7C%20Antigravity%202.0-0ea5e9?style=flat-square" alt="Platform" />
  <a href="https://github.com/elysia395/dsh-wallpaper-engine"><img src="https://img.shields.io/badge/Adapted%20from-dsh--wallpaper--engine-ec4899?style=flat-square&logo=github" alt="Upstream: dsh-wallpaper-engine" /></a>
</p>

<p>
  <a href="#-核心特性">核心特性</a> ·
  <a href="#-支持的壁纸类型">支持格式</a> ·
  <a href="#-预设与外观分享">预设导入</a> ·
  <a href="#-快速开始">快速安装</a> ·
  <a href="#-常见问题">常见问题</a> ·
  <a href="#-原项目出处与致谢">出处与致谢</a>
</p>

</div>

---

> [!NOTE]
> **原项目声明**：本项目移植并深度适配自 [`elysia395/dsh-wallpaper-engine`](https://github.com/elysia395/dsh-wallpaper-engine)（`dsh-plugin-wallpaper-engine`），Scene 场景实时渲染引擎由 [`oneincase/webwallgl`](https://github.com/oneincase/webwallgl) 驱动。详细出处与完整致谢请见文末 [原项目出处与致谢](#-原项目出处与致谢) 章节。

---

## ✨ 核心特性

- **🎬 全格式本地壁纸直连**：自动扫描本机 Steam / Wallpaper Engine 创意工坊与自定义目录，实时渲染 **Scene / Web / Video / Picture** 壁纸，支持自定义上传图片与视频，**无需在后台启动 Wallpaper Engine 客户端**。
- **🧊 iOS 风格液态玻璃外观**：支持对左右侧栏、对话卡片、输入框、弹窗独立开启液态玻璃，可细调模糊度、透光率、遮罩深度、边框高光、圆角样式与主/次文字颜色。
- **🐾 吉祥物拉绳与交互特效**：右上角悬浮吉祥物拉绳快捷入口，内置 10 款角色与自定义头像上传，支持点击波纹 / 火花、鼠标拖尾与 3D 视差效果。
- **⚡ 零 Agent Token 开销**：纯本地媒体服务 + 渲染层注入，**不向 Agent 注册任何 MCP 工具、不注入额外提示词**，不影响对话上下文与速度。
- **🛡️ 多插件安全共存**：采用独立 1 行 ASAR 引导钩子标记（`/* AGY_WE_HOOK_V1 */`），与 `antigravity-zh-cn` 简体中文汉化插件安全共存；内置更新守护与精准卸载脚本，卸载时不会破坏其他插件。

<div align="center">
  <p><sub>内置 10 款吉祥物拉绳图标（亦支持自定义上传）</sub></p>
  <p>
    <img src="assets/rope/gemini.png" width="44" alt="Gemini" />&nbsp;
    <img src="assets/rope/whale.png" width="44" alt="Whale" />&nbsp;
    <img src="assets/rope/deepseek.png" width="44" alt="DeepSeek" />&nbsp;
    <img src="assets/rope/claude.png" width="44" alt="Claude" />&nbsp;
    <img src="assets/rope/gpt.png" width="44" alt="GPT" />&nbsp;
    <img src="assets/rope/grok.png" width="44" alt="Grok" />&nbsp;
    <img src="assets/rope/qwen.png" width="44" alt="Qwen" />&nbsp;
    <img src="assets/rope/kimi.png" width="44" alt="Kimi" />&nbsp;
    <img src="assets/rope/glm.png" width="44" alt="GLM" />&nbsp;
    <img src="assets/rope/phoebe.png" width="44" alt="Phoebe" />
  </p>
</div>

---

## 🎞️ 支持的壁纸类型

| 壁纸类型 | 渲染方式 | 说明 |
| :--- | :--- | :--- |
| **Scene（场景）** | 内置 [`webwallgl`](https://github.com/oneincase/webwallgl) WebGL 实时渲染 | 支持帧率上限（15/30/60 FPS）与鼠标交互，失败时自动降级，**无需 WE 后台常驻** |
| **Web（网页）** | 本地沙箱挂载 + WE API 兼容层注入 | 独立 Loopback 端口隔离 CSP，支持交互式网页壁纸 |
| **Video（视频）** | 原生视频解码与流式播放 | 支持播放倍速、静音控制、遮挡/切后台自动暂停 |
| **Picture（图片 / 幻灯片）** | 本地直读与定时轮播 | 读取图片目录并按设定周期平滑切换 |
| **自定义上传** | 本地上传 JPG / PNG / WebP / MP4 | 所有文件仅保存在本机 `~/.antigravity-wallpaper-engine/uploads/` |
| **Application（应用）** | ❌ 不支持 | 应用型壁纸依赖外部可执行程序，扫描时会自动过滤 |

---

## 🎨 预设与外观分享

本项目内置 **11 套开箱即用预设**，并额外附带作者自用的推荐预设文件，方便一键复刻同款冰透玻璃观感：

| 预设文件 / 名称 | 来源 | 风格特点 |
| :--- | :--- | :--- |
| [**`presets/agy-wallpaper-preset.json`**](presets/agy-wallpaper-preset.json) | 作者自用预设 | **冰透晶玻 + Gemini 吉祥物拉绳**：青蓝高亮（`#75e6f5`）、9px 轻雾化、侧栏圆角 20px、高饱和背景增强 |
| `DeepSeek 冰透晶玻 (推荐)` / `高清原画` / `极简轻霜` / `深空冷霜` | 内置（`server/presets.mjs`） | 专为 Antigravity 2.0 布局调校的 4 套液态玻璃方案 |
| `factory-*` / `purple-mood` 等 7 套预设 | 上游（`server/upstream/presets/`） | 继承自原项目 `dsh-wallpaper-engine` 的经典外观预设 |

### 两种方式导入 `agy-wallpaper-preset.json`

1. **界面一键导入（推荐）**：在 Antigravity 中按 **`Ctrl + Alt + W`** 打开壁纸面板 → 进入设置弹窗 → 点击 **「导入预设...」** → 选择仓库中的 [`presets/agy-wallpaper-preset.json`](presets/agy-wallpaper-preset.json) 即可立即生效并自动保存。
2. **文件目录放置**：将 [`presets/agy-wallpaper-preset.json`](presets/agy-wallpaper-preset.json) 复制到 `~/.antigravity-wallpaper-engine/presets/` 目录，重新打开面板即可在预设列表中看到。

---

## 🚀 快速开始

### 前置条件

- **操作系统**：Windows 10 / 11
- **运行环境**：[Node.js](https://nodejs.org/) `>= 20.0.0`
- **宿主软件**：Antigravity 2.0 桌面端（可选：已安装 Steam 版 Wallpaper Engine 以自动扫描本地壁纸库）

### 安装步骤

```powershell
# 1. 克隆仓库并安装依赖
git clone https://github.com/mugonk/antigravity-wallpaper-engine.git
cd antigravity-wallpaper-engine
npm install

# 2. 构建渲染层并同步到 Antigravity 插件目录
#    目标位置：~/.gemini/config/plugins/antigravity-wallpaper-engine
npm run sync

# 3. 注册开机更新守护并应用共存钩子
powershell -ExecutionPolicy Bypass -File "$env:USERPROFILE\.gemini\config\plugins\antigravity-wallpaper-engine\scripts\install.ps1"
```

> [!TIP]
> 如果运行 `install.ps1` 时提示 Antigravity 正在占用 `app.asar`，直接双击运行插件目录下的 **`scripts\应用壁纸插件并重启.cmd`**，脚本会自动关闭客户端、注入共存钩子并重新启动 Antigravity。

### 开始使用

- 按快捷键 **`Ctrl + Alt + W`**，或点击窗口右上角的 **吉祥物拉绳**，即可打开壁纸库与液态玻璃设置面板。
- 所有设置实时保存在 `~/.antigravity-wallpaper-engine/config.json`，调整滑块与配色后**即时生效，无需重启**。

---

## 🛠️ 常用维护与安全卸载

```powershell
# 检查插件运行状态、钩子共存状态与壁纸库扫描诊断
npm run status

# 修改源码后重新打包渲染层并同步到插件目录
npm run sync

# 安全卸载（请先完全退出 Antigravity）
powershell -ExecutionPolicy Bypass -File "$env:USERPROFILE\.gemini\config\plugins\antigravity-wallpaper-engine\scripts\uninstall.ps1"
```

> [!IMPORTANT]
> 卸载脚本仅精准移除 `/* AGY_WE_HOOK_V1 */` 这一行引导钩子及本插件的计划任务，**完全保留 `antigravity-zh-cn` 汉化等其他插件的钩子与配置**。

---

## 📂 目录结构与实现原理

<details>
<summary>点击展开完整目录结构与工作原理说明</summary>

```text
antigravity-wallpaper-engine/
├── assets/                   # 插件图标与 10 款吉祥物拉绳素材
├── presets/                  # 可直接导入分享的 JSON 外观预设
│   └── agy-wallpaper-preset.json
├── runtime/                  # Electron 主进程与渲染层注入
│   ├── hook.cjs              # 主进程钩子（拉起本地服务、放行 loopback CSP、热重载）
│   ├── bundle-renderer.mjs   # 渲染层打包脚本
│   ├── renderer.bundle.js    # 打包后的渲染层产物
│   └── renderer/             # 渲染层模块化源码（壁纸层、液态玻璃、视差特效、设置面板）
├── scripts/                  # 安装、卸载、ASAR 共存注入、状态诊断与一键重启脚本
├── server/                   # 本地 HTTP Loopback 媒体服务（端口动态分配）
│   ├── index.mjs             # 服务入口与 API 路由
│   ├── presets.mjs           # 预设加载与用户预设持久化
│   ├── settings.mjs          # 配置校验与原子落盘
│   ├── upstream/             # 复用自 dsh-wallpaper-engine 的扫描/解码/代理模块
│   └── webwallgl/            # WebWallGL Scene 渲染桥接层
├── skills/                   # Antigravity 插件管理技能文档
└── test/                     # 自动化校验脚本
```

**工作原理简述**：
1. `scripts/patch-asar.mjs` 在 `app.asar` 入口处以独立标记写入 1 行安全引导，加载 `runtime/hook.cjs`。
2. Antigravity 启动后，`hook.cjs` 在本机 `127.0.0.1` 随机端口启动媒体服务，仅针对该本地回环地址放行必要 CSP，并向界面注入 `renderer.bundle.js`。
3. 所有状态与用户配置均保存在 `~/.antigravity-wallpaper-engine/` 下，完全独立于 Agent 对话链路。

</details>

---

## ❓ 常见问题

<details>
<summary><b>1. 会和 <code>antigravity-zh-cn</code> 汉化插件冲突吗？</b></summary>

不会。本插件使用独立标记 `/* AGY_WE_HOOK_V1 */` 注入和移除钩子，运行 `npm run status` 可同时查看 `asar.wePatched` 与 `asar.zhCnPatched`，确认两者正常共存。
</details>

<details>
<summary><b>2. Antigravity 官方版本更新后壁纸消失了怎么办？</b></summary>

官方覆盖更新 `app.asar` 后，已注册的 `Antigravity-WE-AutoGuard` 守护任务会在下次登录时自动修复；您也可以随时双击 `scripts\应用壁纸插件并重启.cmd` 立即恢复。
</details>

<details>
<summary><b>3. 没有安装 Steam 版 Wallpaper Engine 也能用吗？</b></summary>

可以。打开壁纸库面板后，您可以直接上传本地图片（JPG / PNG / WebP）或视频（MP4），或在设置中指定自定义壁纸目录，所有液态玻璃、吉祥物拉绳、特效与字体功能均可正常使用。
</details>

<details>
<summary><b>4. 复杂 Scene 壁纸占用较高怎么办？</b></summary>

可在设置面板中将 **Scene 渲染帧率** 从 `60 FPS` 调低至 `30 FPS` / `15 FPS`，并保持开启 **窗口隐藏时自动暂停（`pauseOnHidden`）**，或开启失焦暂停以节省 GPU 资源。
</details>

---

## 🙏 原项目出处与致谢

本项目的诞生离不开以下优秀开源项目与社区开发者的工作，特此致以诚挚感谢 ❤️：

| 项目 | 作者 / 维护者 | 开源协议 | 在本项目中的作用 |
| :--- | :--- | :---: | :--- |
| [**`elysia395/dsh-wallpaper-engine`**](https://github.com/elysia395/dsh-wallpaper-engine) (`dsh-plugin-wallpaper-engine`) | [@elysia395](https://github.com/elysia395) 及全体贡献者 | MIT | **核心原项目出处**：本项目移植并适配自该仓库；承袭其 Steam/WE 壁纸库扫描、PKG/MP4 解析与流式服务、Web 沙箱兼容层、iOS 液态玻璃美学、经典预设与吉祥物拉绳素材 |
| [**`oneincase/webwallgl`**](https://github.com/oneincase/webwallgl) | [@oneincase](https://github.com/oneincase) | MIT | 提供浏览器端 Wallpaper Engine **Scene 场景壁纸 WebGL 实时渲染引擎** |

> 如果这个插件对您有帮助，也请顺手前往原项目 [**elysia395/dsh-wallpaper-engine**](https://github.com/elysia395/dsh-wallpaper-engine) 与 [**oneincase/webwallgl**](https://github.com/oneincase/webwallgl) 点一颗 ⭐ Star 支持原作者！

---

## 📄 开源协议

本项目代码遵循 [MIT License](LICENSE) 开源协议发布，完整保留上游原项目版权与许可声明。壁纸、角色与字体素材的版权归各自原作者所有，再分发或商用前请自行核对相应授权。

<div align="center">
  <sub>Adapted for Antigravity 2.0 with ❤️ · Powered by <a href="https://github.com/elysia395/dsh-wallpaper-engine">dsh-wallpaper-engine</a> &amp; <a href="https://github.com/oneincase/webwallgl">webwallgl</a></sub>
</div>
