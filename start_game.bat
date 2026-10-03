@echo off
title Roblox Obby Simulator - Launcher
cls
echo ========================================================
echo   ROBLOX 3D OBBY SIMULATOR - PRO MULTIPLAYER EDITION
echo ========================================================
echo.

:: Check if server is already running on port 8080
netstat -ano | findstr :8080 >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Multiplayer Server is already running on port 8080!
) else (
    echo [STARTING] Starting Node.js multiplayer server...
    start "Roblox Server [Do Not Close]" cmd /k "node server.js"
    timeout /t 2 /nobreak >nul
)

echo.
echo [LAUNCHING] Opening game at http://localhost:8080 ...
start "" "http://localhost:8080"
echo.
echo ========================================================
echo Game is now running! Keep the server window open.
echo Local Wi-Fi link for friends: http://192.168.1.7:8080
echo Online Internet link: run start_online_tunnel.bat
echo ========================================================
echo.
pause
