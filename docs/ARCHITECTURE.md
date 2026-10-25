# TalentIQ AI — System Architecture

**Version:** 1.0  
**Phase:** 1 — Architecture Planning  
**Date:** 2026-10-24  
**Status:** Confirmed

---

## 1. Architecture Overview

TalentIQ AI is a three-tier, role-based web application comprising:

1. **React Frontend** — Single-page application (SPA) served statically or via Vite dev server
2. **Spring Boot Backend** — Authoritative REST API, business logic, security, database persistence
3. **FastAPI AI Service** — Internal-only AI utility for resume processing and ML inference

```
┌─────────────────────────────────────────────────┐
│               Browser (User)                    │
│  React + TypeScript + Vite (port 5173 dev)      │
└──────────────────────┬──────────────────────────┘
                       │ HTTPS REST/JSON
                       │ Authorization: Bearer <JWT>
┌──────────────────────▼──────────────────────────┐
│          Spring Boot API (port 8080)            │
│  • Authentication & Authorization (JWT)         │
│  • Business Logic (all 3 roles)                 │
│  • MySQL persistence via JPA/Hibernate          │
│  • File storage management                      │
│  • Internal AI orchestration                    │
└───────────┬─────────────────────────────────────┘
            │ Internal HTTP only
            │ X-Internal-Api-Key: <env>
            │ (NEVER exposed to browser)
┌───────────▼─────────────────────────────────────┐
│         FastAPI AI Service (port 8000)          │
│  • Resume parsing (PyMuPDF, python-docx)        │
│  • NLP extraction (spaCy)                       │
│  • Embedding generation (Sentence Transformers) │
│  • Semantic similarity computation              │
│  • LLM calls (Google Gemini API)               │
│  • NO direct database access                   │
│  • NO auth decision authority                  │
└─────────────────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────┐
│              MySQL 8.0 (port 3306)              │
│  Accessed only by Spring Boot via JDBC/JPA      │
└─────────────────────────────────────────────────┘
```

---

## 2. Technology Stack

### 2.1 Frontend

| Item | Choice | Rationale |
|------|--------|-----------|
| Framework | React 19 | Specified; component-based SPA |
| Language | TypeScript | Type safety, IDE support |
| Bundler | Vite 6 | Fast HMR, optimized builds |
| Styling | Tailwind CSS 4 | Utility-first, no unused CSS |
| State management | Zustand | Lightweight; no Redux boilerplate |
| HTTP client | Axios | Interceptors for JWT injection |
| Routing | React Router v7 | Declarative nested routes |
| Forms | React Hook Form + Zod | Validation, minimal re-renders |
| Icons | Lucide React | MIT-licensed, consistent |

### 2.2 Core Backend

| Item | Choice | Rationale |
|------|--------|-----------|
| Language | Java 21 LTS | Specified; virtual threads available |
| Framework | Spring Boot 3.4.x | Specified; auto-configuration |
| Security | Spring Security 6.x | JWT filter chain |
| JWT | JJWT 0.12.x | Standard Java JWT library |
| ORM | Spring Data JPA + Hibernate 6 | Specified |
| Database | MySQL 8.0 | Specified |
| Migration | Flyway 10.x | Version-controlled schema |
| HTTP Client | Spring WebClient | Non-blocking AI service calls |
| Rate limiting | Bucket4j | Token-bucket algorithm |
| Validation | Jakarta Bean Validation | @Valid annotations |
| Testing | JUnit 5, Mockito, Spring Boot Test | Specified |

### 2.3 AI Service

