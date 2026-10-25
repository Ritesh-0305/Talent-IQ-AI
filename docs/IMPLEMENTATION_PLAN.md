# TalentIQ AI — Implementation Plan

**Version:** 1.0  
**Phase:** 1 — Architecture Planning  
**Date:** 2026-10-24

---

## Overview

Each phase delivers working, tested, committed code. No phase is considered complete until:
1. All specified features are implemented with real backend logic and database persistence.
2. Relevant tests have been run and passed (or failures are explicitly documented).
3. A phase summary is produced (see Phase Summary Template below).

---

## Phase Summary Template

At the end of every phase:
```
### Features Implemented
### Files Created or Modified
### Database Changes (Flyway migrations)
### Commands Executed
### Tests Run and Results
### Known Failures or Limitations
### Next Phase Preview
```

---

## Phase 0 ✅ — Repository Inspection and Requirements Lock

**Status:** Complete  
**Output:** `docs/phase-0-requirements-lock.md`

- Inspected workspace: empty greenfield project
- Identified runtime environment: Java 21, Maven 3.9.9 (wrapper), Node 24, Python 3.11, MySQL 8.0
- Identified MySQL service is installed but not confirmed running
- Produced requirements lock document

---

## Phase 1 ✅ — Architecture Planning

**Status:** In Progress → Awaiting Approval  
**Output:** All files in `docs/`

Deliverables:
- [x] `docs/REQUIREMENTS.md`
- [x] `docs/ARCHITECTURE.md`
- [x] `docs/ER_DIAGRAM.md`
- [x] `docs/API_SPECIFICATION.md`
- [x] `docs/COMPONENT_MAP.md`
- [x] `docs/SECURITY.md`
- [x] `docs/IMPLEMENTATION_PLAN.md`
- [x] `docs/ENVIRONMENT_SETUP.md`

---

## Phase 2 — Project Foundation and Development Environment

**Objective:** Create the complete project scaffolding. All three sub-projects must start up successfully.

### 2.1 Git Repository
- `git init`
- Create `.gitignore` covering: `node_modules/`, `target/`, `.venv/`, `*.class`, `application-dev.yml`, `.env`, `*.log`, `uploads/`
- Initial commit: "chore: Phase 2 — project foundation"

### 2.2 MySQL Setup (First Priority)
1. Verify MySQL Server service status
2. If not running, provide exact PowerShell commands to start it
3. Using MySQL CLI: create database `talentiq` and user `talentiq_user` with minimum required grants
4. Test connection; document the `my.ini` port (confirmed: 3306)
5. Store credentials in `application-dev.yml` (gitignored)

### 2.3 Spring Boot Scaffold
- Generate via Spring Initializr (offline using Maven archetype or manual `pom.xml`)
- Dependencies: Spring Web, Spring Security, Spring Data JPA, MySQL Driver, Flyway, Validation, JJWT, Bucket4j, Spring Boot Actuator, Lombok
- Configure `application.yml` and `application-dev.yml`
- Flyway migration V1: create `users`, `roles`, `user_roles` tables
- Application starts, Flyway runs, Actuator `/health` returns 200
- **Test:** `mvnw test -pl talentiq-backend` (Spring Boot startup test)

### 2.4 FastAPI Scaffold
- Create `talentiq-ai/` with `requirements.txt`
- Create Python virtual environment: `python -m venv .venv`
- Install packages (sandboxed pip install into venv)
- Create `main.py` with health check endpoint `GET /health`
- Create `app/middleware/api_key_auth.py`
- **Test:** `pytest talentiq-ai/` (startup and health endpoint)
- **Note:** spaCy model and sentence-transformers download required; document commands

### 2.5 React Frontend Scaffold
- `npm create vite@latest talentiq-frontend -- --template react-ts`
- Install: Tailwind CSS 4, React Router v7, Axios, Zustand, React Hook Form, Zod, Lucide React, React Query
- Configure Tailwind; set up base layout and routing stubs
- Vite dev server starts without error
- **Test:** `npm run build` succeeds (no TypeScript errors)

### 2.6 Verification Criteria (Phase 2 Complete when)
- [ ] Git repository initialized with clean initial commit
- [ ] MySQL `talentiq` database and `talentiq_user` created and tested
- [ ] Spring Boot starts, Flyway V1 migration runs, Actuator /health = UP
- [ ] FastAPI starts, `GET /health` returns 200
- [ ] React frontend builds without TypeScript errors
- [ ] All three services started simultaneously in development mode

---

## Phase 3 — Authentication, Roles, and User Profiles

**Objective:** Complete, working authentication system for all three roles.

