# TalentIQ AI — Requirements Specification

**Version:** 1.0  
**Phase:** 1 — Architecture Planning  
**Date:** 2026-10-24  
**Status:** Confirmed — Awaiting Phase 2 Implementation Approval

---

## 1. Product Overview

**Product Name:** TalentIQ AI  
**Full Title:** TalentIQ AI: An Intelligent Hiring and Career Guidance System Using Artificial Intelligence  
**Category:** AI-powered recruitment, resume intelligence, job discovery, and career guidance platform

### 1.1 Objective

Create a unified platform that:
- Helps **candidates** discover jobs, improve resumes, understand skill gaps, prepare for interviews, and develop careers.
- Enables **recruiters** to publish jobs, manage applications, evaluate candidates, understand rankings, and manage hiring pipelines.
- Allows **administrators** to manage users, moderate content, monitor system activity, and view analytics.

---

## 2. User Roles

| Role | Description | Access Scope |
|------|-------------|-------------|
| `CANDIDATE` | Job seekers using the platform | Own profile, public jobs, own applications |
| `RECRUITER` | Hiring professionals and HR teams | Own company, own jobs, applicants to own jobs |
| `ADMIN` | Platform administrators | All users, all content, platform config |

> **Authorization is enforced at the backend.** Frontend route protection is supplementary only.

---

## 3. Candidate Feature Requirements

### 3.1 Authentication and Profile
- REQ-C-001: Register with email and password
- REQ-C-002: Login with JWT token response
- REQ-C-003: View and edit candidate profile (name, title, bio, location, skills, social links)
- REQ-C-004: Upload profile photo (optional)
- REQ-C-005: Change password and manage account settings
- REQ-C-006: Delete account with data removal workflow

### 3.2 Resume Management
- REQ-C-010: Upload resume (PDF or DOCX, max 10 MB)
- REQ-C-011: System parses and extracts structured data from uploaded resume
- REQ-C-012: Manage multiple resume versions (upload, label, set-active, delete)
- REQ-C-013: View parsed resume breakdown by section
- REQ-C-014: Request resume anonymization (PII stripped for recruiter review)
- REQ-C-015: Download own resume files

### 3.3 ATS Analysis
- REQ-C-020: Request ATS analysis for active resume against a job description or general criteria
- REQ-C-021: View overall ATS score (0–100) with section-level breakdown
- REQ-C-022: View keyword-match, format, completeness, and relevance sub-scores
- REQ-C-023: View actionable improvement suggestions per section
- REQ-C-024: Request AI-powered resume improvement suggestions for a target job

### 3.4 Job Discovery
- REQ-C-030: Browse published jobs with search and filtering (title, location, skills, job type, salary)
- REQ-C-031: View paginated job listing results
- REQ-C-032: View full job detail page
- REQ-C-033: Receive AI-powered semantic job recommendations based on resume content
- REQ-C-034: Save/bookmark jobs for later review

### 3.5 Applications
- REQ-C-040: Submit application for a job (attach active resume version, optional cover letter)
- REQ-C-041: View own application history with statuses
- REQ-C-042: Track application status in real time (SUBMITTED → REVIEWED → SHORTLISTED → INTERVIEWING → OFFERED → REJECTED → WITHDRAWN)
- REQ-C-043: Withdraw a pending application
- REQ-C-044: Receive notification on application status changes

### 3.6 Career Guidance
- REQ-C-050: Select a target job or career goal for skill-gap analysis
- REQ-C-051: View identified skill gaps relative to target role
- REQ-C-052: View recommended learning paths with specific resources (title, URL, type, duration)
- REQ-C-053: View personalized career development step recommendations

### 3.7 Mock Interviews
- REQ-C-060: Start a mock interview session for a selected role
- REQ-C-061: View AI-generated role-specific interview questions one at a time
- REQ-C-062: Submit text answers to interview questions
- REQ-C-063: Receive structured feedback per answer (score, strengths, improvements, model hint)
- REQ-C-064: View session summary after completing all questions
- REQ-C-065: Review past interview session history

### 3.8 Notifications and Privacy
- REQ-C-070: Receive in-app notifications for relevant events
- REQ-C-071: Mark notifications as read; clear all
- REQ-C-072: Configure privacy preferences (resume visibility, data consent)
- REQ-C-073: Request account and data deletion

