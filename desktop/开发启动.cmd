@echo off
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 goto neednode
node -e "process.exit(Number(process.versions.node.split('.')[0])>=22?0:1)"
if errorlevel 1 goto neednode
where npm >nul 2>nul
if errorlevel 1 goto neednode
if exist "node_modules\electron\dist\electron.exe" goto run
echo 首次启动需要下载开发依赖和 Electron，请保持联网。
call npm install --include=dev
if errorlevel 1 goto failed
:run
call npm start
if errorlevel 1 goto failed
exit /b 0
:neednode
echo 源码运行需要 Node.js 22 或以上版本，请从 https://nodejs.org/ 安装。
echo 如果只想使用桌宠，请从官网选择“下载 Windows 桌宠”。
pause
exit /b 1
:failed
echo.
echo 开发版启动失败，请保留上面的错误信息。
echo 如果是 Electron 下载失败，请检查网络后重试。
pause
exit /b 1
