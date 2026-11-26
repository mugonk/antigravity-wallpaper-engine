---
name: antigravity-wallpaper-engine
description: 管理 Antigravity 2.0 壁纸引擎与液态玻璃插件（适配自 elysia395/dsh-wallpaper-engine）：检查运行状态、诊断壁纸库与 WebWallGL、查看启用/共存安装与安全卸载方式。
---

# Antigravity 壁纸引擎管理技能

本插件将本地 **Wallpaper Engine**（Scene / Web / Video / 图片 / 自定义上传）以及 iOS 风格液态玻璃、点击与拖尾特效、3D 视差、自定义字体与性能监控带入 Antigravity 2.0 桌面端，且**不暴露任何 MCP 工具（对 Agent 零 token 开销）**，并与 `antigravity-zh-cn` 汉化插件安全共存。

## 目录结构

插件安装目录：`~/.gemini/config/plugins/antigravity-wallpaper-engine/`

- `server/index.mjs`：独立本地 HTTP + Loopback 媒体源服务（复用上游 Steam/WE 扫描、`webwallgl` 实时渲染、PKG/MP4 解析、Web 沙箱注入与系统字体扫描）
- `runtime/hook.cjs`：Electron 主进程运行时挂钩（启动本地媒体服务、仅对本插件 loopback 端口放行 CSP、向 Antigravity Hub 注入渲染层、支持热重载与更新守护）
- `runtime/renderer.bundle.js`：渲染层打包产物（壁纸引擎、液态玻璃适配、点击/拖尾特效、3D 视差、字体引擎、性能监控悬浮窗、设置与壁纸库抽屉）
- `scripts/patch-asar.mjs`：多插件共存安全的 1 行 ASAR 引导钩子注入/精准移除脚本（使用独立标记 `/* AGY_WE_HOOK_V1 */`，卸载时不会破坏 `antigravity-zh-cn` 汉化钩子）
- `scripts/status.mjs`：运行状态与壁纸库诊断脚本
- `scripts/install.ps1` / `scripts/uninstall.ps1`：守护安装与彻底卸载脚本
- `scripts/应用壁纸插件并重启.cmd`：一键应用钩子并重启 Antigravity 脚本

## 常用操作

### 1. 检查运行状态
```powershell
node "$env:USERPROFILE\.gemini\config\plugins\antigravity-wallpaper-engine\scripts\status.mjs"
```
查看 `asar.wePatched`、`asar.zhCnPatched`（确认与汉化共存）、`webwallglInstalled`、`heartbeat` 与配置统计。

### 2. 快捷键与页内使用
- 按 `Ctrl+Alt+W` 或点击窗口右上角液态玻璃拉绳/悬浮按钮打开壁纸库与设置面板。
- 所有设置保存在 `~/.antigravity-wallpaper-engine/config.json`，修改即时生效，无需重启。

### 3. 安全卸载（不影响汉化插件）
完全退出 Antigravity 后运行：
```powershell
powershell -ExecutionPolicy Bypass -File "$env:USERPROFILE\.gemini\config\plugins\antigravity-wallpaper-engine\scripts\uninstall.ps1"
```
该脚本仅精准移除 `/* AGY_WE_HOOK_V1 */` 钩子行与本插件的计划任务，保留 `antigravity-zh-cn` 等其他插件的钩子不受影响。
