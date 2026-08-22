@echo off
setlocal
set "INSTALL=%LOCALAPPDATA%\FlamingBox"
if not exist "%INSTALL%" mkdir "%INSTALL%"
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "Expand-Archive -LiteralPath '%~dp0payload.zip' -DestinationPath '%INSTALL%' -Force"
if errorlevel 1 exit /b %errorlevel%
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%INSTALL%\launcher.ps1"
exit /b %errorlevel%
