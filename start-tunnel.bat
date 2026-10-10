@echo off
echo ========================================================
echo   STARTING CLOUDFLARE SECURE HTTPS TUNNEL FOR PHONE
echo ========================================================

echo Starting tunnel on port 5173...
.\cloudflared.exe tunnel --url http://localhost:5173
pause
