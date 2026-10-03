@echo off
title Stop ID2950 Server
cd /d "E:\ID2950"

for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
)

echo ID2950 server has been stopped.
timeout /t 2 >nul

