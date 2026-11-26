<div align="center">

<h1>
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="assets/readme/hero-dark.png">
    <img src="assets/readme/hero-light.png" alt="Antigravity Wallpaper Engine — 让本机动态壁纸与 iOS 液态玻璃失重悬浮于 Antigravity 2.0" width="1440">
  </picture>
</h1>

<p>
  <a href="https://github.com/mugonk/antigravity-wallpaper-engine/stargazers"><img src="https://img.shields.io/github/stars/mugonk/antigravity-wallpaper-engine?style=for-the-badge&logo=github&label=Stars&color=38bdf8&labelColor=0f172a" alt="GitHub Stars" height="24" /></a>
  <a href="https://github.com/mugonk/antigravity-wallpaper-engine/releases"><img src="https://img.shields.io/github/v/release/mugonk/antigravity-wallpaper-engine?style=for-the-badge&label=Release&color=6366f1&labelColor=0f172a" alt="GitHub Release" height="24" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-10b981?style=for-the-badge&labelColor=0f172a" alt="License: MIT" height="24" /></a>
  <img src="https://img.shields.io/badge/Node.js-%3E%3D20.0.0-0ea5e9?style=for-the-badge&logo=node.js&logoColor=white&labelColor=0f172a" alt="Node.js >= 20" height="24" />
  <a href="https://github.com/elysia395/dsh-wallpaper-engine"><img src="https://img.shields.io/badge/Adapted%20from-dsh--wallpaper--engine-ec4899?style=for-the-badge&logo=github&labelColor=0f172a" alt="Upstream: dsh-wallpaper-engine" height="24" /></a>
</p>

<p>
  <a href="#start"><picture><source media="(prefers-color-scheme: dark)" srcset="assets/readme/nav-get-dark.png"><img src="assets/readme/nav-get-light.png" alt="快速安装" height="40"></picture></a>&nbsp;
  <a href="#showcase"><picture><source media="(prefers-color-scheme: dark)" srcset="assets/readme/nav-showcase-dark.png"><img src="assets/readme/nav-showcase-light.png" alt="效果展示" height="40"></picture></a>&nbsp;
  <a href="#presets"><picture><source media="(prefers-color-scheme: dark)" srcset="assets/readme/nav-presets-dark.png"><img src="assets/readme/nav-presets-light.png" alt="液态玻璃预设" height="40"></picture></a>&nbsp;
  <a href="#formats"><picture><source media="(prefers-color-scheme: dark)" srcset="assets/readme/nav-formats-dark.png"><img src="assets/readme/nav-formats-light.png" alt="支持格式" height="40"></picture></a>&nbsp;
  <a href="#faq"><picture><source media="(prefers-color-scheme: dark)" srcset="assets/readme/nav-faq-dark.png"><img src="assets/readme/nav-faq-light.png" alt="常见问题" height="40"></picture></a>&nbsp;
  <a href="#credits"><picture><source media="(prefers-color-scheme: dark)" srcset="assets/readme/nav-credits-dark.png"><img src="assets/readme/nav-credits-light.png" alt="原项目致谢" height="40"></picture></a>
</p>

</div>