| Item | Choice | Rationale |
|------|--------|-----------|
| Language | Python 3.11 | Specified; mature ML ecosystem |
| Framework | FastAPI 0.115.x | Specified; async, auto-docs |
| ASGI Server | Uvicorn | Production-grade async |
| PDF Parsing | PyMuPDF (fitz) 1.25.x | Specified; fast, accurate |
| DOCX Parsing | python-docx 1.1.x | Specified |
| NLP | spaCy 3.8.x + en_core_web_sm | Specified |
| Embeddings | sentence-transformers 3.x | Specified; all-MiniLM-L6-v2 |
| LLM | google-generativeai 0.8.x (Gemini) | Specified; configurable |
| Validation | Pydantic v2 | FastAPI native |
| Testing | pytest 8.x | Specified |

---

## 3. Directory Structure

```
Talent IQ/                              ← Git repository root
├── .git/
├── .gitignore
├── README.md
├── docs/                               ← Phase 1 architecture documents
│
├── talentiq-backend/                   ← Spring Boot application
│   ├── pom.xml
│   ├── mvnw  /  mvnw.cmd               ← Maven Wrapper (no global Maven needed)
│   ├── .mvn/wrapper/maven-wrapper.properties
│   └── src/
│       ├── main/
│       │   ├── java/com/talentiq/
│       │   │   ├── TalentIqApplication.java
│       │   │   ├── config/
│       │   │   │   ├── SecurityConfig.java
│       │   │   │   ├── CorsConfig.java
│       │   │   │   ├── JwtConfig.java
│       │   │   │   ├── WebClientConfig.java      ← AI service HTTP client
│       │   │   │   ├── StorageConfig.java        ← File storage abstraction
│       │   │   │   └── RateLimitConfig.java
│       │   │   ├── controller/
│       │   │   │   ├── AuthController.java
│       │   │   │   ├── CandidateController.java
│       │   │   │   ├── JobController.java
│       │   │   │   ├── ApplicationController.java
│       │   │   │   ├── ResumeController.java
│       │   │   │   ├── MatchingController.java
│       │   │   │   ├── CareerController.java
│       │   │   │   ├── InterviewController.java
│       │   │   │   ├── RecruiterController.java
│       │   │   │   └── AdminController.java
│       │   │   ├── service/
│       │   │   │   ├── AuthService.java
│       │   │   │   ├── UserService.java
│       │   │   │   ├── CandidateService.java
│       │   │   │   ├── RecruiterService.java
│       │   │   │   ├── CompanyService.java
│       │   │   │   ├── JobService.java
│       │   │   │   ├── ApplicationService.java
│       │   │   │   ├── ResumeService.java
│       │   │   │   ├── StorageService.java       ← Abstraction interface + LocalImpl
│       │   │   │   ├── AiOrchestrationService.java
│       │   │   │   ├── MatchingService.java
│       │   │   │   ├── CareerService.java
│       │   │   │   ├── InterviewService.java
│       │   │   │   ├── NotificationService.java
│       │   │   │   └── AdminService.java
│       │   │   ├── repository/
│       │   │   │   ├── UserRepository.java
│       │   │   │   ├── CandidateProfileRepository.java
│       │   │   │   ├── RecruiterProfileRepository.java
│       │   │   │   ├── CompanyRepository.java
│       │   │   │   ├── JobRepository.java
│       │   │   │   ├── ApplicationRepository.java
│       │   │   │   ├── ResumeRepository.java
│       │   │   │   ├── ResumeVersionRepository.java
│       │   │   │   ├── AtsAnalysisRepository.java
│       │   │   │   ├── MatchingResultRepository.java
│       │   │   │   ├── InterviewSessionRepository.java
│       │   │   │   ├── NotificationRepository.java
│       │   │   │   └── AuditEventRepository.java
│       │   │   ├── entity/
│       │   │   │   ├── User.java
│       │   │   │   ├── CandidateProfile.java
│       │   │   │   ├── RecruiterProfile.java
│       │   │   │   ├── Company.java
│       │   │   │   ├── Job.java
│       │   │   │   ├── JobRequirement.java
│       │   │   │   ├── Application.java
│       │   │   │   ├── ApplicationStatusHistory.java
│       │   │   │   ├── Resume.java
│       │   │   │   ├── ResumeVersion.java
│       │   │   │   ├── ParsedResumeData.java
│       │   │   │   ├── AtsAnalysis.java
│       │   │   │   ├── MatchingResult.java
│       │   │   │   ├── SkillGap.java
│       │   │   │   ├── CareerRecommendation.java
│       │   │   │   ├── InterviewSession.java
│       │   │   │   ├── InterviewQuestion.java
│       │   │   │   ├── InterviewAnswer.java
│       │   │   │   ├── Notification.java
│       │   │   │   ├── AuditEvent.java
│       │   │   │   └── RecruiterNote.java
│       │   │   ├── dto/
│       │   │   │   ├── request/     ← Inbound request bodies
│       │   │   │   └── response/    ← Outbound response bodies
│       │   │   ├── security/
│       │   │   │   ├── JwtUtil.java
│       │   │   │   ├── JwtAuthFilter.java
│       │   │   │   └── UserDetailsServiceImpl.java
│       │   │   ├── enums/
│       │   │   │   ├── Role.java                 (CANDIDATE, RECRUITER, ADMIN)
│       │   │   │   ├── JobStatus.java            (DRAFT, PUBLISHED, CLOSED)
│       │   │   │   ├── ApplicationStatus.java
│       │   │   │   └── AnalysisStatus.java       (PENDING, PROCESSING, COMPLETED, FAILED)
│       │   │   └── exception/
│       │   │       ├── GlobalExceptionHandler.java
│       │   │       ├── ResourceNotFoundException.java
│       │   │       ├── UnauthorizedException.java
│       │   │       └── ValidationException.java
│       │   └── resources/
│       │       ├── application.yml              ← Non-secret config
│       │       ├── application-dev.yml          ← Secret config (gitignored)
│       │       └── db/migration/               ← Flyway SQL files
│       └── test/
│
├── talentiq-ai/                        ← FastAPI AI service
│   ├── requirements.txt
│   ├── .env.example
│   ├── .env                            ← Gitignored
│   ├── main.py
│   └── app/
│       ├── routers/
│       │   ├── parse.py
│       │   ├── analyze.py
│       │   ├── match.py
│       │   ├── resume.py
│       │   ├── career.py
│       │   └── interview.py
│       ├── services/
│       │   ├── resume_parser.py
│       │   ├── nlp_service.py
│       │   ├── embedding_service.py
│       │   ├── ats_service.py
│       │   ├── matching_service.py
│       │   ├── llm_service.py
│       │   ├── career_service.py
│       │   └── interview_service.py
│       ├── models/
│       │   ├── parse_models.py
│       │   ├── analyze_models.py
│       │   ├── match_models.py
│       │   ├── career_models.py
│       │   └── interview_models.py
│       ├── middleware/
│       │   └── api_key_auth.py
│       └── utils/
│           ├── text_utils.py
│           └── file_utils.py
│
└── talentiq-frontend/                  ← React SPA
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.ts
    ├── tsconfig.json
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── api/
        │   ├── client.ts            ← Axios instance + interceptors
        │   ├── auth.api.ts
        │   ├── candidate.api.ts
        │   ├── job.api.ts
        │   ├── application.api.ts
        │   ├── resume.api.ts
        │   ├── matching.api.ts
        │   ├── career.api.ts
        │   ├── interview.api.ts
        │   └── admin.api.ts
        ├── components/
        │   ├── ui/                  ← Base components (Button, Input, Badge, Card, Modal)
        │   ├── layout/              ← CandidateLayout, RecruiterLayout, AdminLayout
        │   └── domain/              ← JobCard, ApplicationRow, ResumeUploader, etc.
        ├── pages/
        │   ├── auth/
        │   ├── candidate/
        │   ├── recruiter/
        │   └── admin/
        ├── store/
        │   ├── auth.store.ts
        │   └── notification.store.ts
        ├── hooks/
        ├── types/
        └── utils/
```

