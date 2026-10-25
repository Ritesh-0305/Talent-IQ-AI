import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import api from '../../api/client';
import { 
  Building2, 
  Users, 
  Briefcase, 
  ArrowUpRight, 
  Loader2, 
  AlertCircle 
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface DashboardData {
  welcomeName: string;
  totalApplications: number;
  activeJobs: number;
  totalInterviews: number;
  recentActivity: string[];
}

export const RecruiterDashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await api.get('/recruiter/dashboard');
        setData(response.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load recruiter metrics.');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  return (
    <DashboardLayout role="RECRUITER">
      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        </div>
      ) : error ? (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Welcome Banner */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Welcome, {data?.welcomeName || 'Recruiter'}!</h1>
              <p className="text-slate-300 text-sm mt-1">
                Recruitment command center. Manage your verified company branding, post openings, and track pipelines.
              </p>
            </div>
            <Link
              to="/recruiter/profile"
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition shrink-0"
            >
              <span>Company Profile</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Real Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Active Published Jobs</span>
                <Briefcase className="w-5 h-5 text-indigo-500" />
              </div>
              <div className="text-3xl font-extrabold text-slate-800">{data?.activeJobs ?? 0}</div>
              <p className="text-xs text-slate-400 mt-1">Live requisitions receiving candidate applications</p>
            </div>

            <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Total Received Applicants</span>
                <Users className="w-5 h-5 text-emerald-500" />
              </div>
              <div className="text-3xl font-extrabold text-slate-800">{data?.totalApplications ?? 0}</div>
              <p className="text-xs text-slate-400 mt-1">Evaluated across all managed listings</p>
            </div>

            <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Scheduled Interviews</span>
                <Building2 className="w-5 h-5 text-purple-500" />
              </div>
              <div className="text-3xl font-extrabold text-slate-800">{data?.totalInterviews ?? 0}</div>
              <p className="text-xs text-slate-400 mt-1">Active interview stages in progress</p>
            </div>
          </div>

          {/* Empty State Banner (No fake data) */}
          <div className="p-8 bg-white rounded-xl border border-slate-200 text-center">
            <div className="max-w-md mx-auto">
              <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-800">No active job listings published</h3>
              <p className="text-sm text-slate-500 mt-1">
                You currently have no open job listings. Job creation, publishing workflows, and candidate pipeline ranking will be unlocked in Phase 4.
              </p>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};
