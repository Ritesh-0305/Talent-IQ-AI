# TalentIQ AI — API Specification

**Version:** 1.0  
**Phase:** 1 — Architecture Planning  
**Date:** 2026-10-24  
**Base URL:** `http://localhost:8080/api/v1`

---

## Conventions

- All requests and responses use `Content-Type: application/json` unless noted (file uploads use `multipart/form-data`).
- Authenticated endpoints require: `Authorization: Bearer <access_token>`
- Role annotations: `[PUBLIC]` `[CANDIDATE]` `[RECRUITER]` `[ADMIN]` `[ANY_AUTH]`
- HTTP status codes follow RFC 7231 semantics.
- Timestamps in ISO 8601 UTC format: `2026-10-24T16:00:00Z`
- Pagination: `?page=0&size=20&sort=createdAt,desc` (Spring Data default)

---

## 1. Authentication Endpoints

### POST /auth/register
`[PUBLIC]` Register a new user.

**Request:**
```json
{
  "email": "candidate@example.com",
  "password": "SecureP@ss1",
  "firstName": "Jane",
  "lastName": "Doe",
  "role": "CANDIDATE"
}
```
`role` must be `CANDIDATE` or `RECRUITER`. `ADMIN` cannot be registered through this endpoint.

**Response 201:**
```json
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "userId": 42,
  "email": "candidate@example.com",
  "role": "CANDIDATE",
  "expiresIn": 86400
}
```

**Errors:** 400 (validation), 409 (email already exists)

---

### POST /auth/login
`[PUBLIC]` Authenticate and receive tokens.

**Request:**
```json
{ "email": "candidate@example.com", "password": "SecureP@ss1" }
```

**Response 200:** Same as register response.

**Errors:** 401 (invalid credentials), 403 (account suspended)

---

### POST /auth/refresh
`[PUBLIC]` Refresh access token.

**Request:**
```json
{ "refreshToken": "eyJ..." }
```

**Response 200:**
```json
{ "accessToken": "eyJ...", "expiresIn": 86400 }
```

---

### POST /auth/logout
`[ANY_AUTH]` Invalidate refresh token.

**Request:**
```json
{ "refreshToken": "eyJ..." }
```

**Response 204**

---

### POST /auth/change-password
`[ANY_AUTH]` Change own password.

**Request:**
```json
{ "currentPassword": "OldP@ss1", "newPassword": "NewP@ss1" }
```

**Response 204**

---

## 2. Candidate Profile Endpoints

### GET /candidates/me
`[CANDIDATE]` Get own profile.

**Response 200:**
```json
{
  "id": 10,
  "userId": 42,
  "firstName": "Jane",
  "lastName": "Doe",
  "headline": "Senior Software Engineer",
  "bio": "...",
  "location": "Bengaluru, India",
  "phone": "+91-...",
  "linkedinUrl": "...",
  "githubUrl": "...",
  "portfolioUrl": "...",
  "yearsExperience": 5,
  "skills": [
    { "skillName": "Java", "proficiencyLevel": "EXPERT", "yearsUsed": 4 }
  ],
  "updatedAt": "2026-10-24T16:00:00Z"
}
```

---

### PUT /candidates/me
`[CANDIDATE]` Update own profile.

**Request:** Same structure as GET response (without id/userId/updatedAt).

**Response 200:** Updated profile.

---

## 3. Job Endpoints

### GET /jobs
`[PUBLIC]` List published jobs with filters.

**Query params:** `keyword`, `location`, `jobType`, `skills` (comma-separated), `salaryMin`, `salaryMax`, `isRemote`, `page`, `size`, `sort`

**Response 200:**
```json
{
  "content": [
    {
      "id": 1,
      "title": "Backend Engineer",
      "company": { "id": 5, "name": "Acme Corp", "logoUrl": "..." },
      "location": "Remote",
      "jobType": "FULL_TIME",
      "salaryMin": 1200000,
      "salaryMax": 1800000,
      "salaryCurrency": "INR",
      "isRemote": true,
      "requiredSkills": ["Java", "Spring Boot", "MySQL"],
      "publishedAt": "2026-10-20T10:00:00Z",
      "status": "PUBLISHED"
    }
  ],
  "totalElements": 142,
  "totalPages": 8,
  "page": 0,
  "size": 20
}
```

