@echo off
title fasaiforcast.com - ฟ้าใสพยากรณ์ Real-Time Flood & Weather Server
echo ========================================================
echo   fasaiforcast.com - ฟ้าใสพยากรณ์ Monitoring System
echo ========================================================
echo.
echo [1/2] Building optimized production assets...
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Build failed! Check errors above.
    pause
    exit /b %errorlevel%
)

echo.
echo [2/2] Launching ThaiFlood Live production server...
echo Server running at: http://localhost:5173/
echo.
call npm run start
pause
