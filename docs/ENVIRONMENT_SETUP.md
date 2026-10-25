# TalentIQ AI — Environment Setup Guide

**Version:** 1.0  
**Phase:** 1 — Architecture Planning  
**Date:** 2026-10-24

---

## 1. Prerequisites

### 1.1 Verified on This Machine

| Tool | Version Found | Required Version | Status |
|------|--------------|-----------------|--------|
| Java | 21.0.12.1 (+ JDK 25 also installed) | JDK 21 LTS | ✅ |
| Maven | 3.9.9 (via wrapper cache `~/.m2/wrapper`) | 3.9+ | ✅ (via `mvnw.cmd`) |
| Node.js | v24.17.0 | v20+ | ✅ |
| npm | 11.13.0 | 9+ | ✅ |
| Python | 3.11.9 | 3.10+ | ✅ |
| pip | 24.0 | 23+ | ✅ |
| MySQL | 8.0 (installed, configured on port 3306) | 8.0 | ⚠️ (service may not be running) |
| Git | 2.50.1 | 2.30+ | ✅ |

### 1.2 MySQL Status (Important)

**Finding:** MySQL 8.0 is installed and configured at `C:\Program Files\MySQL\MySQL Server 8.0`. The Windows service `MySQL80` is registered with Start Type = Automatic (2), but port 3306 was **not listening** at inspection time (2026-10-24). The service must be started before Phase 2 can proceed.

**To start MySQL Server:**
```powershell
# Run PowerShell as Administrator, then:
Start-Service -Name MySQL80

# Verify it is running:
netstat -an | Select-String "3306"
# Expected output: TCP    0.0.0.0:3306    0.0.0.0:0    LISTENING
```

**If the service does not start**, check the MySQL error log:
```
C:\ProgramData\MySQL\MySQL Server 8.0\Data\<hostname>.err
```

### 1.3 Known Environment Quirks

| Quirk | Impact | Workaround |
|-------|--------|-----------|
| OneDrive ReparsePoint | `cmd.exe` blocks access with "Access is denied" | Use PowerShell `Set-Location` for all commands |
| `npm` PowerShell alias blocked by execution policy | `npm` command fails in PS | Use `npm.cmd` instead |
| Maven not on global PATH | `mvn` not recognized | Use `mvnw.cmd` (Maven Wrapper) — generated in Phase 2 |
| Git `-C` flag on OneDrive path | Permission denied | Use `Set-Location <path>` then plain `git` commands |

---

## 2. MySQL Database Setup

After confirming MySQL is running, run these commands using the MySQL CLI:

```powershell
# Connect as root (you will be prompted for root password)
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p
```

Inside MySQL shell:
```sql
-- Create application database
CREATE DATABASE IF NOT EXISTS talentiq
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- Create dedicated application user (minimum required privileges)
CREATE USER IF NOT EXISTS 'talentiq_user'@'localhost' IDENTIFIED BY '<YOUR_CHOSEN_PASSWORD>';

-- Grant only what the application needs (no SUPER, no FILE)
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, DROP, REFERENCES
  ON talentiq.* TO 'talentiq_user'@'localhost';

-- Grant Flyway migration privileges
GRANT CREATE, ALTER, DROP, INDEX ON talentiq.* TO 'talentiq_user'@'localhost';

FLUSH PRIVILEGES;

-- Verify:
SHOW GRANTS FOR 'talentiq_user'@'localhost';
```

> **Important:** Replace `<YOUR_CHOSEN_PASSWORD>` with a strong password. Do not use the root account for application access.

---

## 3. Environment Variables Reference

### 3.1 Spring Boot (`talentiq-backend`)

Store in `talentiq-backend/src/main/resources/application-dev.yml` (gitignored) or set as OS environment variables.

**Database:**
```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/talentiq?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
    username: talentiq_user
    password: <YOUR_DB_PASSWORD>
```

**JWT:**
```yaml
app:
  jwt:
    secret: <256-BIT-RANDOM-SECRET>
    expiration-ms: 86400000       # 24 hours
    refresh-expiration-ms: 604800000  # 7 days
```

**File storage:**
```yaml
app:
  storage:
    base-path: C:/talentiq-uploads   # Outside web root; adjust per environment
    max-file-size: 10485760          # 10 MB in bytes
```

**AI service:**
```yaml
app:
  ai:
    service-url: http://localhost:8000
    internal-api-key: <64-CHAR-RANDOM-KEY>
    timeout-seconds: 60
```

**Admin seed:**
```yaml
app:
  admin:
    seed-email: admin@talentiq.local
    seed-password: <ADMIN_INITIAL_PASSWORD>
```

