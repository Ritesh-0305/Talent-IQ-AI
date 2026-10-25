@echo off
title TalentIQ AI - Spring Boot Backend (Port 8088)
cd /d "%~dp0talentiq-backend"
echo ===================================================
echo Starting TalentIQ AI Spring Boot Backend...
echo Active Profile: local (Zero-Config Embedded DB)
echo Backend Port:   8088
echo ===================================================
call .\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=local"
pause
