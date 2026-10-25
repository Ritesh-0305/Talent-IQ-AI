# TalentIQ AI — Entity Relationship Diagram

**Version:** 1.0  
**Phase:** 1 — Architecture Planning  
**Date:** 2026-10-24

---

## 1. Complete Entity Relationship Diagram

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                         IDENTITY & AUTH                                          │
├────────────────┐   ┌──────────────────┐   ┌──────────────────────────────────── │
│    users       │   │      roles       │   │           user_roles                 │
├────────────────┤   ├──────────────────┤   ├──────────────────────────────────── │
│ PK id (BIGINT) │   │ PK id (INT)      │   │ PK user_id (FK → users.id)          │
│    email (UQ)  │   │    name ENUM     │   │ PK role_id (FK → roles.id)          │
│    password_hash│  │    (CANDIDATE    │   └──────────────────────────────────── │
│    is_active   │   │     RECRUITER    │                                          │
│    is_deleted  │   │     ADMIN)       │                                          │
│    created_at  │   └──────────────────┘                                          │
│    updated_at  │                                                                  │
│    last_login  │                                                                  │
└────────┬───────┘                                                                  │
         │ 1                                                                        │
         ├──────────────────────────────────┐                                      │
         │ 1                                │ 1                                    │
         ▼                                  ▼                                      │
┌────────────────────────┐    ┌─────────────────────────────┐                     │
│   candidate_profiles   │    │     recruiter_profiles       │                     │
├────────────────────────┤    ├─────────────────────────────┤                     │
│ PK id                  │    │ PK id                        │                     │
│ FK user_id (UQ)        │    │ FK user_id (UQ)              │                     │
│    first_name          │    │    first_name                │                     │
│    last_name           │    │    last_name                 │                     │
│    headline            │    │    title                     │                     │
│    bio                 │    │ FK company_id                │                     │
│    location            │    │    verified_at               │                     │
│    phone               │    │    created_at                │                     │
│    linkedin_url        │    │    updated_at                │                     │
│    github_url          │    └──────────┬──────────────────┘                     │
│    portfolio_url       │               │ N                                       │
│    years_experience    │               ▼                                         │
│    profile_photo_url   │    ┌─────────────────────────────┐                     │
│    created_at          │    │         companies            │                     │
│    updated_at          │    ├─────────────────────────────┤                     │
└──────────┬─────────────┘    │ PK id                        │                     │
           │ 1                │    name (UQ)                 │                     │
           ▼                  │    description               │                     │
┌──────────────────────┐      │    website                   │                     │
│  candidate_skills    │      │    industry                  │                     │
├──────────────────────┤      │    size_range                │                     │
│ PK id                │      │    logo_url                  │                     │
│ FK candidate_id      │      │    is_verified               │                     │
│    skill_name        │      │    created_at                │                     │
│    proficiency_level │      └──────────┬──────────────────┘                     │
│    years_used        │                 │ 1                                       │
└──────────────────────┘                 ▼                                         │
                                ┌────────────────────────────┐                    │
                                │           jobs              │                    │
                                ├────────────────────────────┤                    │
                                │ PK id                       │                    │
                                │ FK company_id               │                    │
                                │ FK posted_by (recruiter_id) │                    │
                                │    title                    │                    │
                                │    description (TEXT)       │                    │
                                │    location                 │                    │
                                │    job_type ENUM            │                    │
                                │    (FULL_TIME/PART_TIME     │                    │
                                │     CONTRACT/INTERNSHIP)    │                    │
                                │    salary_min               │                    │
                                │    salary_max               │                    │
                                │    salary_currency          │                    │
                                │    status ENUM              │                    │
                                │    (DRAFT/PUBLISHED/CLOSED) │                    │
                                │    is_remote                │                    │
                                │    published_at             │                    │
                                │    closed_at                │                    │
                                │    expires_at               │                    │
                                │    created_at               │                    │
                                │    updated_at               │                    │
                                └──────────┬─────────────────┘                    │
                                           │ 1                                     │
                              ┌────────────┴──────────────┐                       │
                              │ N                         │ N                     │
                              ▼                           ▼                       │
                    ┌──────────────────┐    ┌──────────────────────────┐         │
                    │  job_requirements│    │       job_skills          │         │
                    ├──────────────────┤    ├──────────────────────────┤         │
                    │ PK id            │    │ PK id                    │         │
                    │ FK job_id        │    │ FK job_id                │         │
                    │    requirement   │    │    skill_name            │         │
                    │    is_required   │    │    is_required           │         │
                    └──────────────────┘    └──────────────────────────┘         │
