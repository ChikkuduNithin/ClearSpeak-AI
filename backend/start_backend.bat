@echo off
title PronounceAI Backend Server
echo ==============================================
echo   Starting Antigravity PronounceAI Backend
echo ==============================================
echo Isolated Venv: ..\.venv
echo.

cd %~dp0
..\.venv\Scripts\python.exe main.py

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Backend failed to start.
    echo Please make sure the virtual environment is correctly set up.
    pause
)
