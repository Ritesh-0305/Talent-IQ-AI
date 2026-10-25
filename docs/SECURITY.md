# TalentIQ AI — Security Design

**Version:** 1.0  
**Phase:** 1 — Architecture Planning  
**Date:** 2026-10-24

---

## 1. Authentication Design

### 1.1 JWT Token Strategy

| Property | Value |
|----------|-------|
| Algorithm | HS256 (HMAC-SHA256) |
| Access token lifetime | 24 hours (configurable via `JWT_EXPIRATION_MS`) |
| Refresh token lifetime | 7 days (configurable via `JWT_REFRESH_EXPIRATION_MS`) |
| Signing secret | Minimum 256-bit random string; set via `JWT_SECRET` env var |
| Token storage (client) | `localStorage` (protected by CSP; HttpOnly cookies are an alternative) |
| Refresh token storage (server) | Stored as BCrypt hash in DB `refresh_tokens` table |

### 1.2 Token Claims
```json
{
  "sub": "42",
  "email": "user@example.com",
  "role": "CANDIDATE",
  "iat": 1761400000,
  "exp": 1761486400
}
```

No sensitive personal data in JWT payload. Role is embedded for fast claim checks; authoritative role is always verified in the DB for sensitive operations.

### 1.3 Token Rotation
- On refresh: old refresh token is invalidated; new pair issued
- On logout: refresh token deleted from DB
- Stolen refresh token: mitigated by DB validation (deleted = invalid)

---

## 2. Authorization Design

### 2.1 Spring Security Filter Chain

```
Request → CORS filter
       → JwtAuthFilter (extracts user from token → sets SecurityContext)
       → Spring Security method security (@PreAuthorize)
       → Controller
```

### 2.2 Role-Based Access Control Matrix

| Resource | CANDIDATE | RECRUITER | ADMIN |
|----------|-----------|-----------|-------|
| Public job browse | ✅ | ✅ | ✅ |
| Own candidate profile | ✅ | ❌ | ✅ (read) |
| Own resume upload/manage | ✅ | ❌ | ❌ |
| Submit application | ✅ | ❌ | ❌ |
| View own applications | ✅ | ❌ | ✅ (read) |
| Career guidance / interviews | ✅ | ❌ | ❌ |
| Create/edit own jobs | ❌ | ✅ | ❌ |
| View applicants for own jobs | ❌ | ✅ (own jobs only) | ✅ |
| Update application status | ❌ | ✅ (own jobs) | ✅ |
| Add recruiter notes | ❌ | ✅ (own) | ❌ |
| Company profile management | ❌ | ✅ (own) | ✅ |
| View other recruiter's data | ❌ | ❌ | ✅ |
| Suspend/reactivate users | ❌ | ❌ | ✅ |
| Admin audit log | ❌ | ❌ | ✅ |
| Platform settings | ❌ | ❌ | ✅ |

### 2.3 Resource Ownership Enforcement

All recruiter operations include an ownership check:
```java
// Example: Recruiter can only update their own job
Job job = jobRepository.findById(jobId)
    .orElseThrow(ResourceNotFoundException::new);
if (!job.getPostedBy().getUserId().equals(currentUserId)) {
    throw new UnauthorizedException("Access denied");
}
```

This check is performed in the service layer — **not just the controller** — to prevent any bypass.

### 2.4 Admin Provisioning

Admin accounts are **never created through the public `/auth/register` endpoint**.

Admin provisioning flow:
1. On first application startup, Spring Boot checks for `ADMIN_EMAIL` and `ADMIN_PASSWORD` environment variables.
2. If present and no admin user exists, a single admin user is created with a BCrypt-hashed password.
3. `ADMIN_PASSWORD` env var is read once and never stored in plaintext.
4. Subsequent admins are created by existing admins via `POST /admin/users` with `role: ADMIN`.

---

## 3. Password Security

| Property | Implementation |
|----------|---------------|
| Hashing algorithm | BCrypt (`BCryptPasswordEncoder`, strength=12) |
| Minimum length | 8 characters |
| Complexity | At least 1 uppercase, 1 lowercase, 1 digit, 1 special character |
| Password reset | Token-based (Phase 10 enhancement) |
| Change password | Requires current password verification |

---

## 4. File Upload Security

### 4.1 Validation Steps (all must pass)
1. **File size check**: Reject if > `app.storage.max-file-size` (default 10 MB)
2. **Extension check**: Only `.pdf` and `.docx` permitted
3. **MIME type check** (magic bytes, not just Content-Type header):
   - PDF: first 4 bytes = `25 50 44 46` (`%PDF`)
   - DOCX: first 4 bytes = `50 4B 03 04` (ZIP/OOXML signature)
4. **Filename sanitization**: Strip path traversal characters, UUID-prefix stored filename
5. **Virus scanning**: Recommended for production (ClamAV integration, Phase 11)

### 4.2 Storage Security
- Files stored at: `{app.storage.base-path}/resumes/{candidateId}/{uuid}.{ext}`
- Base path is **outside the web root** (not accessible via URL)
- Download endpoint enforces ownership:
  - Candidates: can only download own resumes
  - Recruiters: can access resumes of candidates who applied to their jobs
  - Access check before file stream is opened

---

## 5. Internal AI Service Security

