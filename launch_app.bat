@echo off
title ID2950 Launcher
cd /d "E:\ID2950"

:: 1. Check if server is already listening on port 3000
netstat -ano | findstr ":3000" | findstr "LISTENING" >nul
if %errorlevel% neq 0 (
    start "ID2950_Server" /min "E:\ID2950\run_server.bat"
    ping 127.0.0.1 -n 3 >nul
)

:: 2. Open Chrome standalone app window
start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --profile-directory="Profile 2" --app-id=hbblfifohofgngfbjbiimbbcimepbdcb
if %errorlevel% neq 0 (
    start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --app="http://localhost:3000"
)

