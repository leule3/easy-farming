@echo off
title Easy Farming - One Click Start
color 0A
echo ============================================
echo    🌾 EASY FARMING - STARTING...
echo ============================================
echo.

REM Step 1: Start MySQL (if not running)
echo [1/3] Checking MySQL...
sc query MySQL | find "RUNNING" >nul
if errorlevel 1 (
    echo Starting MySQL...
    net start MySQL
) else (
    echo MySQL is already running ✓
)

REM Step 2: Start Backend
echo [2/3] Starting Backend Server...
start "EasyFarming-Backend" cmd /k "cd /d C:\Users\leule\Desktop\fp3\backend && node server.js"

REM Wait for backend to start
timeout /t 3 /nobreak >nul

REM Step 3: Start Frontend
echo [3/3] Starting Frontend...
start "EasyFarming-Frontend" cmd /k "cd /d C:\Users\leule\Desktop\fp3\frontend && npm run dev"

REM Open browser
timeout /t 5 /nobreak >nul
start http://localhost:5173

echo.
echo ============================================
echo    ✅ ALL DONE! Opening browser...
echo    Backend:  http://localhost:5000
echo    Frontend: http://localhost:5173
echo    Login:    0911111111 / admin123
echo ============================================
pause