---

### GET /jobs/{id}
`[PUBLIC]` Get full job detail.

**Response 200:**
```json
{
  "id": 1,
  "title": "Backend Engineer",
  "description": "We are looking for...",
  "company": { "id": 5, "name": "Acme Corp", "website": "...", "industry": "Technology" },
  "location": "Remote",
  "jobType": "FULL_TIME",
  "salaryMin": 1200000,
  "salaryMax": 1800000,
  "salaryCurrency": "INR",
  "isRemote": true,
  "requirements": [
    { "requirement": "5+ years Java experience", "isRequired": true }
  ],
  "requiredSkills": ["Java", "Spring Boot", "MySQL"],
  "publishedAt": "2026-10-20T10:00:00Z",
  "expiresAt": "2026-11-20T10:00:00Z",
  "status": "PUBLISHED"
}
```

---

### POST /recruiter/jobs
`[RECRUITER]` Create a new job.

**Request:**
```json
{
  "title": "Backend Engineer",
  "description": "We are looking for...",
  "location": "Remote",
  "jobType": "FULL_TIME",
  "salaryMin": 1200000,
  "salaryMax": 1800000,
  "salaryCurrency": "INR",
  "isRemote": true,
  "requirements": [
    { "requirement": "5+ years Java experience", "isRequired": true }
  ],
  "requiredSkills": ["Java", "Spring Boot", "MySQL"],
  "expiresAt": "2026-11-20T10:00:00Z"
}
```

**Response 201:** Created job object.

---

### PUT /recruiter/jobs/{id}
`[RECRUITER]` Update own job (DRAFT or PUBLISHED status).

---

### PATCH /recruiter/jobs/{id}/publish
`[RECRUITER]` Publish a DRAFT job.

**Response 200:** Updated job.

---

### PATCH /recruiter/jobs/{id}/close
`[RECRUITER]` Close a PUBLISHED job.

---

### DELETE /recruiter/jobs/{id}
`[RECRUITER]` Delete a DRAFT job.

**Response 204**

---

### GET /recruiter/jobs
`[RECRUITER]` List own jobs.

---

## 4. Application Endpoints

### POST /applications
`[CANDIDATE]` Submit a job application.

**Request:**
```json
{
  "jobId": 1,
  "resumeVersionId": 7,
  "coverLetterText": "I am excited to apply..."
}
```

**Response 201:**
```json
{
  "id": 55,
  "jobId": 1,
  "jobTitle": "Backend Engineer",
  "companyName": "Acme Corp",
  "resumeVersionId": 7,
  "status": "SUBMITTED",
  "appliedAt": "2026-10-24T16:00:00Z"
}
```

**Errors:** 409 (already applied), 400 (job closed), 404 (job not found)

---

### GET /applications/me
`[CANDIDATE]` Get own application history.

**Response 200:** Paginated list of applications with status and job summary.

---

### PATCH /applications/{id}/withdraw
`[CANDIDATE]` Withdraw own application (status must be SUBMITTED or REVIEWED).

---

### GET /recruiter/jobs/{jobId}/applications
`[RECRUITER]` List all applications for a job.

**Query params:** `status`, `minScore`, `sort` (`score`, `date`), `page`, `size`

**Response 200:** Paginated list with candidate summary, match score, status.

---

### PATCH /recruiter/applications/{id}/status
`[RECRUITER]` Update application status.

**Request:**
```json
{ "status": "SHORTLISTED", "note": "Strong technical background" }
```

**Response 200:** Updated application.

---

### GET /recruiter/applications/{id}
`[RECRUITER]` Get full application detail including candidate profile, resume reference, match scores, recruiter notes.

---

## 5. Resume Endpoints

### POST /resumes/upload
`[CANDIDATE]` Upload a resume file.

