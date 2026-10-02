@echo off
setlocal
cd /d "%~dp0"
echo ========================================================
echo   ROBLOX 3D OBBY SIMULATOR - GITHUB PUSH HELPER
echo ========================================================
echo.
echo Make sure you created an empty repo on GitHub first:
echo https://github.com/new
echo.
set /p REPO_URL="Paste your GitHub Repository URL here and press Enter: "

if "%REPO_URL%"=="" (
    echo Error: No URL entered.
    pause
    exit /b
)

echo.
echo Adding remote origin...
& "C:\Program Files\Git\bin\git.exe" remote remove origin 2>nul
& "C:\Program Files\Git\bin\git.exe" remote add origin %REPO_URL%

echo.
echo Pushing to GitHub (master branch)...
& "C:\Program Files\Git\bin\git.exe" push -u origin master

echo.
echo ========================================================
echo Done! Check your GitHub repository in your browser.
echo ========================================================
pause