### 5.1 API Key Authentication
```
Header: X-Internal-Api-Key: <AI_INTERNAL_API_KEY>
```
- 64-character random alphanumeric key
- Set via environment variable on both Spring Boot and FastAPI
- Never returned to the browser; Spring Boot calls FastAPI server-side only
- FastAPI rejects any request without a valid matching key with HTTP 401

### 5.2 Network Isolation
- FastAPI binds to `127.0.0.1:8000` only (not `0.0.0.0`)
- Not accessible from the network; only Spring Boot on the same machine can reach it
- In production: place both services behind a private network; FastAPI not exposed to internet

---

## 6. Input Validation

### 6.1 Spring Boot
- All request bodies validated with Jakarta Bean Validation (`@Valid`, `@NotBlank`, `@Size`, `@Email`, etc.)
- Path variables and query parameters validated explicitly
- `GlobalExceptionHandler` catches `MethodArgumentNotValidException` → 400 with field-level errors

### 6.2 FastAPI
- All request bodies validated by Pydantic v2 models
- String length limits on all text fields
- File bytes validated before parsing begins

### 6.3 SQL Injection
- Spring Data JPA with parameterized queries — no string concatenation in JPQL or native queries
- Never pass user input directly into raw SQL strings

### 6.4 XSS Prevention
- React renders JSX (safe by default — no `dangerouslySetInnerHTML` without explicit sanitization)
- Spring Boot returns JSON only — no HTML rendering from user input
- Content Security Policy header set in production

---

## 7. Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| `POST /auth/login` | 10 requests | per IP per minute |
| `POST /auth/register` | 5 requests | per IP per minute |
| `POST /auth/refresh` | 20 requests | per IP per minute |
| `POST /resumes/upload` | 5 requests | per user per hour |
| AI analysis endpoints | 20 requests | per user per hour |

Implementation: Bucket4j with in-memory token buckets (Redis-backed for multi-instance production).

---

## 8. Secure Error Handling

### Production
- Stack traces never returned to clients
- Generic error messages for 401/403 (do not reveal whether a user exists)
- Internal server errors return: `{ "title": "Internal Server Error", "status": 500, "detail": "An unexpected error occurred" }`

### Development
- Stack traces available in `application-dev.yml` via `server.error.include-stacktrace: always`

---

## 9. Secrets Management

| Secret | Storage | Committed to Git |
|--------|---------|-----------------|
| `JWT_SECRET` | Environment variable | ❌ Never |
| `DB_PASSWORD` | Environment variable | ❌ Never |
| `GEMINI_API_KEY` | Environment variable | ❌ Never |
| `AI_INTERNAL_API_KEY` | Environment variable | ❌ Never |
| `ADMIN_PASSWORD` | Environment variable (startup only) | ❌ Never |
| `application-dev.yml` | Local file, gitignored | ❌ Never |
| `.env` (FastAPI) | Local file, gitignored | ❌ Never |

`.gitignore` entries:
```
application-dev.yml
application-local.yml
talentiq-ai/.env
*.secret
*.key
.env
```

---

## 10. Logging Security

| Should log | Should NOT log |
|-----------|---------------|
| Authentication events (success/failure, IP) | Passwords (plain or hashed) |
| Authorization failures | JWT token values |
| Admin actions (what, who, when) | Resume file contents |
| File upload events (filename, size, user) | PII from resume parsing |
| AI service call outcomes (status, latency) | Gemini API key |
| Error events (type, user, endpoint) | Full request bodies containing credentials |

Log level: `INFO` in production, `DEBUG` in development.  
Sensitive field masking: custom Logback filter applied to HTTP access logs.

---

## 11. Candidate Anonymization for Recruiters

When a recruiter views a candidate in evaluation mode (not after hiring decision):
- Candidate name replaced with "Candidate #{anonymized_id}"
- Email, phone, address fields hidden
- Social profile URLs removed
- Photo references removed
- Skills, education institutions, companies (without personal identifiers), and work descriptions are preserved

Anonymization is applied at the **API response layer** in `RecruiterController` — the underlying database retains full data for the candidate's own access.

---

## 12. Data Retention and Deletion

| Event | Action |
|-------|--------|
| User requests account deletion | Soft-delete user record; candidate/recruiter profile soft-deleted; applications preserved for job history integrity |
| Resume deletion by candidate | Soft-delete; application references preserved; file deleted from storage after grace period |
| Job deletion by recruiter (DRAFT only) | Hard-delete job; no applications exist yet |
| Admin user deletion | Permanent; cascades per FK constraints |
| Notification deletion | Hard-delete |
| Audit logs | Never deleted (retention: 2 years minimum) |

---

## 13. AI Ethics and Bias Prevention

Per specification — non-negotiable:

1. **No protected characteristics used as signals**: name, gender, age, ethnicity, religion, photo, or any inferred attribute from these are explicitly excluded from all scoring inputs.
2. **Advisory only**: AI scores are labelled as "AI-assisted decision support" in all UI contexts. No automatic rejection or automatic hiring.
3. **Score description**: Scores are labelled as "match score" — not "success probability" or "hire recommendation."
4. **Transparency**: Explainability is mandatory — every score shown to a recruiter is accompanied by matched/missing skills and evidence snippets.
5. **Anonymized evaluation**: Recruiter-facing candidate profiles use anonymized display by default during the initial screening stage.

---

*Security design is confirmed. All security controls must be implemented — none may be skipped for convenience.*