---

## 4. Cross-Cutting Concerns

### 4.1 Authentication Flow

```
1. POST /api/v1/auth/register  →  User created, JWT returned
2. POST /api/v1/auth/login     →  Credentials validated, JWT returned
3. All subsequent requests     →  Authorization: Bearer <access_token>
4. JwtAuthFilter intercepts    →  Validates token, loads UserDetails, sets SecurityContext
5. @PreAuthorize annotations   →  Enforce role-based method access
```

Access token lifetime: 24 hours (configurable)  
Refresh token: stored server-side in DB, 7-day lifetime  
Token storage: `localStorage` (frontend) — XSS mitigated by Content Security Policy

### 4.2 AI Orchestration Flow

```
Candidate or Recruiter action
       │
       ▼
Spring Boot Controller
       │ Validates auth + authorization
       ▼
Spring Boot Service
       │ Retrieves resume bytes from StorageService
       │ Calls AiOrchestrationService.analyzeResume(...)
       ▼
AiOrchestrationService (Spring Boot)
       │ POST /api/v1/parse/resume  →  FastAPI
       │ POST /api/v1/analyze/ats  →  FastAPI
       │ POST /api/v1/match/semantic →  FastAPI
       ▼
FastAPI AI Service
       │ Returns structured JSON result
       ▼
Spring Boot persists result to MySQL via JPA
       │
       ▼
JSON response to frontend
```

