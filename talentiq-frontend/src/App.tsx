import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from './pages/public/LandingPage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { CandidateDashboard } from './pages/candidate/CandidateDashboard';
import { CandidateProfilePage } from './pages/candidate/CandidateProfilePage';
import { RecruiterDashboard } from './pages/recruiter/RecruiterDashboard';
import { RecruiterProfilePage } from './pages/recruiter/RecruiterProfilePage';
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
      </Route>

      {/* Recruiter Protected Routes */}
      <Route element={<ProtectedRoute requiredRole="ROLE_RECRUITER" />}>
        <Route path="/recruiter/dashboard" element={<RecruiterDashboard />} />
        <Route path="/recruiter/profile" element={<RecruiterProfilePage />} />
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