```

---

## 2. Resume and Parsing Entities

```
┌────────────────────────┐
│       resumes          │
├────────────────────────┤
│ PK id                  │
│ FK candidate_id        │
│    active_version_id   │ ─ ─ ─ ─ ─ ─ ┐ (deferred FK or nullable)
│    created_at          │              │
│    is_deleted          │              │
└──────────┬─────────────┘              │
           │ 1                          │
           ▼                            │
┌──────────────────────────────┐        │
│       resume_versions        │◄───────┘
├──────────────────────────────┤
│ PK id                        │
│ FK resume_id                 │
│    version_number            │
│    label (e.g., "v1", "Q4")  │
│    storage_path              │ ← filesystem path, not file content
│    original_filename         │
│    file_size_bytes           │
│    mime_type                 │
│    is_active                 │
│    upload_timestamp          │
│    parsed_at                 │
└──────────────────────────────┘
           │ 1
           ▼
┌──────────────────────────────┐
│     parsed_resume_data       │
├──────────────────────────────┤
│ PK id                        │
│ FK resume_version_id (UQ)    │
│    raw_text (TEXT)           │
│    contact_json (JSON)       │
│    skills_json (JSON)        │
│    education_json (JSON)     │
│    experience_json (JSON)    │
│    projects_json (JSON)      │
│    certifications_json (JSON)│
│    summary_text              │
│    parse_status ENUM         │
│    parsed_at                 │
└──────────────────────────────┘
```

---

## 3. Applications and Status History

```
┌───────────────────────────────────────────────────────┐
│                    applications                        │
├───────────────────────────────────────────────────────┤
│ PK id                                                  │
│ FK candidate_id  (→ candidate_profiles.id)             │
│ FK job_id        (→ jobs.id)                           │
│ FK resume_version_id (→ resume_versions.id)            │
│    cover_letter_text (TEXT, nullable)                  │
│    status ENUM                                         │
│    (SUBMITTED/REVIEWED/SHORTLISTED/INTERVIEWING/       │
│     OFFERED/REJECTED/WITHDRAWN)                        │
│    applied_at                                          │
│    updated_at                                          │
│ UQ (candidate_id, job_id)  ← one application per job  │
└──────────────────────────────┬────────────────────────┘
                               │ 1
                               ▼
                ┌──────────────────────────────┐
                │  application_status_history   │
                ├──────────────────────────────┤
                │ PK id                         │
                │ FK application_id             │
                │    from_status                │
                │    to_status                  │
                │    changed_by (user_id)       │
                │    note                       │
                │    changed_at                 │
                └──────────────────────────────┘
```

---

## 4. AI Analysis Entities

```
┌─────────────────────────────────────────────────┐
│                 ats_analyses                     │
├─────────────────────────────────────────────────┤
│ PK id                                            │
│ FK resume_version_id                             │
│ FK job_id (nullable — general analysis if null)  │
│    overall_score (DECIMAL 5,2)                   │
│    keyword_score (DECIMAL 5,2)                   │
│    format_score  (DECIMAL 5,2)                   │
│    completeness_score (DECIMAL 5,2)              │
│    relevance_score (DECIMAL 5,2)                 │
│    missing_keywords_json (JSON)                  │
│    suggestions_json (JSON)                       │
│    analysis_status ENUM (PENDING/PROCESSING/     │
│                          COMPLETED/FAILED)        │
│    requested_by (user_id)                        │
│    created_at                                    │
│    completed_at                                  │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│               matching_results                   │
├─────────────────────────────────────────────────┤
│ PK id                                            │
│ FK application_id                                │
│    semantic_score (DECIMAL 5,2)                  │
│    keyword_overlap_score (DECIMAL 5,2)           │
│    ats_normalized_score (DECIMAL 5,2)            │
│    composite_score (DECIMAL 5,2)                 │
│    matched_skills_json (JSON)                    │
│    missing_skills_json (JSON)                    │
│    matched_requirements_json (JSON)              │
│    missing_requirements_json (JSON)              │
│    evidence_snippets_json (JSON)                 │
│    scoring_weights_json (JSON)   ← weights used  │
│    analysis_status ENUM                          │
│    created_at                                    │
│    completed_at                                  │
└─────────────────────────────────────────────────┘
```

---

## 5. Career and Interview Entities

```
┌──────────────────────────────────────┐
│           skill_gaps                 │
├──────────────────────────────────────┤
│ PK id                                │
│ FK candidate_id                      │
│    target_role                       │
│ FK target_job_id (nullable)          │
│    current_skills_json (JSON)        │
│    missing_skills_json (JSON)        │
│    gap_severity ENUM (LOW/MED/HIGH)  │
│    created_at                        │
└───────────────┬──────────────────────┘
                │ 1
                ▼
