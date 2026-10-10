@echo off
echo ========================================================
echo   STOPPING SECURE ENHANCED GEOLOCKING (SEG 2.0)
echo ========================================================

powershell -Command "Get-NetTCPConnection -LocalPort 5000, 5173 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }; Stop-Process -Name cloudflared -Force -ErrorAction SilentlyContinue"

echo All SEG servers and tunnels have been successfully stopped!
pause