**Equivalent environment variables (OS-level, for production):**
```
SPRING_DATASOURCE_URL=jdbc:mysql://localhost:3306/talentiq?useSSL=false&serverTimezone=UTC
SPRING_DATASOURCE_USERNAME=talentiq_user
SPRING_DATASOURCE_PASSWORD=<password>
APP_JWT_SECRET=<secret>
APP_JWT_EXPIRATION_MS=86400000
APP_JWT_REFRESH_EXPIRATION_MS=604800000
APP_STORAGE_BASE_PATH=/var/talentiq/uploads
APP_STORAGE_MAX_FILE_SIZE=10485760
APP_AI_SERVICE_URL=http://localhost:8000
APP_AI_INTERNAL_API_KEY=<key>
APP_AI_TIMEOUT_SECONDS=60
APP_ADMIN_SEED_EMAIL=admin@talentiq.local
APP_ADMIN_SEED_PASSWORD=<password>
```

### 3.2 FastAPI (`talentiq-ai/.env`)

```env
# Internal authentication (must match Spring Boot app.ai.internal-api-key)
AI_INTERNAL_API_KEY=<64-CHAR-RANDOM-KEY>

# Google Gemini LLM
GEMINI_API_KEY=<YOUR_GEMINI_API_KEY>
GEMINI_MODEL=gemini-2.0-flash

# Service configuration
AI_SERVICE_HOST=127.0.0.1
AI_SERVICE_PORT=8000
AI_LOG_LEVEL=INFO

# Sentence Transformers model
EMBEDDING_MODEL=all-MiniLM-L6-v2

# Composite matching weights (must sum to 1.0)
MATCH_WEIGHT_SEMANTIC=0.50
MATCH_WEIGHT_KEYWORD=0.30
MATCH_WEIGHT_ATS=0.20
```

### 3.3 Frontend (`talentiq-frontend/.env.local`)

```env
VITE_API_BASE_URL=http://localhost:8080/api/v1
```

> `.env.local` is gitignored by Vite by default. Do not put secrets in this file — it only configures the backend URL.

---

## 4. Development Startup Instructions

### Step 1: Start MySQL
```powershell
# Run as Administrator if needed
Start-Service -Name MySQL80
```

### Step 2: Start Spring Boot Backend
```powershell
Set-Location "c:\Users\Ritesh\OneDrive\Desktop\Talent IQ\talentiq-backend"
.\mvnw.cmd spring-boot:run -Dspring-boot.run.profiles=dev
```
Expected: Spring Boot starts on port 8080. Flyway migrations run. Actuator health at `http://localhost:8080/actuator/health`.

### Step 3: Start FastAPI AI Service
```powershell
Set-Location "c:\Users\Ritesh\OneDrive\Desktop\Talent IQ\talentiq-ai"
.\.venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
Expected: FastAPI starts. Docs at `http://127.0.0.1:8000/docs` (development only).

### Step 4: Start Frontend
```powershell
Set-Location "c:\Users\Ritesh\OneDrive\Desktop\Talent IQ\talentiq-frontend"
npm.cmd run dev
```
Expected: Vite dev server at `http://localhost:5173`.

---

## 5. Python Virtual Environment Setup

```powershell
Set-Location "c:\Users\Ritesh\OneDrive\Desktop\Talent IQ\talentiq-ai"

# Create virtual environment
python -m venv .venv

# Activate (PowerShell)
.\.venv\Scripts\Activate.ps1
# If activation is blocked by execution policy:
# .\.venv\Scripts\python.exe -m pip install ... (use python directly)

# Install all dependencies
.\.venv\Scripts\pip.exe install -r requirements.txt

# Download spaCy model
.\.venv\Scripts\python.exe -m spacy download en_core_web_sm

# Sentence Transformers model (all-MiniLM-L6-v2) is downloaded automatically on first inference run
```

> **Note:** The Sentence Transformers model (`all-MiniLM-L6-v2`) is approximately 90 MB and is downloaded from HuggingFace Hub on first use. Ensure network access is available during Phase 5 setup. After download it is cached in `~/.cache/huggingface/`.

---

## 6. Running Tests

### Spring Boot Tests
```powershell
Set-Location "c:\Users\Ritesh\OneDrive\Desktop\Talent IQ\talentiq-backend"
.\mvnw.cmd test
```

### FastAPI Tests
```powershell
Set-Location "c:\Users\Ritesh\OneDrive\Desktop\Talent IQ\talentiq-ai"
.\.venv\Scripts\python.exe -m pytest tests/ -v
```

### Frontend Tests
```powershell
Set-Location "c:\Users\Ritesh\OneDrive\Desktop\Talent IQ\talentiq-frontend"
npm.cmd run test
```

---

