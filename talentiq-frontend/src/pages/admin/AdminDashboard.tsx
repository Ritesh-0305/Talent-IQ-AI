import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import api from '../../api/client';
import { 
  ShieldCheck, 
  Users, 
  Server, 
  Activity, 
  Loader2, 
  AlertCircle 
} from 'lucide-react';

interface AdminDashboardData {
  welcomeName: string;
  totalUsers: number;
  totalApplications: number;
  activeJobs: number;
  totalInterviews: number;
  recentActivity: string[];
}

interface UserSummary {
  id: number;
  email: string;
  active: boolean;
  createdAt: string;
  roles: { id: number; name: string }[];
}

export const AdminDashboard: React.FC = () => {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const [dashRes, usersRes] = await Promise.all([
          api.get('/admin/dashboard'),
          api.get('/admin/users'),
        ]);
        setData(dashRes.data);
        setUsers(usersRes.data || []);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Access denied or failed to load administrative telemetry.');
      } finally {
        setLoading(false);
      }
    };
    fetchAdminData();
  }, []);

  return (
    <DashboardLayout role="ADMIN">
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
          <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-xs font-semibold uppercase tracking-wider mb-2">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Super Administrator Privileges</span>
              </div>
              <h1 className="text-2xl font-bold">{data?.welcomeName || 'System Administrator'}</h1>
              <p className="text-slate-300 text-sm mt-1">
                Authoritative platform monitoring, user governance, audit compliance, and moderation.
              </p>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Registered System Users</span>
                <Users className="w-5 h-5 text-indigo-500" />
              </div>
              <div className="text-3xl font-extrabold text-slate-800">{data?.totalUsers ?? users.length}</div>
              <p className="text-xs text-slate-400 mt-1">Across Candidate, Recruiter, and Admin partitions</p>
            </div>

            <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">System State</span>
                <Server className="w-5 h-5 text-emerald-500" />
              </div>
              <div className="text-3xl font-extrabold text-emerald-600">Operational</div>
              <p className="text-xs text-slate-400 mt-1">Flyway migrations validated; auth active</p>
            </div>

            <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">AI Service Status</span>
                <Activity className="w-5 h-5 text-purple-500" />
              </div>
              <div className="text-3xl font-extrabold text-slate-800">Ready</div>
              <p className="text-xs text-slate-400 mt-1">Port 8000 decoupled gateway configured</p>
            </div>
          </div>

          {/* User Table (Database Backed) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-800">User Governance Roster</h2>
                <p className="text-xs text-slate-500 mt-0.5">Authoritative user entities registered in MySQL persistence</p>
              </div>
              <span className="text-xs px-2.5 py-1 rounded bg-slate-100 text-slate-700 font-semibold">
                {users.length} Users
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3.5">ID</th>
                    <th className="px-6 py-3.5">Email Identity</th>
                    <th className="px-6 py-3.5">Assigned Roles</th>
                    <th className="px-6 py-3.5">Account Status</th>
                    <th className="px-6 py-3.5">Created At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/60 transition">
                      <td className="px-6 py-4 font-mono text-xs text-slate-400">#{u.id}</td>
                      <td className="px-6 py-4 font-medium text-slate-900">{u.email}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {u.roles?.map((r) => (
                            <span
                              key={r.id}
                              className={`text-xs px-2 py-0.5 rounded font-semibold ${
                                r.name === 'ROLE_ADMIN'
                                  ? 'bg-rose-100 text-rose-800'
                                  : r.name === 'ROLE_RECRUITER'
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-indigo-100 text-indigo-800'
                              }`}
                            >
                              {r.name.replace('ROLE_', '')}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                          u.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {u.active ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-400">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-slate-400 text-xs">
                        No registered users found in database records.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};
