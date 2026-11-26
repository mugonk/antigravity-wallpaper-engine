param(
    [switch]$Silent
)

$ErrorActionPreference = "Stop"

$pluginRoot = Split-Path -Parent $PSScriptRoot
$patchScript = Join-Path $pluginRoot "scripts\patch-asar.mjs"
$taskName = "Antigravity-WE-AutoGuard"

# 1. Remove Windows Scheduled Task
try { Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue } catch {}
try { schtasks /Delete /TN $taskName /F 2>$null | Out-Null } catch {}

# 2. Surgically remove ONLY /* AGY_WE_HOOK_V1 */ line from app.asar (preserves antigravity-zh-cn)
if (Test-Path $patchScript) {
    $res = node $patchScript --remove 2>&1 | Out-String
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "移除壁纸引擎钩子失败（可能 Antigravity 正在运行并占用 app.asar）。请完全退出 Antigravity 后重试。"
        Write-Host $res
        exit 1
    }
}

if (-not $Silent) {
    Write-Host "[OK] 已精准移除 Antigravity 壁纸引擎钩子与守护任务（其他插件如汉化钩子均已保留），重启 Antigravity 生效。" -ForegroundColor Green
}