## 7. Gemini API Key Setup

The `GEMINI_API_KEY` is required starting from Phase 7 (career guidance, LLM-powered features).

To obtain a key:
1. Go to [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Create a new API key for a Google Cloud project
3. Add to `talentiq-ai/.env`:
   ```
   GEMINI_API_KEY=AIza...
   ```
4. Restart the FastAPI service

Features requiring `GEMINI_API_KEY`:
- ATS improvement suggestions (Phase 5)
- Resume improvement suggestions (Phase 7)
- Career guidance and learning paths (Phase 7)
- Mock interview question generation (Phase 8)
- Interview answer feedback (Phase 8)
- AI candidate insights for recruiters (Phase 6)

Features that work WITHOUT `GEMINI_API_KEY`:
- Resume parsing (PyMuPDF + python-docx)
- NLP extraction (spaCy)
- ATS keyword scoring (rule-based)
- Semantic similarity (Sentence Transformers)
- Composite match scoring

---

## 8. Local File Storage Setup

Resume files are stored at the path configured in `APP_STORAGE_BASE_PATH`.

**Create the storage directory:**
```powershell
New-Item -ItemType Directory -Path "C:\talentiq-uploads\resumes" -Force
```

**Permissions:** The directory must be writable by the Java process running Spring Boot.

**Production Limitation:**
> Local filesystem storage is not suitable for multi-instance production deployment. If you run more than one Spring Boot instance, resume files stored locally will not be shared. Migrate to `S3StorageServiceImpl` before scaling horizontally.

---

## 9. JAVA_HOME Configuration

If the wrong JDK version is used, configure `JAVA_HOME` explicitly:

```powershell
# For JDK 21 (preferred)
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-21.0.12.1"
# OR (depending on installation path):
$env:JAVA_HOME = "C:\Program Files\Java\jdk-21.0.12"

# Add to PATH
$env:PATH = "$env:JAVA_HOME\bin;" + $env:PATH

# Verify
java -version
# Expected: openjdk version "21.x.x" ...
```

**Note:** JDK 25 is also installed but should not be used for this project. The `pom.xml` will enforce `<java.version>21</java.version>` as a compile-time check.

---

## 10. Gitignore Reference

The `.gitignore` at the repository root will cover:

```gitignore
# Java build output
talentiq-backend/target/

# Maven wrapper cache (optional — keep if offline builds needed)
# !.mvn/wrapper/maven-wrapper.jar

# Spring Boot secret config
talentiq-backend/src/main/resources/application-dev.yml
talentiq-backend/src/main/resources/application-local.yml

# Python virtual environment
talentiq-ai/.venv/
talentiq-ai/__pycache__/
talentiq-ai/**/__pycache__/
talentiq-ai/.env

# Frontend build output and dependencies
talentiq-frontend/node_modules/
talentiq-frontend/dist/
talentiq-frontend/.env.local

# File uploads
uploads/
talentiq-uploads/
*.upload

# Logs
*.log
logs/

# OS artifacts
.DS_Store
Thumbs.db

# IDE
.idea/
*.iml
.vscode/settings.json (exclude user-specific settings only)
```

---

## 11. Dependency Versions (Locked)

### Spring Boot `pom.xml` key dependencies

| Dependency | Version |
|-----------|---------|
| `spring-boot-starter-parent` | 3.4.x |
| `jjwt-api` | 0.12.6 |
| `jjwt-impl` | 0.12.6 |
| `jjwt-jackson` | 0.12.6 |
| `com.bucket4j:bucket4j-core` | 8.10.x |
| `org.flywaydb:flyway-mysql` | 10.x |
| `org.projectlombok:lombok` | (managed by Spring Boot) |

### FastAPI `requirements.txt`

```
fastapi==0.115.0
uvicorn[standard]==0.32.0
PyMuPDF==1.25.0
python-docx==1.1.2
spacy==3.8.3
sentence-transformers==3.3.0
google-generativeai==0.8.3
pydantic==2.10.0
python-multipart==0.0.20
httpx==0.28.0
pytest==8.3.0
pytest-asyncio==0.24.0
```

### Frontend `package.json` key dependencies

```json
{
  "react": "^19.0.0",
  "react-dom": "^19.0.0",
  "react-router-dom": "^7.0.0",
  "axios": "^1.7.0",
  "zustand": "^5.0.0",
  "@tanstack/react-query": "^5.0.0",
  "react-hook-form": "^7.54.0",
  "zod": "^3.23.0",
  "lucide-react": "^0.468.0",
  "tailwindcss": "^4.0.0",
  "@vitejs/plugin-react": "^4.3.0"
}
```

---

*This document will be updated at the end of each phase with any changes to setup requirements.*
