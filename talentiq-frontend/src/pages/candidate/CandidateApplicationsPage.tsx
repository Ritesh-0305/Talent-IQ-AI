import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import api from '../../api/client';
import { 
  Briefcase, 
  Clock, 
  MapPin, 
  Building2, 
  Loader2, 
  AlertCircle
} from 'lucide-react';

interface Application {
  id: number;
  jobId: number;
  jobTitle: string;
  companyName: string;
  jobLocation: string;
  status: string;
  appliedAt: string;
  history: { fromStatus?: string; toStatus: string; changedByName: string; note?: string; changedAt: string }[];
}

export const CandidateApplicationsPage: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [withdrawingId, setWithdrawingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchApplications = async () => {
    try {
      const res = await api.get('/candidates/applications');
      setApplications(res.data.content || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load application history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleWithdraw = async (applicationId: number) => {
    if (!window.confirm('Are you sure you want to withdraw this application? This action cannot be undone.')) {
      return;
    }
    setWithdrawingId(applicationId);
    try {
      await api.patch(`/candidates/applications/${applicationId}/withdraw`);
      await fetchApplications();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Could not withdraw application.');
    } finally {
      setWithdrawingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUBMITTED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">Submitted</span>;
      case 'REVIEWED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">Under Review</span>;
      case 'SHORTLISTED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">Shortlisted</span>;
      case 'INTERVIEWING':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">Interviewing</span>;
      case 'OFFERED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">Offer Extended</span>;
      case 'REJECTED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">Not Selected</span>;
      case 'WITHDRAWN':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">Withdrawn</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800">{status}</span>;
    }
  };

  return (
    <DashboardLayout role="CANDIDATE">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Application History & Status</h1>
          <p className="text-sm text-slate-500">
            Real-time tracking of submitted applications, recruitment stages, and hiring outcomes.
          </p>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center space-x-2 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          </div>
        ) : applications.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-xl border border-slate-200 shadow-sm">
            <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-800">No applications on record</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
              You haven't applied to any job listings yet. Head over to the Jobs section to search and submit applications.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => (
              <div key={app.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{app.jobTitle}</h3>
                    <div className="flex items-center space-x-3 text-xs text-slate-500 mt-1">
                      <span className="flex items-center space-x-1 font-semibold text-slate-700">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>{app.companyName}</span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center space-x-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{app.jobLocation}</span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Applied {new Date(app.appliedAt).toLocaleDateString()}</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    {getStatusBadge(app.status)}

                    {app.status !== 'WITHDRAWN' && app.status !== 'OFFERED' && app.status !== 'REJECTED' && (
                      <button
                        onClick={() => handleWithdraw(app.id)}
                        disabled={withdrawingId === app.id}
                        className="px-3 py-1 text-xs font-semibold text-rose-600 hover:text-rose-700 border border-rose-200 hover:border-rose-300 rounded-lg transition disabled:opacity-50"
                      >
                        {withdrawingId === app.id ? 'Withdrawing...' : 'Withdraw'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Status Timeline History */}
                <div className="space-y-2">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Stage Progression Log</div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {app.history?.map((h, i) => (
                      <div key={i} className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200">
                        <span className="w-2 h-2 rounded-full bg-indigo-500" />
                        <span className="font-semibold text-slate-700">{h.toStatus}</span>
                        {h.note && <span className="text-slate-500 italic">({h.note})</span>}
                        <span className="text-slate-400">on {new Date(h.changedAt).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
