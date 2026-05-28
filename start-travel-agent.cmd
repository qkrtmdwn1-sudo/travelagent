@echo off
setlocal

cd /d "%~dp0"
title Travel Agent MVP

echo.
echo [Travel Agent] Starting...
echo.

if not exist "node_modules" (
  echo First run detected. Installing packages...
  call npm install
  if errorlevel 1 (
    echo.
    echo npm install failed. Please check the message above.
    pause
    exit /b 1
  )
)

echo Opening browser at http://localhost:3000
start "" "http://localhost:3000"

echo.
echo Keep this window open while using the app.
echo Press Ctrl+C to stop the server.
echo.

call npm run dev

pause
