import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from './pages/public/LandingPage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { CandidateDashboard } from './pages/candidate/CandidateDashboard';
import { CandidateProfilePage } from './pages/candidate/CandidateProfilePage';
import { JobBrowsePage } from './pages/candidate/jobs/JobBrowsePage';
import { CandidateJobDetailPage } from './pages/candidate/jobs/CandidateJobDetailPage';
import { CandidateApplicationsPage } from './pages/candidate/CandidateApplicationsPage';
import { CandidateNotificationsPage } from './pages/candidate/CandidateNotificationsPage';
import { RecruiterDashboard } from './pages/recruiter/RecruiterDashboard';
import { RecruiterProfilePage } from './pages/recruiter/RecruiterProfilePage';
import { RecruiterJobsPage } from './pages/recruiter/jobs/RecruiterJobsPage';
import { CreateJobPage } from './pages/recruiter/jobs/CreateJobPage';
import { JobApplicantsPage } from './pages/recruiter/jobs/JobApplicantsPage';
import { AdminDashboard } from './pages/admin/AdminDashboard';

export const App: React.FC = () => {
  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Candidate Protected Routes */}
      <Route element={<ProtectedRoute requiredRole="ROLE_CANDIDATE" />}>
        <Route path="/candidate/dashboard" element={<CandidateDashboard />} />
        <Route path="/candidate/profile" element={<CandidateProfilePage />} />
        <Route path="/candidate/jobs" element={<JobBrowsePage />} />
        <Route path="/candidate/jobs/:id" element={<CandidateJobDetailPage />} />
        <Route path="/candidate/applications" element={<CandidateApplicationsPage />} />
        <Route path="/candidate/notifications" element={<CandidateNotificationsPage />} />
      </Route>

      {/* Recruiter Protected Routes */}
      <Route element={<ProtectedRoute requiredRole="ROLE_RECRUITER" />}>
        <Route path="/recruiter/dashboard" element={<RecruiterDashboard />} />
        <Route path="/recruiter/profile" element={<RecruiterProfilePage />} />
        <Route path="/recruiter/jobs" element={<RecruiterJobsPage />} />
        <Route path="/recruiter/jobs/new" element={<CreateJobPage />} />
        <Route path="/recruiter/jobs/:id/applicants" element={<JobApplicantsPage />} />
      </Route>

      {/* Admin Protected Routes */}
      <Route element={<ProtectedRoute requiredRole="ROLE_ADMIN" />}>
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
