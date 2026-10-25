@echo off
title TalentIQ AI - React Frontend (Port 5173)
cd /d "%~dp0talentiq-frontend"
echo ===================================================
echo Starting TalentIQ AI React Frontend...
echo Frontend URL: http://localhost:5173
echo Backend API:  http://localhost:8088
echo ===================================================
call npm.cmd run dev
pause
