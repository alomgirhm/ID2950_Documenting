@echo off
title ID2950 Documenting Launcher
cd /d "E:\ID2950"

echo ==============================================
echo   Starting ID2950_Documenting App...
echo ==============================================
echo.

:: Open browser after 2 seconds
start "" http://localhost:3000

:: Start the Next.js production/dev server
npm run dev
