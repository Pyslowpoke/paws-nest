@echo off
chcp 65001 >nul
cd /d "%~dp0"
if not exist "%~dp0PawsNest.exe" goto missing
start "" "%~dp0PawsNest.exe"
exit /b
:missing
echo.
echo 当前文件夹没有 PawsNest.exe，无法启动客户端。
echo 如果你下载的是源码，请改用 desktop 文件夹里的“开发启动.cmd”。
echo 直接体验请下载 Windows 客户端，并完整解压：
echo https://github.com/Pyslowpoke/paws-nest/releases/download/v0.2.0/paws-nest-windows-x64.zip
echo.
pause
exit /b 1
