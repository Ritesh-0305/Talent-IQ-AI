# TalentIQ AI — Component Map

**Version:** 1.0  
**Phase:** 1 — Architecture Planning  
**Date:** 2026-10-24

---

## 1. Frontend Component Tree

### 1.1 Application Shell

```
App.tsx
├── Router (React Router v7)
│   ├── PublicRoute (redirect to dashboard if authenticated)
│   │   ├── /login           → pages/auth/LoginPage.tsx
│   │   ├── /register        → pages/auth/RegisterPage.tsx
│   │   └── /jobs/:id        → pages/public/JobDetailPage.tsx  (public read)
│   │
│   ├── CandidateRoute (role guard: CANDIDATE only)
│   │   └── CandidateLayout.tsx
│   │       ├── CandidateSidebar.tsx
│   │       ├── TopBar.tsx (notifications bell, user menu)
│   │       ├── /candidate/dashboard      → CandidateDashboardPage.tsx
│   │       ├── /candidate/profile        → CandidateProfilePage.tsx
│   │       ├── /candidate/resumes        → ResumeListPage.tsx
│   │       ├── /candidate/resumes/upload → ResumeUploadPage.tsx
│   │       ├── /candidate/resumes/:id    → ResumeDetailPage.tsx
│   │       ├── /candidate/ats/:id        → AtsAnalysisPage.tsx
│   │       ├── /candidate/jobs           → JobSearchPage.tsx
│   │       ├── /candidate/jobs/:id       → JobDetailPage.tsx (candidate view)
│   │       ├── /candidate/applications   → ApplicationHistoryPage.tsx
│   │       ├── /candidate/career         → CareerGuidancePage.tsx
│   │       ├── /candidate/interviews     → InterviewListPage.tsx
│   │       ├── /candidate/interviews/:id → InterviewSessionPage.tsx
│   │       └── /candidate/settings       → AccountSettingsPage.tsx
│   │
│   ├── RecruiterRoute (role guard: RECRUITER only)
│   │   └── RecruiterLayout.tsx
│   │       ├── RecruiterSidebar.tsx
│   │       ├── TopBar.tsx
│   │       ├── /recruiter/dashboard        → RecruiterDashboardPage.tsx
│   │       ├── /recruiter/company          → CompanyProfilePage.tsx
│   │       ├── /recruiter/jobs             → JobListPage.tsx
│   │       ├── /recruiter/jobs/new         → JobCreatePage.tsx
│   │       ├── /recruiter/jobs/:id/edit    → JobEditPage.tsx
│   │       ├── /recruiter/jobs/:id/applicants → ApplicantListPage.tsx
│   │       ├── /recruiter/applicants/:id   → ApplicantDetailPage.tsx
│   │       └── /recruiter/settings          → RecruiterSettingsPage.tsx
│   │
│   └── AdminRoute (role guard: ADMIN only)
│       └── AdminLayout.tsx
│           ├── AdminSidebar.tsx
│           ├── /admin/dashboard      → AdminDashboardPage.tsx
│           ├── /admin/users          → UserManagementPage.tsx
│           ├── /admin/users/:id      → UserDetailPage.tsx
│           ├── /admin/companies      → CompanyManagementPage.tsx
│           ├── /admin/jobs           → JobModerationPage.tsx
│           ├── /admin/analytics      → PlatformAnalyticsPage.tsx
│           ├── /admin/audit-log      → AuditLogPage.tsx
│           └── /admin/settings       → PlatformSettingsPage.tsx
│
└── Global Providers
    ├── QueryClient (React Query)
    ├── AuthProvider (Zustand)
    └── NotificationToastProvider
```

---

### 1.2 Shared UI Components (`src/components/ui/`)

| Component | Description |
|-----------|-------------|
| `Button.tsx` | Primary/secondary/danger/ghost variants, loading state, icon support |
| `Input.tsx` | Controlled input with label, error message, optional icon |
| `Textarea.tsx` | Multi-line input with label and error |
| `Select.tsx` | Dropdown select with label and error |
| `Badge.tsx` | Status badge (color-coded by enum: APPLICATION_STATUS, JOB_STATUS, etc.) |
| `Card.tsx` | Bordered card container with optional header and footer |
| `Modal.tsx` | Accessible dialog with backdrop, close on Escape |
| `Table.tsx` | Responsive table with sortable column headers |
| `Pagination.tsx` | Page navigation for paginated lists |
| `Spinner.tsx` | Loading indicator (inline and full-page variants) |
| `EmptyState.tsx` | Empty list placeholder with icon, message, optional CTA button |
| `Alert.tsx` | Success/warning/error/info inline alert banners |
| `Tooltip.tsx` | Hover tooltip |
| `FileUpload.tsx` | Drag-and-drop file upload area with validation feedback |
| `ProgressBar.tsx` | ATS score and match score visual progress bar |
| `ScoreRing.tsx` | Circular score display (ATS / composite match) |
| `Tabs.tsx` | Accessible tabbed panels |
| `SearchInput.tsx` | Search input with debounce |
| `ConfirmDialog.tsx` | Confirmation modal before destructive actions |

