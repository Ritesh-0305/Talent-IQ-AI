import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../../components/layout/DashboardLayout';
import api from '../../../api/client';
import { Briefcase, Plus, Users, Edit3, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Job {
  id: number;
  title: string;
  companyName: string;
  location: string;
  jobType: string;
  status: string;
  remote: boolean;
  publishedAt?: string;
  applicationCount: number;
  createdAt: string;
}

export const RecruiterJobsPage: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMyJobs = async () => {
    try {
      const res = await api.get('/recruiter/jobs');
      setJobs(res.data.content || []);
    } catch {
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyJobs();
  }, []);

  const handlePublish = async (id: number) => {
    try {
      await api.patch(`/recruiter/jobs/${id}/publish`);
      await fetchMyJobs();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Could not publish job.');
    }
  };

  const handleClose = async (id: number) => {
    if (!window.confirm('Close this job? Candidates will no longer be able to submit applications.')) return;
    try {
      await api.patch(`/recruiter/jobs/${id}/close`);
      await fetchMyJobs();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Could not close job.');
    }
  };

  return (
    <DashboardLayout role="RECRUITER">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Job Postings Management</h1>
            <p className="text-sm text-slate-500">
              Manage your company's requisitions, toggle publication status, and monitor candidate pipeline volume.
            </p>
          </div>
          <Link
            to="/recruiter/jobs/new"
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition shadow shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Job Posting</span>
          </Link>
        </div>

        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          </div>
        ) : jobs.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-xl border border-slate-200 shadow-sm">
            <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-800">No jobs posted yet</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto mb-6">
              Create your first job requisition to begin receiving and evaluating candidate submissions.
            </p>
            <Link
              to="/recruiter/jobs/new"
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Post a Requisition</span>
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3.5">Requisition Title</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5">Type & Location</th>
                    <th className="px-6 py-3.5">Applicants</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {jobs.map((job) => (
                    <tr key={job.id} className="hover:bg-slate-50/60 transition">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900">{job.title}</div>
                        <div className="text-xs text-slate-400">Created {new Date(job.createdAt).toLocaleDateString()}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          job.status === 'PUBLISHED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : job.status === 'CLOSED'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {job.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs">
                        <div>{job.location}</div>
                        <div className="text-slate-400">{job.remote ? 'Remote' : 'On-Site'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          to={`/recruiter/jobs/${job.id}/applicants`}
                          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition font-semibold text-xs"
                        >
                          <Users className="w-3.5 h-3.5" />
                          <span>{job.applicationCount} Applicants</span>
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        {job.status === 'DRAFT' && (
                          <button
                            onClick={() => handlePublish(job.id)}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold transition"
                          >
                            Publish
                          </button>
                        )}
                        {job.status === 'PUBLISHED' && (
                          <button
                            onClick={() => handleClose(job.id)}
                            className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs font-semibold transition"
                          >
                            Close
                          </button>
                        )}
                        <Link
                          to={`/recruiter/jobs/${job.id}/edit`}
                          className="p-1.5 inline-block text-slate-400 hover:text-slate-700 transition"
                          title="Edit Job"
                        >
                          <Edit3 className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