**Request:** `multipart/form-data`
- `file`: PDF or DOCX, max 10 MB
- `label`: string (optional, e.g., "Q4 2026 Resume")

**Response 201:**
```json
{
  "resumeVersionId": 7,
  "versionNumber": 2,
  "label": "Q4 2026 Resume",
  "originalFilename": "jane_doe_resume.pdf",
  "fileSizeBytes": 245760,
  "mimeType": "application/pdf",
  "uploadTimestamp": "2026-10-24T16:00:00Z",
  "parseStatus": "PENDING"
}
```

---

### GET /resumes/me
`[CANDIDATE]` List own resume versions.

---

### GET /resumes/{versionId}/parsed
`[CANDIDATE]` Get parsed data for a resume version.

**Response 200:**
```json
{
  "resumeVersionId": 7,
  "parseStatus": "COMPLETED",
  "contact": { "name": "Jane Doe", "email": "jane@example.com", "phone": "..." },
  "skills": ["Java", "Spring Boot", "React"],
  "education": [{ "institution": "IIT Delhi", "degree": "B.Tech", "field": "CS", "year": 2020 }],
  "experience": [{ "company": "Acme", "title": "Engineer", "startDate": "2020-07", "endDate": null, "description": "..." }],
  "projects": [{ "name": "TalentIQ", "description": "..." }],
  "certifications": [{ "name": "AWS SAA", "issuer": "Amazon", "year": 2023 }],
  "summary": "Experienced engineer with..."
}
```

---

### PATCH /resumes/{versionId}/set-active
`[CANDIDATE]` Set a version as the active resume.

---

### DELETE /resumes/{versionId}
`[CANDIDATE]` Delete a resume version (soft delete if referenced by applications).

---

### GET /resumes/{versionId}/download
`[CANDIDATE]` Download own resume file.

**Response:** Binary file stream with appropriate Content-Disposition header.

---

## 6. ATS Analysis Endpoints

### POST /ats/analyze
`[CANDIDATE]` Request ATS analysis for a resume version.

**Request:**
```json
{
  "resumeVersionId": 7,
  "jobId": 1
}
```

**Response 202:** (Accepted — async processing)
```json
{ "analysisId": 99, "status": "PENDING" }
```

---

### GET /ats/analyses/{id}
`[CANDIDATE]` Poll or retrieve ATS analysis result.

**Response 200:**
```json
{
  "id": 99,
  "status": "COMPLETED",
  "overallScore": 74.5,
  "keywordScore": 68.0,
  "formatScore": 82.0,
  "completenessScore": 75.0,
  "relevanceScore": 73.0,
  "missingKeywords": ["Kubernetes", "Docker"],
  "suggestions": [
    {
      "section": "EXPERIENCE",
      "issue": "Quantified impact is missing from most bullet points",
      "recommendation": "Add metrics such as 'Reduced API latency by 40%'"
    }
  ],
  "completedAt": "2026-10-24T16:01:00Z"
}
```

---

### GET /ats/analyses/resume/{versionId}
`[CANDIDATE]` List all ATS analyses for a resume version.

---

## 7. Matching Endpoints

### POST /matching/analyze
`[RECRUITER]` Request semantic match analysis for an application.

**Request:**
```json
{ "applicationId": 55 }
```

**Response 202:** `{ "matchingId": 12, "status": "PENDING" }`

---

### GET /matching/{id}
`[RECRUITER]` Get matching result.

**Response 200:**
```json
{
  "id": 12,
  "applicationId": 55,
  "status": "COMPLETED",
  "semanticScore": 0.82,
  "keywordOverlapScore": 0.75,
  "atsNormalizedScore": 0.74,
  "compositeScore": 78.9,
  "scoringWeights": { "semantic": 0.5, "keyword": 0.3, "ats": 0.2 },
  "matchedSkills": ["Java", "Spring Boot", "MySQL"],
  "missingSkills": ["Kubernetes", "Docker"],
  "matchedRequirements": ["5+ years Java experience"],
  "missingRequirements": ["Cloud deployment experience"],
  "evidenceSnippets": [
    { "requirement": "Java experience", "evidence": "Led Java microservice development at Acme..." }
  ],
  "completedAt": "2026-10-24T16:01:30Z"
}
```

