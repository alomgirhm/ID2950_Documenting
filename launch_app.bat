@echo off
setlocal
cd /d "E:\ID2950"

:: 1. Check if server is already running on port 3000
netstat -ano | findstr "LISTENING" | findstr ":3000" >nul
if %errorlevel% neq 0 (
    start /min "" cmd /c "npx next start -p 3000"
    timeout /t 2 /nobreak >nul
)

:: 2. Launch Chrome in Desktop App Window mode
"C:\Program Files\Google\Chrome\Application\chrome.exe" --app="http://localhost:3000"

:: 3. Once user closes the Chrome window, automatically turn off the server on port 3000
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000" ^| findstr "LISTENING"') do (
    taskkill /f /pid %%a >nul 2>&1
)