### 3.1 Backend
- Flyway V2: `candidate_profiles`, `candidate_skills`
- Flyway V3: `recruiter_profiles`, `companies`
- `User`, `CandidateProfile`, `RecruiterProfile`, `Company` entities
- `UserDetailsServiceImpl` loading users from DB
- `JwtUtil` (generate, validate, extract claims)
- `JwtAuthFilter` (intercept requests, populate SecurityContext)
- `SecurityConfig` (permit `/auth/**`, protect all others)
- `AuthController`: register, login, refresh, logout, change-password
- `CandidateController`: GET/PUT `/candidates/me`
- `RecruiterController`: GET/PUT `/recruiter/me`, GET/POST/PUT `/recruiter/company`
- Admin seed: on startup, create admin user from `ADMIN_EMAIL` / `ADMIN_PASSWORD` env vars if absent
- Rate limiting on `/auth/login` and `/auth/register`

### 3.2 Frontend
- `LoginPage` with email/password form, validation, error handling
- `RegisterPage` with role selection (CANDIDATE or RECRUITER)
- `CandidateProfilePage` with editable profile form
- `RecruiterProfilePage` with company form
- `RoleGuard` component
- Axios interceptor for JWT injection and refresh
- Zustand auth store

### 3.3 Tests
- JUnit: `AuthServiceTest` (register, login, duplicate email, invalid password)
- JUnit: `JwtUtilTest` (generate, validate, expired token)
- JUnit: `SecurityConfigTest` (unauthorized access returns 401, admin-only returns 403)
- Mockito: service layer tests with mocked repositories
- Manual: register candidate, register recruiter, login both, confirm role guards work

---

## Phase 4 — Jobs, Companies, Applications, and Recruiter Workflows

**Objective:** Full recruitment pipeline functional.

### 4.1 Backend
- Flyway V4: `jobs`, `job_requirements`, `job_skills`
- Flyway V6: `applications`, `application_status_history`
- `JobController` (public browse, detail, search, filter, paginate)
- `JobManagementController` (CRUD for recruiters, publish/close)
- `ApplicationController` (submit, withdraw, history, status update)
- `NotificationService` + Flyway V10: `notifications` table
- Recruiter analytics endpoint
- Ownership enforcement for all recruiter operations
- Flyway V12: `recruiter_notes`, `shortlists`
- Recruiter notes and shortlist endpoints

