@echo off
title PronounceAI Frontend Dev Server
echo ==============================================
echo   Starting Antigravity PronounceAI Frontend
echo ==============================================
echo.

cd %~dp0
npm run dev

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Frontend failed to start.
    echo Please make sure Node.js and NPM packages are installed.
    pause
)
