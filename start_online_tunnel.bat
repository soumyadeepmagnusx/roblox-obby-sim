@echo off
title Roblox Obby Simulator - Online Tunnel Host
cls
echo ==============================================================
echo   ROBLOX OBBY SIMULATOR - ONLINE MULTIPLAYER TUNNEL HOST
echo ==============================================================
echo.
echo Starting local game server on port 8080...
start "Roblox Game Server" cmd /k "node server.js"
timeout /t 2 /nobreak >nul

echo.
echo Launching instant public online tunnel for your friends...
echo (Friends anywhere in the world on phone or PC can join using the URL below)
echo.
npx -y localtunnel --port 8080
pause