---

### 1.3 Layout Components (`src/components/layout/`)

| Component | Description |
|-----------|-------------|
| `CandidateLayout.tsx` | Sidebar + top bar shell for candidate pages |
| `RecruiterLayout.tsx` | Sidebar + top bar shell for recruiter pages |
| `AdminLayout.tsx` | Sidebar + top bar shell for admin pages |
| `CandidateSidebar.tsx` | Navigation links for candidate role |
| `RecruiterSidebar.tsx` | Navigation links for recruiter role |
| `AdminSidebar.tsx` | Navigation links for admin role |
| `TopBar.tsx` | Notification bell, user avatar, role switcher (if multi-role) |
| `NotificationPanel.tsx` | Slide-out notification list |
| `RoleGuard.tsx` | HOC/wrapper that redirects unauthorized roles |

---

### 1.4 Domain Components (`src/components/domain/`)

| Component | Domain | Description |
|-----------|--------|-------------|
| `JobCard.tsx` | Jobs | Card for job listing item |
| `JobFilters.tsx` | Jobs | Filter sidebar/panel for job search |
| `ApplicationRow.tsx` | Applications | Single row in application history table |
| `ApplicationStatusBadge.tsx` | Applications | Color-coded status pill |
| `ApplicationStatusTimeline.tsx` | Applications | Status history progression display |
| `ResumeVersionCard.tsx` | Resumes | Card for a resume version (upload date, label, active toggle) |
| `ResumeUploader.tsx` | Resumes | File drop area + upload progress indicator |
| `ParsedResumeView.tsx` | Resumes | Tabbed view: contact/skills/education/experience/projects |
| `AtsScoreCard.tsx` | ATS | Overall score ring + sub-score bars |
| `AtsSuggestionList.tsx` | ATS | List of actionable suggestions grouped by section |
| `MatchScoreCard.tsx` | Matching | Composite score display with explanation |
| `MatchExplanationPanel.tsx` | Matching | Matched/missing skills and requirements |
| `CandidateRankingTable.tsx` | Matching | Recruiter view: ranked applicant list |
| `SkillGapChart.tsx` | Career | Visual skill gap display |
| `LearningResourceList.tsx` | Career | Resource cards with type/duration/URL |
| `InterviewQuestionCard.tsx` | Interviews | Question display with answer textarea |
| `InterviewFeedbackCard.tsx` | Interviews | Score ring, strengths list, improvements list |
| `RecruiterNoteEditor.tsx` | Recruiter | Add/edit private note |
| `ShortlistButton.tsx` | Recruiter | Toggle shortlist status |
| `CompanyCard.tsx` | Company | Company summary card |
| `NotificationItem.tsx` | Notifications | Single notification item |
| `StatCard.tsx` | Analytics | KPI metric card for dashboard |
| `FunnelChart.tsx` | Analytics | Application funnel visualization |

---

## 2. Spring Boot Controller → Service Map

| Controller | Endpoints (summarized) | Services Called |
|-----------|----------------------|-----------------|
| `AuthController` | register, login, refresh, logout, change-password | `AuthService`, `UserService` |
| `CandidateController` | profile CRUD, skills | `CandidateService` |
| `JobController` | public job browse, detail, recommendations | `JobService`, `MatchingService` |
| `RecruiterController` | company CRUD, recruiter profile | `RecruiterService`, `CompanyService` |
| `JobManagementController` | create/edit/publish/close/delete jobs | `JobService` |
| `ApplicationController` | submit, withdraw, history, status updates | `ApplicationService`, `NotificationService` |
| `ResumeController` | upload, list, download, delete, set-active, parsed data | `ResumeService`, `StorageService`, `AiOrchestrationService` |
| `AtsController` | analyze, poll, list analyses | `AiOrchestrationService`, `AtsAnalysisService` |
| `MatchingController` | analyze, rank, rankings, improve, anonymize | `AiOrchestrationService`, `MatchingService` |
| `CareerController` | gap analysis, poll, list | `AiOrchestrationService`, `CareerService` |
| `InterviewController` | create session, submit answer, get feedback, complete | `AiOrchestrationService`, `InterviewService` |
| `NotificationController` | list, read, read-all, delete | `NotificationService` |
| `AdminController` | all admin operations | `AdminService`, `AuditService` |

