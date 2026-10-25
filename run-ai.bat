@echo off
title TalentIQ AI - AI / Python Service (Port 8000)
cd /d "%~dp0talentiq-ai"
echo ===================================================
echo Starting TalentIQ AI FastAPI Service...
echo FastAPI URL: http://localhost:8000
echo ===================================================
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
pause
