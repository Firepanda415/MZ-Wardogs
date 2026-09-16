@echo off
setlocal
if not exist "%~dp0desktop\node_modules\electron\dist\electron.exe" (
  echo First run: install Node.js, then open the desktop folder and run npm ci.
  pause
  exit /b 1
)
set ELECTRON_RUN_AS_NODE=
start "" "%~dp0desktop\node_modules\electron\dist\electron.exe" "%~dp0desktop"
