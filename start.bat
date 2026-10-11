@echo off
cd /d "%~dp0"
echo ========================================================
echo   STARTING SECURE ENHANCED GEOLOCKING (SEG 2.0)
echo ========================================================

echo [1/3] Starting Backend API Server on http://localhost:5000 ...
start "SEG Backend Server" cmd /k "cd /d "%~dp0" && npm --prefix server start"

echo [2/3] Starting Frontend Client on http://localhost:5173 ...
start "SEG Frontend Client" cmd /k "cd /d "%~dp0" && npm --prefix client run dev"

timeout /t 3 /nobreak >nul

echo [3/3] Opening Application in Browser ...
start http://localhost:5173

echo.
echo ========================================================
echo   SEG App is now running!
echo   - Local Computer: http://localhost:5173
echo   - To stop servers: Double-click stop.bat
echo ========================================================
pause