> [!NOTE]
> **原项目声明**：本项目移植并深度适配自 [`elysia395/dsh-wallpaper-engine`](https://github.com/elysia395/dsh-wallpaper-engine)（`dsh-plugin-wallpaper-engine`），Scene 场景实时渲染引擎由 [`oneincase/webwallgl`](https://github.com/oneincase/webwallgl) 驱动。详细出处与完整致谢请见文末 [原项目出处与致谢](#credits) 章节。

<h2 id="showcase"><picture><source media="(prefers-color-scheme: dark)" srcset="assets/readme/sec-showcase-dark.png"><img src="assets/readme/sec-showcase-light.png" alt="SHOWCASE · 实机效果展示" width="1440"></picture></h2>

<table>
  <tr>
    <td width="50%" align="center" valign="top">
      <a href="assets/readme/showcase-starlight.jpg"><img src="assets/readme/showcase-starlight.jpg" alt="Antigravity 2.0 星空云海动态壁纸与冰透液态玻璃主界面" width="100%" /></a>
      <br><b>🌌 主界面实拍 · 星空云海与冰透液态玻璃</b>
      <br><sub>20px 圆角半透明侧栏、磨砂输入框与右上角 Gemini 吉祥物拉绳，与汉化插件完美共存</sub>
    </td>
    <td width="50%" align="center" valign="top">
      <a href="assets/readme/showcase-sunset.jpg"><img src="assets/readme/showcase-sunset.jpg" alt="Antigravity 2.0 落日壁纸与通透磨砂侧栏效果" width="100%" /></a>
      <br><b>🌇 主界面实拍 · 落日动态壁纸与背景透光</b>
      <br><sub>壁纸色彩自然漫反射穿透液态玻璃侧栏与对话输入框，保留高清晰阅读对比度</sub>
    </td>
  </tr>
  <tr>
    <td width="50%" align="center" valign="top">
      <a href="assets/readme/showcase-library.jpg"><img src="assets/readme/showcase-library.jpg" alt="Ctrl + Alt + W 唤起的 3 列冰透壁纸库抽屉与黑胶播放条" width="100%" /></a>
      <br><b>🎞️ 壁纸库抽屉 · 三列沉浸浏览与黑胶播放条</b>
      <br><sub>按 <code>Ctrl + Alt + W</code> 或下拉吉祥物即开，直连本机 Steam / WE 创意工坊壁纸</sub>
    </td>
    <td width="50%" align="center" valign="top">
      <a href="assets/readme/showcase-settings.jpg"><img src="assets/readme/showcase-settings.jpg" alt="Antigravity Wallpaper Engine 液态玻璃设置弹窗与吉祥物管理" width="100%" /></a>
      <br><b>⚙️ 完整设置弹窗 · 吉祥物切换与外观预设导入</b>
      <br><sub>支持 10 款吉祥物一键切换、自定义立绘上传、省电暂停策略与 JSON 预设导入导出</sub>
    </td>
  </tr>
</table>

<p align="center"><sub>点击任意图片可查看原尺寸大图；以上均为 Antigravity 2.0 + <code>presets/agy-wallpaper-preset.json</code> 实机运行截图。</sub></p>

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="assets/readme/bento-dark.png">
    <img src="assets/readme/bento-light.png" alt="Antigravity Wallpaper Engine 六大核心能力全景 Bento Grid" width="1440">
  </picture>
</p>

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="assets/readme/mascots-dark.png">
    <img src="assets/readme/mascots-light.png" alt="内置 10 款悬浮吉祥物拉绳星轨展台（Gemini / Whale / DeepSeek / Claude / GPT / Grok / Qwen / Kimi / GLM / Phoebe）" width="1440">
  </picture>
</p>

<h2 id="formats"><picture><source media="(prefers-color-scheme: dark)" srcset="assets/readme/sec-formats-dark.png"><img src="assets/readme/sec-formats-light.png" alt="FORMATS · 支持的壁纸类型" width="1440"></picture></h2>

| 壁纸类型 | 渲染方式 | 支持说明 |
| :--- | :--- | :--- |
| **Scene（场景）** | 内置 [`webwallgl`](https://github.com/oneincase/webwallgl) WebGL 实时渲染 | 支持帧率上限（15/30/60 FPS）与鼠标交互，失败时自动降级，**无需 WE 后台常驻** |
| **Web（网页）** | 本地沙箱挂载 + WE API 兼容层注入 | 独立 Loopback 端口隔离 CSP，支持交互式网页壁纸与自定义属性调节 |
| **Video（视频）** | 原生视频解码与 Range 流式播放 | 支持播放倍速、静音控制、窗口隐藏/遮挡自动暂停 |
| **Picture（图片 / 幻灯片）** | 本地直读与定时交叉轮播 | 读取图片目录并按设定周期平滑切换，文件全部留在本机 |
| **自定义上传** | 本地上传 JPG / PNG / WebP / MP4 | 所有文件仅保存在本机 `~/.antigravity-wallpaper-engine/uploads/`，不外传 |
| **Application（应用）** | ❌ 不支持 | 应用型壁纸依赖外部可执行程序，扫描与轮播时会自动过滤 |

<h2 id="presets"><picture><source media="(prefers-color-scheme: dark)" srcset="assets/readme/sec-presets-dark.png"><img src="assets/readme/sec-presets-light.png" alt="PRESETS · 液态玻璃预设与外观分享" width="1440"></picture></h2>

本项目内置 **11 套开箱即用预设**，并额外附带作者自用的推荐预设文件，方便一键复刻同款 **冰透晶玻 + Gemini 拉绳** 观感：

| 预设文件 / 名称 | 来源 | 风格特点 |
| :--- | :--- | :--- |
| [**`presets/agy-wallpaper-preset.json`**](presets/agy-wallpaper-preset.json) | 作者自用预设 | **冰透晶玻 + Gemini 吉祥物拉绳**：青蓝高亮（`#75e6f5`）、9px 轻雾化、侧栏圆角 20px、高饱和背景增强 |
| `DeepSeek 冰透晶玻 (推荐)` / `高清原画` / `极简轻霜` / `深空冷霜` | 内置（`server/presets.mjs`） | 专为 Antigravity 2.0 布局调校的 4 套液态玻璃方案 |
| `factory-*` / `purple-mood` 等 7 套预设 | 上游（`server/upstream/presets/`） | 继承自原项目 `dsh-wallpaper-engine` 的经典外观预设 |

### 两种方式导入 `agy-wallpaper-preset.json`

1. **界面一键导入（推荐）**：在 Antigravity 中按 **`Ctrl + Alt + W`**（或下拉右上角吉祥物）打开壁纸面板 → 进入设置弹窗 → 点击 **「导入预设...」** → 选择仓库中的 [`presets/agy-wallpaper-preset.json`](presets/agy-wallpaper-preset.json) 即可立即生效并自动保存。
2. **文件目录放置**：将 [`presets/agy-wallpaper-preset.json`](presets/agy-wallpaper-preset.json) 复制到 `~/.antigravity-wallpaper-engine/presets/` 目录，重新打开面板即可在预设列表中选用。

<h2 id="start"><picture><source media="(prefers-color-scheme: dark)" srcset="assets/readme/sec-start-dark.png"><img src="assets/readme/sec-start-light.png" alt="QUICK START · 快速开始与安装" width="1440"></picture></h2>

### 前置条件

- **操作系统**：Windows 10 / 11
- **运行环境**：[Node.js](https://nodejs.org/) `>= 20.0.0`
- **宿主软件**：Antigravity 2.0 桌面端（可选：已安装 Steam 版 Wallpaper Engine 以自动扫描本地壁纸库）

### 三步安装

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
- 所有设置实时原子落盘在 `~/.antigravity-wallpaper-engine/config.json`，调整滑块与配色后**即时生效，无需重启**。

<h2 id="maintain"><picture><source media="(prefers-color-scheme: dark)" srcset="assets/readme/sec-maintain-dark.png"><img src="assets/readme/sec-maintain-light.png" alt="MAINTAIN · 常用维护与安全卸载" width="1440"></picture></h2>

```powershell
# 检查插件运行状态、钩子共存状态与壁纸库扫描诊断
npm run status

# 运行隔离自动化校验套件（服务端接口、安全边界、ASAR 共存与卸载）
npm test

# 修改源码后重新打包渲染层并同步到插件目录
npm run sync

# 安全卸载（请先完全退出 Antigravity）
powershell -ExecutionPolicy Bypass -File "$env:USERPROFILE\.gemini\config\plugins\antigravity-wallpaper-engine\scripts\uninstall.ps1"
```

> [!IMPORTANT]
> 卸载脚本仅精准移除 `/* AGY_WE_HOOK_V1 */` 这一行引导钩子及本插件的计划任务，**完全保留 `antigravity-zh-cn` 汉化等其他插件的钩子与配置**。

<h2 id="arch"><picture><source media="(prefers-color-scheme: dark)" srcset="assets/readme/sec-arch-dark.png"><img src="assets/readme/sec-arch-light.png" alt="ARCHITECTURE · 目录结构与实现原理" width="1440"></picture></h2>

<details>
<summary><b>点击展开完整目录结构与工作原理说明</b></summary>

```text
antigravity-wallpaper-engine/
├── assets/                   # 插件图标、10 款吉祥物拉绳与原创液态玻璃 README 视觉素材
│   ├── logo.svg
│   ├── rope/                 # 内置 10 款吉祥物拉绳 PNG
│   └── readme/               # NumPy + Pillow 物理液态玻璃双主题渲染脚本与视觉产物
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
└── test/                     # 端到端自动化校验套件
```

**工作原理简述**：
1. `scripts/patch-asar.mjs` 在 `app.asar` 入口处以独立标记写入 1 行安全引导，加载 `runtime/hook.cjs`，并自动刷新 ASAR SHA256 完整性校验头。
2. Antigravity 启动后，`hook.cjs` 在本机 `127.0.0.1` 随机端口启动媒体服务，仅针对该本地回环地址放行必要 CSP，并向界面注入 `renderer.bundle.js`。
3. 所有状态与用户配置均保存在 `~/.antigravity-wallpaper-engine/` 下，完全独立于 Agent 对话链路。

</details>

<h2 id="faq"><picture><source media="(prefers-color-scheme: dark)" srcset="assets/readme/sec-faq-dark.png"><img src="assets/readme/sec-faq-light.png" alt="FAQ · 常见问题" width="1440"></picture></h2>

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

<h2 id="credits"><picture><source media="(prefers-color-scheme: dark)" srcset="assets/readme/sec-credits-dark.png"><img src="assets/readme/sec-credits-light.png" alt="CREDITS · 原项目出处与致谢" width="1440"></picture></h2>

本项目的诞生离不开以下优秀开源项目与社区开发者的工作，特此致以诚挚感谢 ❤️：

| 项目 | 作者 / 维护者 | 开源协议 | 在本项目中的作用 |
| :--- | :--- | :---: | :--- |
| [**`elysia395/dsh-wallpaper-engine`**](https://github.com/elysia395/dsh-wallpaper-engine) (`dsh-plugin-wallpaper-engine`) | [@elysia395](https://github.com/elysia395) 及全体贡献者 | MIT | **核心原项目出处**：本项目移植并适配自该仓库；承袭其 Steam/WE 壁纸库扫描、PKG/MP4 解析与流式服务、Web 沙箱兼容层、iOS 液态玻璃美学、经典预设与吉祥物拉绳素材 |
| [**`oneincase/webwallgl`**](https://github.com/oneincase/webwallgl) | [@oneincase](https://github.com/oneincase) | MIT | 提供浏览器端 Wallpaper Engine **Scene 场景壁纸 WebGL 实时渲染引擎** |

> 如果这个插件对您有帮助，也请顺手前往原项目 [**elysia395/dsh-wallpaper-engine**](https://github.com/elysia395/dsh-wallpaper-engine) 与 [**oneincase/webwallgl**](https://github.com/oneincase/webwallgl) 点一颗 ⭐ Star 支持原作者！

---

<div align="center">
  <p>
    本项目代码遵循 <a href="LICENSE">MIT License</a> 开源协议发布，完整保留上游原项目版权与许可声明。<br>
    壁纸、角色与字体素材的版权归各自原作者所有，再分发或商用前请自行核对相应授权。
  </p>
  <sub>Adapted for Antigravity 2.0 with ❤️ · Powered by <a href="https://github.com/elysia395/dsh-wallpaper-engine">dsh-wallpaper-engine</a> &amp; <a href="https://github.com/oneincase/webwallgl">webwallgl</a></sub>
</div>