---

### POST /matching/rank-job/{jobId}
`[RECRUITER]` Rank all applicants for a job.

**Response 202:** `{ "jobId": 1, "status": "PENDING", "totalCandidates": 34 }`

---

### GET /matching/rankings/job/{jobId}
`[RECRUITER]` Get ranked applicant list for a job.

**Response 200:** List of `{ applicationId, candidateName (anonymized option), compositeScore, rank, matchingSummary }`

---

### GET /jobs/recommendations
`[CANDIDATE]` Get semantically recommended jobs based on active resume.

**Response 200:** List of jobs with `recommendationScore` and `matchReason`.

---

## 8. Resume Improvement Endpoints

### POST /resumes/{versionId}/improve
`[CANDIDATE]` Request AI resume improvement suggestions.

**Request:**
```json
{ "targetJobId": 1 }
```

**Response 202:** `{ "suggestionId": 77, "status": "PENDING" }`

---

### GET /resumes/improvements/{suggestionId}
`[CANDIDATE]` Retrieve improvement suggestions.

**Response 200:**
```json
{
  "id": 77,
  "status": "COMPLETED",
  "suggestions": [
    {
      "section": "SUMMARY",
      "issue": "Generic summary does not reference the target role",
      "recommendation": "Rewrite to highlight Java + Spring Boot experience for Backend Engineer roles"
    }
  ]
}
```

---

## 9. Career Guidance Endpoints

### POST /career/gap-analysis
`[CANDIDATE]` Start a skill-gap analysis.

**Request:**
```json
{
  "targetRole": "Cloud Solutions Architect",
  "targetJobId": null
}
```

**Response 202:** `{ "gapAnalysisId": 30, "status": "PENDING" }`

---

### GET /career/gap-analyses/{id}
`[CANDIDATE]` Get gap analysis result.

**Response 200:**
```json
{
  "id": 30,
  "status": "COMPLETED",
  "targetRole": "Cloud Solutions Architect",
  "missingSkills": ["AWS", "Terraform", "Kubernetes"],
  "recommendations": [
    {
      "skillName": "AWS",
      "recommendationText": "Start with AWS Cloud Practitioner certification...",
      "resources": [
        {
          "title": "AWS Cloud Practitioner Essentials",
          "url": "https://aws.amazon.com/training",
          "type": "COURSE",
          "durationHours": 6
        }
      ]
    }
  ],
  "careerSteps": ["Earn AWS SAA", "Build Terraform IaC project", "Deploy on EKS"],
  "createdAt": "2026-10-24T16:00:00Z"
}
```

---

## 10. Mock Interview Endpoints

### POST /interviews/sessions
`[CANDIDATE]` Start a mock interview session.

**Request:**
```json
{ "targetRole": "Backend Engineer", "difficulty": "MEDIUM", "questionCount": 5 }
```

**Response 201:**
```json
{
  "sessionId": 20,
  "targetRole": "Backend Engineer",
  "difficulty": "MEDIUM",
  "status": "ACTIVE",
  "questions": [
    {
      "id": 101,
      "orderIndex": 1,
      "questionText": "Describe a time you optimized a slow database query.",
      "category": "BEHAVIORAL"
    }
  ],
  "startedAt": "2026-10-24T16:00:00Z"
}
```

---

### POST /interviews/sessions/{sessionId}/answers
`[CANDIDATE]` Submit answer to a question.

**Request:**
```json
{
  "questionId": 101,
  "answerText": "In my previous role, I noticed a query taking 8 seconds..."
}
```

**Response 202:** `{ "answerId": 500, "status": "PENDING" }`

---

### GET /interviews/sessions/{sessionId}/answers/{answerId}
`[CANDIDATE]` Get feedback for a submitted answer.