---

## 3. FastAPI Router → Service Map

| Router | Endpoint | Services Called |
|--------|----------|-----------------|
| `parse.py` | `POST /parse/resume` | `ResumeParserService`, `NlpService` |
| `analyze.py` | `POST /analyze/ats` | `AtsService`, `LlmService` |
| `match.py` | `POST /match/semantic`, `POST /match/rank` | `EmbeddingService`, `MatchingService` |
| `resume.py` | `POST /resume/improve`, `POST /resume/anonymize` | `LlmService`, `NlpService` |
| `career.py` | `POST /career/gap-analysis` | `CareerService`, `LlmService` |
| `interview.py` | `POST /interview/generate`, `POST /interview/feedback` | `InterviewService`, `LlmService` |

---

## 4. State Management (Zustand Stores)

### `auth.store.ts`
```typescript
interface AuthState {
  user: { id: number; email: string; role: Role } | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  login: (credentials) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}
```

### `notification.store.ts`
```typescript
interface NotificationState {
  unreadCount: number;
  notifications: Notification[];
  fetchNotifications: () => Promise<void>;
  markRead: (id: number) => Promise<void>;
  markAllRead: () => Promise<void>;
}
```

---

## 5. API Client Layer (`src/api/`)

### `client.ts` — Axios Instance
- Base URL: `import.meta.env.VITE_API_BASE_URL` (default `http://localhost:8080/api/v1`)
- Request interceptor: inject `Authorization: Bearer <token>` from auth store
- Response interceptor: on 401 → attempt token refresh → retry once → logout if fails

### API Modules (all return typed Promise<T>):

| File | Key Functions |
|------|--------------|
| `auth.api.ts` | `register()`, `login()`, `refresh()`, `logout()`, `changePassword()` |
| `candidate.api.ts` | `getProfile()`, `updateProfile()` |
| `job.api.ts` | `listJobs(filters)`, `getJob(id)`, `getRecommendations()` |
| `recruiter.api.ts` | `getCompany()`, `createCompany()`, `updateCompany()`, `createJob()`, `updateJob()`, `publishJob()`, `closeJob()`, `listOwnJobs()`, `getApplicants(jobId, filters)`, `updateApplicationStatus()`, `addNote()`, `shortlist()`, `getAnalytics()`, `exportReport()` |
| `application.api.ts` | `apply()`, `getMyApplications()`, `withdraw()` |
| `resume.api.ts` | `uploadResume()`, `listResumes()`, `downloadResume()`, `deleteResume()`, `setActiveResume()`, `getParsedData()`, `requestImprovement()`, `getImprovement()` |
| `ats.api.ts` | `requestAnalysis()`, `getAnalysis()`, `listAnalyses()` |
| `matching.api.ts` | `requestMatch()`, `getMatch()`, `requestRanking()`, `getRankings()` |
| `career.api.ts` | `requestGapAnalysis()`, `getGapAnalysis()` |
| `interview.api.ts` | `startSession()`, `submitAnswer()`, `getFeedback()`, `completeSession()`, `listSessions()` |
| `notification.api.ts` | `getNotifications()`, `markRead()`, `markAllRead()`, `deleteNotification()` |
| `admin.api.ts` | `getUsers()`, `suspendUser()`, `reactivateUser()`, `getCompanies()`, `verifyCompany()`, `getJobs()`, `removeJob()`, `getAnalytics()`, `getAuditLog()`, `getSettings()`, `updateSetting()` |

---

## 6. Custom Hooks (`src/hooks/`)

| Hook | Returns |
|------|---------|
| `useAuth()` | Current user, isAuthenticated, login, logout |
| `useJobs(filters)` | Paginated job list, loading, error, refetch |
| `useJob(id)` | Single job detail |
| `useApplications()` | Candidate applications list |
| `useResumes()` | Resume version list |
| `useAtsAnalysis(id)` | ATS analysis with polling until COMPLETED |
| `useMatchingResult(id)` | Matching result with polling |
| `useInterviewSession(id)` | Session state and questions |
| `useNotifications()` | Notifications list, unread count |
| `useRecruiterAnalytics()` | Recruiter dashboard metrics |

---

*This component map defines the complete boundary of the frontend. No additional pages, routes, or API modules will be created outside this map without explicit approval.*