---

## 4. Recruiter Feature Requirements

### 4.1 Authentication and Profile
- REQ-R-001: Register as recruiter with email and password
- REQ-R-002: Login with JWT token response
- REQ-R-003: Manage recruiter profile (name, title, company association)

### 4.2 Company Management
- REQ-R-010: Create and manage company profile (name, description, website, industry, size, logo)
- REQ-R-011: View company verification status
- REQ-R-012: Multiple recruiters may be associated with one company (future)

### 4.3 Job Management
- REQ-R-020: Create a new job posting (title, description, requirements, skills, type, location, salary range)
- REQ-R-021: Edit an existing draft or published job
- REQ-R-022: Publish a job (makes it visible to candidates)
- REQ-R-023: Close a job (stops accepting applications)
- REQ-R-024: Delete a draft job
- REQ-R-025: View all jobs belonging to own company

### 4.4 Applicant Management
- REQ-R-030: View all applications for own jobs
- REQ-R-031: Filter and sort applicants (by score, status, date, skills)
- REQ-R-032: View candidate profile and resume (anonymized view available)
- REQ-R-033: View resume-to-job semantic match score with explanation
- REQ-R-034: View explainable AI-generated candidate ranking for a job
- REQ-R-035: Update application status (REVIEWED, SHORTLISTED, INTERVIEWING, OFFERED, REJECTED)
- REQ-R-036: Add private recruiter notes to an application (not visible to candidate)
- REQ-R-037: Add candidate to shortlist
- REQ-R-038: Remove candidate from shortlist
- REQ-R-039: View candidate insights (AI-generated summary of candidate strengths and gaps)

### 4.5 Interview and Pipeline
- REQ-R-040: Track interview stages per application
- REQ-R-041: View application pipeline analytics per job

### 4.6 Analytics and Exports
- REQ-R-050: View recruiter dashboard analytics (total jobs, total applications, status breakdown)
- REQ-R-051: View per-job application funnel
- REQ-R-052: Export authorized applicant report (CSV)

### 4.7 Notifications
- REQ-R-060: Receive notification when a candidate applies to own job
- REQ-R-061: View and manage recruiter notifications

---

## 5. Admin Feature Requirements

- REQ-A-001: Secure admin login (admin accounts provisioned through environment-variable seeding only — no public registration)
- REQ-A-002: List, search, view, suspend, and reactivate user accounts (candidates and recruiters)
- REQ-A-003: View and manage company profiles
- REQ-A-004: Review and moderate job postings (approve, reject, remove)
- REQ-A-005: View platform-level analytics (user counts, job counts, application counts, AI usage)
- REQ-A-006: View audit log of important administrative and system events
- REQ-A-007: Generate reports (user activity, job metrics, application statistics)
- REQ-A-008: Configure platform settings (max resume file size, allowed file types, feature flags)
- REQ-A-009: View system health indicators (service status, error rates)

---

## 6. AI and Resume Intelligence Requirements

### 6.1 Resume Parsing
- REQ-AI-001: Accept PDF (via PyMuPDF) and DOCX (via python-docx) formats
- REQ-AI-002: Extract: contact details, skills, education, work experience, projects, certifications, summary
- REQ-AI-003: Return structured JSON suitable for database storage
- REQ-AI-004: Handle malformed or image-based PDFs gracefully with partial extraction

### 6.2 ATS Analysis
- REQ-AI-010: Score resume against a job description on a 0–100 scale
- REQ-AI-011: Provide section-level sub-scores: keyword match, format quality, completeness, relevance
- REQ-AI-012: Identify missing keywords from job description
- REQ-AI-013: Generate improvement suggestions grounded in resume content

### 6.3 Semantic Matching
- REQ-AI-020: Generate sentence embeddings using Sentence Transformers (`all-MiniLM-L6-v2`)
- REQ-AI-021: Compute cosine similarity between resume embedding and job description embedding
- REQ-AI-022: Composite score combines: semantic similarity, ATS keyword score, skills-overlap ratio
- REQ-AI-023: Composite scoring weights are configurable (environment/config, not hardcoded)
- REQ-AI-024: Provide explanation: matched requirements, missing requirements, supporting evidence

### 6.4 Resume Improvement
- REQ-AI-030: Provide actionable recommendations per resume section
- REQ-AI-031: Recommendations must reference actual resume content and target job