**Response 200:**
```json
{
  "answerId": 500,
  "questionId": 101,
  "score": 7.5,
  "strengths": ["Clear situation description", "Specific metric mentioned"],
  "improvements": ["Missing STAR Task component", "Result not quantified sufficiently"],
  "modelAnswerHint": "Structure using STAR: Situation, Task, Action, Result with a measurable outcome.",
  "feedbackStatus": "COMPLETED"
}
```

---

### PATCH /interviews/sessions/{sessionId}/complete
`[CANDIDATE]` Mark session as complete and get summary.

---

### GET /interviews/sessions
`[CANDIDATE]` List own interview session history.

---

## 11. Recruiter-Specific Endpoints

### GET /recruiter/me
`[RECRUITER]` Get recruiter profile.

### PUT /recruiter/me
`[RECRUITER]` Update recruiter profile.

### GET /recruiter/company
`[RECRUITER]` Get own company profile.

### POST /recruiter/company
`[RECRUITER]` Create company profile.

### PUT /recruiter/company
`[RECRUITER]` Update company profile.

### POST /recruiter/applications/{id}/notes
`[RECRUITER]` Add a private note to an application.

**Request:** `{ "noteText": "Strong system design skills. Schedule technical round." }`

### GET /recruiter/applications/{id}/notes
`[RECRUITER]` Get notes for an application.

### POST /recruiter/jobs/{jobId}/shortlist/{applicationId}
`[RECRUITER]` Add application to shortlist.

### DELETE /recruiter/jobs/{jobId}/shortlist/{applicationId}
`[RECRUITER]` Remove from shortlist.

### GET /recruiter/jobs/{jobId}/shortlist
`[RECRUITER]` Get shortlisted applications for a job.

### GET /recruiter/analytics/overview
`[RECRUITER]` Dashboard analytics: total jobs, applications, status breakdown.

### GET /recruiter/analytics/job/{jobId}/funnel
`[RECRUITER]` Application funnel for a specific job.

### GET /recruiter/applications/{id}/candidate-insights
`[RECRUITER]` AI-generated candidate strengths/gaps summary.

### GET /recruiter/reports/job/{jobId}/applicants.csv
`[RECRUITER]` Export applicant report for a job as CSV.

---

## 12. Notification Endpoints

### GET /notifications
`[ANY_AUTH]` List own notifications (unread first).

**Query params:** `read`, `page`, `size`

### PATCH /notifications/{id}/read
`[ANY_AUTH]` Mark notification as read.

### PATCH /notifications/read-all
`[ANY_AUTH]` Mark all notifications as read.

### DELETE /notifications/{id}
`[ANY_AUTH]` Delete a notification.

---

## 13. Admin Endpoints

### GET /admin/users
`[ADMIN]` List all users with search and filter.

**Query params:** `email`, `role`, `isActive`, `page`, `size`

### GET /admin/users/{id}
`[ADMIN]` Get user detail.

### PATCH /admin/users/{id}/suspend
`[ADMIN]` Suspend a user account.

**Request:** `{ "reason": "Terms of service violation" }`

### PATCH /admin/users/{id}/reactivate
`[ADMIN]` Reactivate a suspended account.

### DELETE /admin/users/{id}
`[ADMIN]` Permanently delete a user (cascades per data retention policy).

### GET /admin/companies
`[ADMIN]` List all companies.

### PATCH /admin/companies/{id}/verify
`[ADMIN]` Mark company as verified.

### GET /admin/jobs
`[ADMIN]` List all jobs (all statuses, all companies).

### PATCH /admin/jobs/{id}/remove
`[ADMIN]` Force-remove a published job (moderation).

### GET /admin/analytics/overview
`[ADMIN]` Platform analytics: user counts, job counts, application counts, AI usage.

### GET /admin/audit-log
`[ADMIN]` Paginated audit event log with filters.

### GET /admin/settings
`[ADMIN]` List platform settings.

### PUT /admin/settings/{key}
`[ADMIN]` Update a platform setting.

**Request:** `{ "value": "10485760" }`

---

## 14. Internal AI Service API (Spring Boot → FastAPI)

**Base URL:** `http://localhost:8000/api/v1`  
**Auth header:** `X-Internal-Api-Key: <AI_INTERNAL_API_KEY env var>`

