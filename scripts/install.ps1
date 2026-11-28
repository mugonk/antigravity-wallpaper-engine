param(
    [switch]$Silent
)

$ErrorActionPreference = "Stop"

$pluginRoot = Split-Path -Parent $PSScriptRoot
$patchScript = Join-Path $pluginRoot "scripts\patch-asar.mjs"
$vbsLauncher = Join-Path $pluginRoot "scripts\launch-antigravity.vbs"
$zhVbsLauncher = Join-Path $env:USERPROFILE ".gemini\config\plugins\antigravity-zh-cn\scripts\launch-antigravity.vbs"
$taskName = "Antigravity-WE-AutoGuard"

# 1. If antigravity-zh-cn smart launcher is present, ensure it also self-heals WE hook before launch
$coexistLauncherUpdated = $false
if (Test-Path $zhVbsLauncher) {
    try {
        $zhContent = Get-Content -Path $zhVbsLauncher -Raw -Encoding UTF8
        if ($zhContent -notmatch "antigravity-wallpaper-engine") {
            Copy-Item -Path $vbsLauncher -Destination $zhVbsLauncher -Force
            $coexistLauncherUpdated = $true
        } else {
            $coexistLauncherUpdated = $true
        }
    } catch {}
}

# 2. Register Windows Logon Scheduled Task (auto-heals hook after official updates)
$taskRegistered = $false
try {
    $nodeExe = (Get-Command node -ErrorAction Stop).Source
    $action = New-ScheduledTaskAction -Execute $nodeExe -Argument "`"$patchScript`" --quiet"
    $trigger = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME
    $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -Hidden -ExecutionTimeLimit (New-TimeSpan -Minutes 1)
    Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Description "Ensure Antigravity Wallpaper Engine hook survives official updates" -Force | Out-Null
    $taskRegistered = $true
} catch {
    try {
        $tr = "node `"$patchScript`" --quiet"
        schtasks /Create /TN $taskName /TR $tr /SC ONLOGON /F | Out-Null
        if ($LASTEXITCODE -eq 0) { $taskRegistered = $true }
    } catch {}
}

# 3. Attempt immediate coexistence-safe ASAR patch
$patchNow = $false
try {
    node $patchScript --quiet
    if ($LASTEXITCODE -eq 0) { $patchNow = $true }
} catch {}

if (-not $Silent) {
    Write-Host "[OK] Antigravity 壁纸引擎守护已配置完成（与汉化插件安全共存）！" -ForegroundColor Green
    Write-Host "     - 快捷方式智能自愈联动：$(if ($coexistLauncherUpdated) { '已联动（启动前自动补齐汉化与壁纸钩子）' } else { '使用独立守护' })"
    Write-Host "     - 开机登录自动守护（$taskName）：$(if ($taskRegistered) { '已注册' } else { '由智能启动器 + before-quit 更新守护负责' })"
    if ($patchNow) {
        Write-Host "     - app.asar 已注入独立 1 行引导钩子，重启 Antigravity 立即生效！" -ForegroundColor Cyan
    } else {
        Write-Host "     - 当前 Antigravity 正在运行并占用 app.asar：请完全退出后通过桌面/开始菜单图标重新打开，或直接双击 scripts\应用壁纸插件并重启.cmd。" -ForegroundColor Yellow
    }
}