### 6.5 Career Guidance
- REQ-AI-040: Identify skill gaps given current skills and target role
- REQ-AI-041: Recommend learning resources (courses, documentation, certifications)
- REQ-AI-042: Provide step-by-step career development recommendations

### 6.6 Mock Interviews
- REQ-AI-050: Generate role-specific questions (behavioral, technical, situational) using Gemini
- REQ-AI-051: Accept candidate answer text
- REQ-AI-052: Return structured feedback: score (0–10), strengths, improvement areas, model answer hint

### 6.7 Anonymization
- REQ-AI-060: Strip: full name, email, phone, physical address, URLs containing name, photo references
- REQ-AI-061: Preserve: skills, education institutions, companies (without personal identifiers), work content
- REQ-AI-062: Anonymized view used only in recruiter evaluation context

### 6.8 Ethical Constraints (Non-Negotiable)
- REQ-AI-070: No protected characteristics used as ranking signals (name, gender, age, ethnicity, religion, photo)
- REQ-AI-071: AI outputs are advisory only — no automatic rejections or hiring decisions
- REQ-AI-072: Scores must not be described as "probability of job success"
- REQ-AI-073: Candidate ranking must be presented as decision support, not final judgment

---

## 7. Non-Functional Requirements

### 7.1 Security
- REQ-SEC-001: Passwords hashed using BCrypt
- REQ-SEC-002: JWT tokens signed with HS256; configurable expiry (default 24h access, 7d refresh)
- REQ-SEC-003: All endpoints enforce backend authorization (not frontend-only)
- REQ-SEC-004: Uploaded files validated for type (magic bytes + extension) and size (≤ 10 MB)
- REQ-SEC-005: Safe error responses (no stack traces in production)
- REQ-SEC-006: Rate limiting on authentication endpoints
- REQ-SEC-007: Internal AI service protected by shared API key (never exposed to browser)
- REQ-SEC-008: No secrets committed to Git

### 7.2 Performance
- REQ-PERF-001: API response time < 500 ms for non-AI endpoints under normal load
- REQ-PERF-002: AI analysis endpoints may take up to 30 seconds; async pattern with status polling used
- REQ-PERF-003: File uploads handled with streaming; no full-file buffering in memory

### 7.3 Data Integrity
- REQ-DATA-001: Schema managed via Flyway migrations — no manually created tables
- REQ-DATA-002: Foreign keys, unique constraints, and indexes defined explicitly
- REQ-DATA-003: Soft deletes for users and resumes where data retention is required
- REQ-DATA-004: Transactions used for multi-step write operations

### 7.4 Observability
- REQ-OBS-001: Structured logging in Spring Boot (JSON format in production)
- REQ-OBS-002: FastAPI request/response logging with request ID tracing
- REQ-OBS-003: Audit log for all admin actions and security-relevant events
- REQ-OBS-004: Logs must not contain passwords, full tokens, or resume file contents

---

## 8. Assumptions

| # | Assumption | Impact if Wrong |
|---|-----------|-----------------|
| A-001 | MySQL 8.0 is installed locally; service may need to be started manually | Phase 2 setup instructions required |
| A-002 | Gemini API key will be provided before Phase 5 | AI features unavailable until then |
| A-003 | Single-machine development; no load balancer needed | Trivial to add in Phase 11 |
| A-004 | Resume files stored on local filesystem during development | See ARCHITECTURE.md §5 for storage abstraction |
| A-005 | In-app notifications only (no SMTP/email) | Email channel can be added via Spring Mail in Phase 10+ |
| A-006 | Single company per recruiter during initial version | Multi-company support is a future enhancement |
| A-007 | English-language resumes and job descriptions only | spaCy model `en_core_web_sm` is English-only |

---

## 9. Future Enhancements (Out of Scope for Initial Build)

- Email/SMS notifications
- Video interview recording and AI analysis
- Multi-language resume support
- Cloud file storage (S3/GCS)
- Calendar integration for interview scheduling
- OAuth social login (Google, LinkedIn)
- Mobile application
- Multi-company recruiter accounts
- Bulk CSV candidate import
- Webhook integrations with external ATS

---

*Document status: Confirmed. No implementation decisions may be changed without explicit approval.*
