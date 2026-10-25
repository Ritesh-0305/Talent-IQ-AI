@echo off
title TalentIQ AI - Platform Launcher
echo ========================================================
echo Launching TalentIQ AI Platform...
echo ========================================================
echo.
echo [1/2] Launching Spring Boot Backend in a new window...
start "TalentIQ Backend" cmd /c "%~dp0run-backend.bat"

echo Waiting 5 seconds for backend initialization...
timeout /t 5 /nobreak >nul

echo [2/2] Launching React Frontend in a new window...
start "TalentIQ Frontend" cmd /c "%~dp0run-frontend.bat"

echo.
echo ========================================================
echo TalentIQ AI is starting!
echo Backend:  http://localhost:8088/actuator/health
echo Frontend: http://localhost:5173
echo ========================================================
echo.
pause
