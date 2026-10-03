@echo off
title Roblox Obby Simulator - Online Tunnel Host
cls
echo ==============================================================
echo   ROBLOX OBBY SIMULATOR - ONLINE MULTIPLAYER TUNNEL HOST
echo ==============================================================
echo.
echo Starting local game server on port 8080...

:: Check if server is already running
netstat -ano | findstr :8080 >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Multiplayer server is already running!
) else (
    start "Roblox Multiplayer Server" cmd /k "node server.js"
    timeout /t 2 /nobreak >nul
)

echo.
echo ==============================================================
echo Your Tunnel IP Password (if prompted by website):
curl.exe -s https://loca.lt/mytunnelpassword
echo.
echo ==============================================================
echo.
echo Generating public link for your friends...
echo (Send the URL below to your friends anywhere in the world!)
echo.
npx -y localtunnel --port 8080
pause