### 4.3 File Storage Abstraction

`StorageService` interface provides:
- `store(MultipartFile file, String candidateId) → StorageReference`
- `retrieve(StorageReference ref) → byte[]`
- `delete(StorageReference ref) → void`

Initial implementation: `LocalStorageServiceImpl` — stores files at `${app.storage.base-path}/resumes/{candidateId}/{uuid}.{ext}`

Future implementation: `S3StorageServiceImpl` — drop-in replacement, no business logic changes

Files are **never accessible via public URLs**. Candidates retrieve them through authenticated Spring Boot endpoints that enforce ownership checks.

### 4.4 Error Handling Strategy

| Layer | Mechanism |
|-------|-----------|
| Frontend | Axios response interceptors → toast notifications |
| Spring Boot | `GlobalExceptionHandler` → RFC 7807 Problem Details |
| FastAPI | FastAPI exception handlers → JSON error responses |
| AI failure | Spring Boot catches FastAPI errors → partial result or graceful degradation |

Standard error response:
```json
{
  "type": "https://talentiq.ai/errors/not-found",
  "title": "Resource Not Found",
  "status": 404,
  "detail": "Job with ID 42 does not exist",
  "instance": "/api/v1/jobs/42",
  "timestamp": "2026-10-24T16:00:00Z"
}
```

### 4.5 Environment Configuration

Spring Boot reads configuration in this priority order:
1. Environment variables (highest — used for secrets)
2. `application-dev.yml` (gitignored — local dev secrets)
3. `application.yml` (committed — safe non-secret defaults)

FastAPI reads all configuration from `.env` (gitignored) or environment variables.

---

## 5. Resume File Storage Design

### 5.1 Constraints
- Files stored outside the web root (no direct browser access)
- Maximum file size: 10 MB (configurable via `app.storage.max-file-size`)
- Allowed MIME types: `application/pdf`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- Files validated by magic bytes, not just extension
- File path: `{storage.base-path}/resumes/{candidateId}/{uuid}-{version}.{ext}`

### 5.2 Metadata in MySQL
```
resume_versions table:
  id, resume_id, version_number, storage_path, original_filename,
  file_size_bytes, mime_type, upload_timestamp, is_active
```

### 5.3 Production Limitation (Documented)
> Local filesystem storage is **not suitable for production** multi-instance deployments. Files stored locally are not shared across application instances and are lost if the server's local disk is replaced. Before production deployment, replace `LocalStorageServiceImpl` with `S3StorageServiceImpl` or equivalent cloud storage. The `StorageService` interface is designed for this switch.