### 4.2 Frontend
- `JobSearchPage` with filters, pagination, `JobCard` components
- `JobDetailPage` (public) with apply button (candidates only)
- `JobCreatePage` and `JobEditPage` for recruiters
- `JobListPage` (recruiter's own jobs)
- `ApplicantListPage` with filters and status update
- `ApplicantDetailPage` (candidate profile, resume reference, notes)
- `ApplicationHistoryPage` for candidates
- `ApplicationStatusTimeline` component
- `RecruiterDashboardPage` with stats
- `NotificationPanel` with unread count

### 4.3 Tests
- JUnit: `JobServiceTest` (create, publish, close, ownership check)
- JUnit: `ApplicationServiceTest` (submit, duplicate rejection, withdrawal)
- JUnit: `RecruiterOwnershipTest` (recruiter cannot access other recruiter's jobs)
- Manual: full recruit → apply → status update → notification flow

---

## Phase 5 — Resume Upload, Parsing, and ATS Analysis

**Objective:** Resume intelligence pipeline functional end-to-end.

### 5.1 Backend
- `StorageService` interface + `LocalStorageServiceImpl`
- `ResumeController` (upload, list, download, delete, set-active, parsed data)
- `ResumeService` (orchestrate upload → store → trigger parse → poll)
- `AiOrchestrationService` (call FastAPI endpoints, handle failures)
- Flyway V5: resumes, `resume_versions`, `parsed_resume_data`
- Flyway V7 (partial): `ats_analyses`

### 5.2 FastAPI AI Service
- Install all AI packages in venv:
  ```
  fastapi uvicorn PyMuPDF python-docx spacy sentence-transformers
  google-generativeai pytest httpx python-multipart pydantic
  ```
- Download spaCy model: `python -m spacy download en_core_web_sm`
- Download sentence-transformers model: `all-MiniLM-L6-v2` (auto-downloaded on first use)
- `ResumeParserService`: PDF via PyMuPDF, DOCX via python-docx
- `NlpService`: spaCy NER + pattern matching for skills/education/experience
- `AtsService`: keyword matching + format scoring + LLM suggestions
- `parse.py` and `analyze.py` routers fully implemented
- Pydantic request/response models for all endpoints

### 5.3 Frontend
- `ResumeUploader` (drag-and-drop, file validation client-side, upload progress)
- `ResumeListPage` (versions, active toggle, delete)
- `ResumeDetailPage` (tabbed parsed view: contact/skills/education/experience/projects)
- `AtsAnalysisPage` (request analysis, poll until complete, `AtsScoreCard`, `AtsSuggestionList`)
- Resume improvement suggestions UI

### 5.4 Tests
- pytest: `test_resume_parser.py` (PDF parse, DOCX parse, malformed PDF)
- pytest: `test_ats_service.py` (score computation, missing keywords)
- JUnit: `ResumeServiceTest` (upload validation, size limit, MIME check, ownership)
- Manual: upload PDF, upload DOCX, view parsed data, request ATS analysis

---

## Phase 6 — Semantic Matching and Explainable Candidate Ranking

**Objective:** AI-powered candidate evaluation for recruiters.

### 6.1 FastAPI
- `EmbeddingService`: generate embeddings with `all-MiniLM-L6-v2`
- `MatchingService`: cosine similarity + composite score calculation
- `match.py` router: `/match/semantic` and `/match/rank`
- Configurable weights via environment variables

### 6.2 Backend
- Flyway V7 (complete): `matching_results`
- `MatchingService` (Spring Boot): trigger FastAPI match, persist results
- `MatchingController`: request match, rank, get results
- Anonymization applied in `RecruiterController` responses

### 6.3 Frontend
- `MatchScoreCard` + `MatchExplanationPanel`
- `CandidateRankingTable` (sorted by composite score with explanation toggle)
- Anonymized candidate display option in recruiter views

### 6.4 Tests
- pytest: `test_embedding_service.py` (embedding shape, cosine similarity range)
- pytest: `test_matching_service.py` (composite score calculation, weight validation)
- JUnit: `MatchingServiceTest` (FastAPI call mocked, result persistence)
- Manual: rank applicants for a job, verify explanation displayed

---

## Phase 7 — Career Guidance and Job Recommendations

**Objective:** Candidate self-improvement and discovery features.

### 7.1 FastAPI
- `CareerService`: skill gap computation + LLM learning path generation
- `career.py` router: `/career/gap-analysis`
- `resume.py` router: `/resume/improve` and `/resume/anonymize`
- Gemini integration: first use in this phase (requires `GEMINI_API_KEY`)

### 7.2 Backend
- Flyway V8: `skill_gaps`, `career_recommendations`
- `CareerService` (Spring Boot): gap analysis orchestration, persist results
- `CareerController`: gap analysis, improvement suggestions
- Semantic job recommendation: compute similarity between active resume and published jobs

### 7.3 Frontend
- `CareerGuidancePage` (target role input, skill gap display, learning resources)
- `SkillGapChart` and `LearningResourceList`
- Job recommendations on `CandidateDashboardPage` and `JobSearchPage`

### 7.4 Tests
- pytest: `test_career_service.py` (skill gap computation, LLM mocked)
- JUnit: `CareerServiceTest` (gap analysis persistence)
- Manual: run gap analysis for a target role, view resources

---

## Phase 8 — AI Mock Interviews

**Objective:** Interactive interview preparation with AI feedback.

### 8.1 FastAPI
- `InterviewService`: question generation + answer feedback using Gemini
- `interview.py` router: `/interview/generate` and `/interview/feedback`
- Question categories: BEHAVIORAL, TECHNICAL, SITUATIONAL
- Structured feedback: score, strengths, improvements, model hint

### 8.2 Backend
- Flyway V9: `interview_sessions`, `interview_questions`, `interview_answers`
- `InterviewService` (Spring Boot): session management, question sequencing, feedback persistence
- `InterviewController`: all session endpoints

### 8.3 Frontend
- `InterviewListPage` (past sessions, start new)
- `InterviewSessionPage` (question card, answer textarea, submit, feedback display)
- `InterviewFeedbackCard` (score ring, strengths, improvements)
- Session summary after completion

### 8.4 Tests
- pytest: `test_interview_service.py` (question generation, feedback scoring, LLM mocked)
- JUnit: `InterviewServiceTest` (session creation, answer submission, completion)
- Manual: complete a 3-question mock interview, verify feedback quality

---

## Phase 9 — Admin Portal and Analytics

**Objective:** Full administrative control panel.

### 9.1 Backend
- Flyway V11: `audit_events`, `platform_settings`
- `AdminController` + `AdminService`: all admin endpoints
- Audit logging: interceptor/AOP logs important actions to `audit_events`
- Platform analytics queries (user counts, job metrics, application stats)
- Platform settings management

### 9.2 Frontend
- `AdminDashboardPage` with platform-level KPI cards
- `UserManagementPage` (search, filter, suspend, reactivate)
- `UserDetailPage` (full user record, applications, audit trail)
- `CompanyManagementPage` (verify, manage)
- `JobModerationPage` (review published jobs, force-remove)
- `PlatformAnalyticsPage` (charts and tables)
- `AuditLogPage` (paginated audit events)
- `PlatformSettingsPage` (key-value setting editor)

### 9.3 Tests
- JUnit: `AdminServiceTest` (suspend, reactivate, audit log creation)
- JUnit: `AdminAuthorizationTest` (non-admin cannot access admin endpoints)
- Manual: suspend a user, verify login fails, reactivate, verify login succeeds

---

## Phase 10 — Integration, Security, Testing, and Optimization

**Objective:** Production-readiness, security hardening, and test completeness.

### 10.1 Integration Tests
- Spring Boot integration tests using `@SpringBootTest` + H2 (test profile)
- Full HTTP round-trips: register → login → upload resume → apply → rank → interview
- Role boundary tests: candidate cannot access recruiter endpoints and vice versa
- AI service failure handling: mock FastAPI down → Spring Boot returns graceful response

### 10.2 Security Hardening
- Confirm rate limiting working on all auth endpoints
- Test file upload with: oversized file, wrong MIME type, path traversal filename
- Test JWT tampering: modified token, expired token, wrong signature
- Test admin-only endpoints with candidate and recruiter tokens
- Test recruiter ownership: cannot access other recruiter's applicants

### 10.3 Performance Checks
- Measure response times for: job search (< 300ms), ATS analysis (async), match score retrieval
- Database index review: confirm all join-heavy queries use indexed columns
- N+1 query check with Hibernate SQL logging in test profile

### 10.4 Code Quality
- Remove all TODO/FIXME items or document them
- Ensure all endpoints have validation annotations
- Confirm no hardcoded secrets anywhere in codebase

### 10.5 pytest Coverage
- Full pytest suite for FastAPI: parse, analyze, match, career, interview endpoints
- Mock Gemini responses (no real API calls in tests)
- Edge cases: empty resume, job with no requirements, single-candidate ranking

---

## Phase 11 — Deployment Preparation and Documentation

**Objective:** Production-ready packaging and complete documentation.

### 11.1 Build Artifacts
- Spring Boot: `mvnw package -DskipTests` → `talentiq-backend/target/talentiq-backend-*.jar`
- FastAPI: `requirements.txt` + `uvicorn main:app --host 0.0.0.0 --port 8000` startup command
- Frontend: `npm run build` → `dist/` static files (serve via Spring Boot or Nginx)

### 11.2 Environment Documentation
- Final `ENVIRONMENT_SETUP.md` update with all required variables
- Docker Compose file (optional, for local convenience)
- Nginx configuration example for reverse proxy + TLS

### 11.3 README
- Project overview
- Prerequisites
- Development startup instructions for all three services
- Running tests
- Building for production
- Environment variable reference

### 11.4 Production Checklist
- [ ] All secrets in environment variables, not in code
- [ ] `DEBUG` mode disabled
- [ ] CORS restricted to production domain
- [ ] File storage switched to cloud (S3/GCS) or confirmed local with persistent volume
- [ ] HTTPS enforced
- [ ] Database backups configured
- [ ] Audit logging confirmed active

---

## Testing Strategy Summary

| Test Type | Tool | Coverage Target |
|-----------|------|----------------|
| Spring Boot unit | JUnit 5 + Mockito | Service layer + JWT + security |
| Spring Boot integration | Spring Boot Test + H2 | Full API round trips |
| FastAPI unit | pytest | All service functions |
| FastAPI integration | pytest + httpx | All router endpoints |
| Frontend component | Vitest + Testing Library | Key UI components |
| Frontend E2E | Playwright | Register → apply flow |
| Security | Manual + integration | Auth bypass, file validation, ownership |

Tests that have not been run are documented as "UNVERIFIED" — never reported as passing.

---

## Dependency and Credential Gating

| Phase | Blocked Until |
|-------|--------------|
| Phase 2 | MySQL credentials provided and service started |
| Phase 5 (AI parts) | Python venv + AI packages installed |
| Phase 7+ (LLM) | `GEMINI_API_KEY` provided |
| Phase 11 | All phases 2–10 complete and verified |

---

*This plan is the authoritative implementation sequence. Phases may not be reordered or merged without explicit approval.*
