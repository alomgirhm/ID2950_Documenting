@echo off
cd /d "E:\ID2950"

:: 1. Check if server is already listening on port 3000
netstat -ano | findstr ":3000" | findstr "LISTENING" >nul
if %errorlevel% neq 0 (
    :: Start production server in background
    start "ID2950_Server" /min cmd /c "npx next start -p 3000"
    
    :: Loop and wait until port 3000 is actually listening
    for /L %%i in (1,1,15) do (
        timeout /t 1 /nobreak >nul
        netstat -ano | findstr ":3000" | findstr "LISTENING" >nul
        if not errorlevel 1 goto :server_ready
    )
)

:server_ready
:: 2. Open Chrome in standalone desktop window
start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --app="http://localhost:3000"