---

## 6. Semantic Matching Architecture

### 6.1 Embedding Strategy
- Model: `all-MiniLM-L6-v2` (384-dimensional vectors, MIT license)
- Resume embedding: concatenated sections (skills + experience + education)
- Job embedding: full job description text
- Similarity: cosine similarity = dot(a, b) / (|a| × |b|)

### 6.2 Composite Score Formula
```
composite_score = (
    w1 × semantic_similarity +
    w2 × keyword_overlap_ratio +
    w3 × ats_score_normalized
) × 100
```

Default weights (configurable via environment variables):
- `w1 = 0.50` (semantic similarity)
- `w2 = 0.30` (keyword overlap)
- `w3 = 0.20` (ATS score)

### 6.3 Explainability
For each match, the system returns:
- `matched_requirements[]` — job requirements the resume satisfies
- `missing_requirements[]` — job requirements not evidenced in resume
- `matched_skills[]` — explicitly matched skill terms
- `missing_skills[]` — required skills absent from resume
- `evidence_snippets[]` — resume text segments supporting each match claim

---

## 7. Gemini Integration Architecture

### 7.1 Configuration
```
Environment variable: GEMINI_API_KEY
Model: gemini-2.0-flash (configurable via AI_GEMINI_MODEL env var)
```

### 7.2 Usage Points
| Feature | Gemini Role |
|---------|------------|
| ATS improvement suggestions | Generate actionable recommendations |
| Career guidance | Produce skill gap + learning path narrative |
| Mock interview questions | Generate role-specific questions |
| Interview feedback | Score and critique candidate answers |
| Resume improvement | Section-by-section recommendations |
| Candidate insights | Structured strengths/gaps summary |

### 7.3 Fallback Behavior
When `GEMINI_API_KEY` is unavailable or API call fails:
- Embedding and keyword-based operations proceed without LLM
- LLM-dependent outputs return: `{"status": "unavailable", "message": "AI analysis requires Gemini API configuration"}`
- System logs the failure; does not expose API key errors to the client
- Features requiring Gemini are clearly marked in the UI as "AI-powered (requires configuration)"

### 7.4 Provider Abstraction
`LlmService` in FastAPI is an abstraction:
```python
class LlmService:
    def generate(self, prompt: str, system_prompt: str = None) -> str: ...
```
Implemented by `GeminiLlmService`. Future: swap for `OpenAiLlmService` or `AnthropicLlmService` without changing callers.

---

## 8. Testing Architecture

See `docs/IMPLEMENTATION_PLAN.md` §Testing for full strategy.

| Layer | Tools | Scope |
|-------|-------|-------|
| Spring Boot unit | JUnit 5, Mockito | Service + security logic |
| Spring Boot integration | Spring Boot Test, H2 (test) | Full HTTP + DB round trips |
| FastAPI unit | pytest | Parser, NLP, embedding, LLM mock |
| FastAPI integration | pytest + httpx | Endpoint contracts |
| Frontend unit | Vitest + Testing Library | Components, hooks |
| Frontend E2E | Playwright | Critical user journeys |
| Security | Manual + integration | Auth bypass, file validation |

---

## 9. Deployment Considerations (Phase 11)

- Spring Boot: packaged as executable JAR (`mvnw package`)
- FastAPI: packaged with `requirements.txt` + `uvicorn` startup command
- Frontend: `npm run build` → static files served by Spring Boot or Nginx
- Environment: all secrets injected via OS environment variables
- MySQL: external managed instance for production
- Storage: replace `LocalStorageServiceImpl` with cloud provider
- Reverse proxy: Nginx recommended for TLS termination and static file serving

---

*Document status: Confirmed. Architecture is locked for Phase 2 implementation.*
