import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Briefcase, 
  User, 
  LogOut, 
  LayoutDashboard, 
  Shield, 
  Building2, 
  FileText 
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  role: 'CANDIDATE' | 'RECRUITER' | 'ADMIN';
}

export const DashboardLayout: React.FC<LayoutProps> = ({ children, role }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 text-slate-100 flex flex-col shrink-0">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2 font-bold text-xl tracking-tight text-indigo-400">
            <Briefcase className="w-6 h-6" />
            <span>TalentIQ AI</span>
          </Link>
          <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 uppercase font-semibold">
            {role}
          </span>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {role === 'CANDIDATE' && (
            <>
              <Link
                to="/candidate/dashboard"
                className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 transition"
              >
                <LayoutDashboard className="w-4 h-4 text-slate-400" />
                <span>Dashboard</span>
              </Link>
              <Link
                to="/candidate/profile"
                className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 transition"
              >
                <User className="w-4 h-4 text-slate-400" />
                <span>My Profile</span>
              </Link>
              <div className="pt-4 pb-2 px-3 text-xs font-semibold uppercase text-slate-500">Applications</div>
              <div className="px-3 py-2 text-xs text-slate-400 flex items-center space-x-2">
                <FileText className="w-3.5 h-3.5" />
                <span>Job Applications (Phase 4)</span>
              </div>
            </>
          )}

          {role === 'RECRUITER' && (
            <>
              <Link
                to="/recruiter/dashboard"
                className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 transition"
              >
                <LayoutDashboard className="w-4 h-4 text-slate-400" />
                <span>Dashboard</span>
              </Link>
              <Link
                to="/recruiter/profile"
                className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 transition"
              >
                <Building2 className="w-4 h-4 text-slate-400" />
                <span>Recruiter & Company</span>
              </Link>
              <div className="pt-4 pb-2 px-3 text-xs font-semibold uppercase text-slate-500">Pipeline</div>
              <div className="px-3 py-2 text-xs text-slate-400 flex items-center space-x-2">
                <Briefcase className="w-3.5 h-3.5" />
                <span>Job Openings (Phase 4)</span>
              </div>
            </>
          )}

          {role === 'ADMIN' && (
            <>
              <Link
                to="/admin/dashboard"
                className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 transition"
              >
                <Shield className="w-4 h-4 text-slate-400" />
                <span>Admin Console</span>
              </Link>
            </>
          )}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="text-xs text-slate-400 truncate mb-2">{user?.email}</div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-rose-400 hover:bg-rose-950/30 transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
          <div className="font-semibold text-slate-800 text-lg">
            {role === 'CANDIDATE' && 'Candidate Portal'}
            {role === 'RECRUITER' && 'Recruiter Command Center'}
            {role === 'ADMIN' && 'Platform Administration'}
          </div>
          <div className="flex items-center space-x-3 text-sm text-slate-500">
            <span>Status: <strong className="text-emerald-600 font-medium">Online</strong></span>
          </div>
        </header>

        <div className="flex-1 p-6 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
};
