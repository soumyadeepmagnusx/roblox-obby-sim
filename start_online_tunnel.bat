@echo off
title Roblox Obby Simulator - Cloudflare High-Speed Online Host
cls
echo ==============================================================
echo   ROBLOX OBBY SIMULATOR - CLOUDFLARE HIGH-SPEED ONLINE HOST
echo ==============================================================
echo.
echo [1/2] Checking local game server on port 8080...

:: Check if server is already running
netstat -ano | findstr :8080 >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Multiplayer server is already running!
) else (
    echo [*] Launching Node.js game server...
    start "Roblox Multiplayer Server" cmd /k "node server.js"
    timeout /t 2 /nobreak >nul
)

echo.
echo [2/2] Launching Cloudflare High-Speed Tunnel...
echo --------------------------------------------------------------
echo [*] NO PASSWORD REQUIRED! (100%% Free & No 503 Errors)
echo [*] Full HTTPS Enabled - Voice Chat (Mic) works worldwide!
echo [*] Look for the "https://....trycloudflare.com" link below!
echo --------------------------------------------------------------
echo.

if not exist "%~dp0cloudflared.exe" (
    echo Downloading high-speed tunnel binary (one-time setup)...
    powershell -Command "Invoke-WebRequest -Uri 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe' -OutFile '%~dp0cloudflared.exe' -UseBasicParsing"
)

"%~dp0cloudflared.exe" tunnel --url http://localhost:8080
pause
