import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../../components/layout/DashboardLayout';
import api from '../../../api/client';
import { Search, MapPin, Briefcase, Building2, ExternalLink, Loader2, DollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Job {
  id: number;
  title: string;
  companyName: string;
  location: string;
  jobType: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  remote: boolean;
  publishedAt: string;
  skills: { id: number; skillName: string; required: boolean }[];
}

export const JobBrowsePage: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [location, setLocation] = useState('');
  const [isRemote, setIsRemote] = useState<boolean | undefined>(undefined);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const params: any = { page: 0, size: 20 };
      if (keyword.trim()) params.keyword = keyword.trim();
      if (location.trim()) params.location = location.trim();
      if (isRemote !== undefined) params.isRemote = isRemote;

      const res = await api.get('/jobs', { params });
      setJobs(res.data.content || []);
    } catch {
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchJobs();
  };

  return (
    <DashboardLayout role="CANDIDATE">
      <div className="space-y-6 max-w-6xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Discover Opportunities</h1>
          <p className="text-sm text-slate-500">
            Search verified enterprise positions and filter by technical skills, location, and remote availability.
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Search by job title, skills (e.g. Java, Spring Boot), or company..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="w-full md:w-64 relative">
            <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Location..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center space-x-2 px-3">
            <label className="text-xs text-slate-600 flex items-center space-x-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={isRemote === true}
                onChange={(e) => setIsRemote(e.target.checked ? true : undefined)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="font-medium">Remote only</span>
            </label>
          </div>

          <button
            type="submit"
            className="px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition shrink-0"
          >
            Search Jobs
          </button>
        </form>

        {/* Jobs List */}
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          </div>
        ) : jobs.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-xl border border-slate-200 shadow-sm">
            <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-800">No published positions match your query</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
              Try adjusting your search keywords, location filters, or remove remote restrictions.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-indigo-300 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-lg font-bold text-slate-900">{job.title}</h3>
                    {job.remote && (
                      <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800">
                        Remote
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                      {job.jobType.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center space-x-1 font-semibold text-slate-700">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>{job.companyName}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{job.location}</span>
                    </span>
                    {(job.salaryMin || job.salaryMax) && (
                      <span className="flex items-center space-x-0.5 text-indigo-700 font-medium">
                        <DollarSign className="w-3.5 h-3.5" />
                        <span>
                          {job.salaryCurrency} {job.salaryMin?.toLocaleString()} - {job.salaryMax?.toLocaleString()}
                        </span>
                      </span>
                    )}
                  </div>

                  {job.skills && job.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {job.skills.map((s) => (
                        <span key={s.id} className="text-xs px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-medium">
                          {s.skillName}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <Link
                  to={`/candidate/jobs/${job.id}`}
                  className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm transition shrink-0"
                >
                  <span>View & Apply</span>
                  <ExternalLink className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