┌──────────────────────────────────────┐
│        career_recommendations        │
├──────────────────────────────────────┤
│ PK id                                │
│ FK skill_gap_id                      │
│    skill_name                        │
│    recommendation_text (TEXT)        │
│    resources_json (JSON)             │
│    ← [{title, url, type, duration}]  │
│    order_index                       │
│    created_at                        │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│         interview_sessions           │
├──────────────────────────────────────┤
│ PK id                                │
│ FK candidate_id                      │
│    target_role                       │
│    difficulty ENUM (EASY/MED/HARD)   │
│    status ENUM (ACTIVE/COMPLETED)    │
│    overall_score (DECIMAL 5,2)       │
│    started_at                        │
│    completed_at                      │
└───────────────┬──────────────────────┘
                │ 1
                ▼
┌──────────────────────────────────────┐
│        interview_questions           │
├──────────────────────────────────────┤
│ PK id                                │
│ FK session_id                        │
│    question_text (TEXT)              │
│    category ENUM (BEHAVIORAL/        │
│                   TECHNICAL/         │
│                   SITUATIONAL)       │
│    expected_keywords_json (JSON)     │
│    order_index                       │
└───────────────┬──────────────────────┘
                │ 1
                ▼
┌──────────────────────────────────────┐
│         interview_answers            │
├──────────────────────────────────────┤
│ PK id                                │
│ FK question_id (UQ)                  │
│    answer_text (TEXT)                │
│    score (DECIMAL 3,1)               │
│    strengths_json (JSON)             │
│    improvements_json (JSON)          │
│    model_answer_hint (TEXT)          │
│    feedback_status ENUM              │
│    answered_at                       │
│    feedback_at                       │
└──────────────────────────────────────┘
```

---

## 6. Notifications, Audit, and Recruiter Tools

```
┌──────────────────────────────────────┐
│           notifications              │
├──────────────────────────────────────┤
│ PK id                                │
│ FK recipient_id (→ users.id)         │
│    type ENUM                         │
│    (APPLICATION_RECEIVED/            │
│     STATUS_CHANGED/MATCH_READY/etc.) │
│    title                             │
│    message (TEXT)                    │
│    reference_type (e.g., "JOB")      │
│    reference_id                      │
│    is_read                           │
│    created_at                        │
│    read_at                           │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│           audit_events               │
├──────────────────────────────────────┤
│ PK id                                │
│ FK actor_id (→ users.id)             │
│    action ENUM                       │
│    (USER_SUSPENDED/JOB_REMOVED/etc.) │
│    target_type                       │
│    target_id                         │
│    metadata_json (JSON)              │
│    ip_address                        │
│    created_at                        │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│         recruiter_notes              │
├──────────────────────────────────────┤
│ PK id                                │
│ FK application_id                    │
│ FK recruiter_id                      │
│    note_text (TEXT)                  │
│    created_at                        │
│    updated_at                        │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│           shortlists                 │
├──────────────────────────────────────┤
│ PK id                                │
│ FK job_id                            │
│ FK application_id                    │
│ FK added_by (recruiter_id)           │
│    added_at                          │
│ UQ (job_id, application_id)          │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│         platform_settings            │
├──────────────────────────────────────┤
│ PK id                                │
│    setting_key (UQ)                  │
│    setting_value                     │
│    data_type ENUM (STRING/INT/BOOL)  │
│    description                       │
│    updated_by (user_id)              │
│    updated_at                        │
└──────────────────────────────────────┘
```

---

## 7. Key Constraints Summary

| Table | Key Constraints |
|-------|----------------|
| `users` | UNIQUE(email); index on email, is_active |
| `candidate_profiles` | UNIQUE(user_id) |
| `recruiter_profiles` | UNIQUE(user_id) |
| `companies` | UNIQUE(name) |
| `jobs` | index on (company_id, status), (status, created_at) |
| `applications` | UNIQUE(candidate_id, job_id); index on (job_id, status) |
| `resume_versions` | index on (resume_id, is_active) |
| `parsed_resume_data` | UNIQUE(resume_version_id) |
| `matching_results` | UNIQUE(application_id) |
| `interview_answers` | UNIQUE(question_id) |
| `shortlists` | UNIQUE(job_id, application_id) |
| `platform_settings` | UNIQUE(setting_key) |

---

## 8. Soft Delete Strategy

Entities supporting soft delete (set `is_deleted = true` rather than `DELETE`):

- `users` — preserve audit trail; `is_deleted = true` prevents login
- `resumes` — preserve application history references
- `jobs` — preserve application history references

Hard delete is used for:
- `notifications` — cleared explicitly by user
- `recruiter_notes` — deleted by recruiter
- `career_recommendations` — regenerated on demand

---

*All tables will be created via Flyway SQL migration scripts. No manual table creation.*
