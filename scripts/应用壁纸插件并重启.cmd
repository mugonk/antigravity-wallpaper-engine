@echo off
chcp 65001 >nul
setlocal

set "SCRIPT_DIR=%~dp0"
set "AGY_EXE=%LOCALAPPDATA%\Programs\antigravity\Antigravity.exe"

echo [1/3] 正在关闭运行中的 Antigravity 进程...
taskkill /IM Antigravity.exe /F >nul 2>&1
timeout /t 2 /nobreak >nul

echo [2/3] 正在应用壁纸引擎钩子（与汉化插件安全共存）...
node "%SCRIPT_DIR%patch-asar.mjs"
if errorlevel 1 (
    echo [错误] 注入 app.asar 失败，请确认 Antigravity 已完全退出后重试。
    pause
    exit /b 1
)

echo [3/3] 正在重新启动 Antigravity...
if exist "%AGY_EXE%" (
    start "" "%AGY_EXE%"
    echo [完成] 已启动 Antigravity！按 Ctrl+Alt+W 或点击右上角按钮即可打开壁纸面板。
) else (
    echo [提示] 未在默认路径找到 Antigravity.exe，请手动打开 Antigravity。
)
timeout /t 2 /nobreak >nul
endlocal