All endpoints are POST only. No browser access.

### POST /parse/resume
**Request:**
```json
{
  "fileBase64": "<base64-encoded file bytes>",
  "originalFilename": "resume.pdf",
  "mimeType": "application/pdf"
}
```
**Response 200:**
```json
{
  "contact": { "name": "Jane Doe", "email": "...", "phone": "..." },
  "skills": ["Java", "Python"],
  "education": [{ "institution": "...", "degree": "...", "field": "...", "year": 2020 }],
  "experience": [{ "company": "...", "title": "...", "startDate": "...", "endDate": "...", "description": "..." }],
  "projects": [{ "name": "...", "description": "..." }],
  "certifications": [{ "name": "...", "issuer": "...", "year": 2023 }],
  "summary": "...",
  "rawText": "..."
}
```

### POST /analyze/ats
**Request:**
```json
{
  "resumeText": "...",
  "jobDescription": "...",
  "jobSkills": ["Java", "Spring Boot"]
}
```
**Response 200:**
```json
{
  "overallScore": 74.5,
  "keywordScore": 68.0,
  "formatScore": 82.0,
  "completenessScore": 75.0,
  "relevanceScore": 73.0,
  "missingKeywords": ["Kubernetes"],
  "suggestions": [{ "section": "EXPERIENCE", "issue": "...", "recommendation": "..." }]
}
```

### POST /match/semantic
**Request:** `{ "resumeText": "...", "jobDescription": "..." }`  
**Response:** `{ "similarityScore": 0.82, "method": "cosine-all-MiniLM-L6-v2" }`

### POST /match/rank
**Request:**
```json
{
  "jobDescription": "...",
  "jobSkills": ["Java"],
  "candidates": [{ "candidateId": 10, "resumeText": "..." }]
}
```
**Response:**
```json
{
  "rankings": [
    {
      "candidateId": 10,
      "semanticScore": 0.82,
      "keywordOverlapScore": 0.75,
      "compositeScore": 79.1,
      "matchedSkills": ["Java"],
      "missingSkills": [],
      "matchedRequirements": [],
      "missingRequirements": [],
      "evidenceSnippets": [{ "requirement": "...", "evidence": "..." }]
    }
  ]
}
```

### POST /resume/improve
**Request:** `{ "resumeText": "...", "jobDescription": "...", "targetRole": "Backend Engineer" }`  
**Response:** `{ "suggestions": [{ "section": "...", "issue": "...", "recommendation": "..." }] }`

### POST /resume/anonymize
**Request:** `{ "resumeText": "..." }`  
**Response:** `{ "anonymizedText": "...", "redactedFields": ["name", "email", "phone"] }`

### POST /career/gap-analysis
**Request:** `{ "currentSkills": ["Java"], "targetRole": "Cloud Architect", "jobDescription": "..." }`  
**Response:**
```json
{
  "missingSkills": ["AWS", "Terraform"],
  "learningPaths": [
    {
      "skill": "AWS",
      "resources": [{ "title": "...", "url": "...", "type": "COURSE", "durationHours": 6 }]
    }
  ],
  "recommendedSteps": ["Earn AWS SAA", "Build Terraform project"]
}
```

### POST /interview/generate
**Request:** `{ "jobTitle": "Backend Engineer", "jobDescription": "...", "difficulty": "MEDIUM", "count": 5 }`  
**Response:** `{ "questions": [{ "id": "q1", "text": "...", "category": "BEHAVIORAL", "expectedKeywords": ["STAR", "metrics"] }] }`

### POST /interview/feedback
**Request:** `{ "question": "...", "answer": "...", "expectedKeywords": ["STAR"] }`  
**Response:** `{ "score": 7.5, "strengths": ["..."], "improvements": ["..."], "modelAnswerHint": "..." }`

---

*All AI service endpoints return HTTP 503 with `{ "error": "ai_service_unavailable" }` if the FastAPI service is unreachable. Spring Boot handles this gracefully and returns a user-friendly degraded response.*
