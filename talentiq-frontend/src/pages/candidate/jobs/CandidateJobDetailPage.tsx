import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { DashboardLayout } from '../../../components/layout/DashboardLayout';
import api from '../../../api/client';
import { 
  Building2, 
  MapPin, 
  CheckCircle2, 
  Send, 
  Loader2, 
  AlertCircle, 
  ArrowLeft,
  Sparkles
} from 'lucide-react';

interface ResumeOption {
  id: number;
  versionNumber: number;
  label: string;
  originalFilename: string;
  active: boolean;
}

interface JobRequirement {
  id: number;
  requirement: string;
  required: boolean;
}

interface JobSkill {
  id: number;
  skillName: string;
  required: boolean;
}

interface JobDetail {
  id: number;
  title: string;
  companyName: string;
  description: string;
  location: string;
  jobType: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  remote: boolean;
  requirements: JobRequirement[];
  skills: JobSkill[];
}

export const CandidateJobDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [coverLetter, setCoverLetter] = useState<string>('');
  const [applying, setApplying] = useState<boolean>(false);
  const [applied, setApplied] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [resumes, setResumes] = useState<ResumeOption[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<number | null>(null);

  useEffect(() => {
    const fetchJobAndResumes = async () => {
      try {
        setLoading(true);
        const [jobRes, resumesRes] = await Promise.all([
          api.get(`/jobs/${id}`),
          api.get('/resumes/me')
        ]);
        setJob(jobRes.data);

        const resumeList: ResumeOption[] = resumesRes.data.data || resumesRes.data || [];
        setResumes(resumeList);
        const activeVer = resumeList.find(r => r.active) || resumeList[0];
        if (activeVer) {
          setSelectedResumeId(activeVer.id);
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Job posting not found.');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchJobAndResumes();
  }, [id]);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setApplying(true);
    setError(null);

    try {
      await api.post(`/candidates/jobs/${id}/apply`, { 
        coverLetter,
        resumeVersionId: selectedResumeId
      });
      setApplied(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Could not submit application.');
    } finally {
      setApplying(false);
    }
  };

  return (
    <DashboardLayout role="CANDIDATE">
      <div className="max-w-4xl mx-auto space-y-6">
        <button
          onClick={() => navigate('/candidate/jobs')}
          className="inline-flex items-center space-x-1.5 text-sm text-slate-500 hover:text-slate-800 transition font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Jobs</span>
        </button>

        {loading ? (
          <div className="p-12 flex justify-center items-center text-slate-400 space-x-2">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>Loading requisition details...</span>
          </div>
        ) : error && !job ? (
          <div className="p-6 bg-red-50 border border-red-200 text-red-800 rounded-xl text-center">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <h3 className="font-semibold text-lg">Error Loading Job</h3>
            <p className="text-sm mt-1">{error}</p>
          </div>
        ) : job ? (
          <div className="space-y-6">
            {/* Header Card */}
            <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-100">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">{job.title}</h1>
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-slate-600">
                    <span className="flex items-center space-x-1 font-medium text-slate-800">
                      <Building2 className="w-4 h-4 text-slate-400" />
                      <span>{job.companyName}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      <span>{job.location}</span>
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800">
                      {job.jobType.replace('_', ' ')}
                    </span>
                    {job.remote && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                        Remote
                      </span>
                    )}
                  </div>
                </div>

                {(job.salaryMin || job.salaryMax) && (
                  <div className="text-right">
                    <div className="text-xs uppercase font-semibold text-slate-400">Compensation</div>
                    <div className="text-lg font-bold text-slate-900">
                      {job.salaryCurrency} {job.salaryMin?.toLocaleString()} - {job.salaryMax?.toLocaleString()}
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">Role Overview</h3>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{job.description}</p>
              </div>

              {/* Requirements & Skills */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 mb-3">Core Requirements</h3>
                  <ul className="space-y-2">
                    {job.requirements?.map((req) => (
                      <li key={req.id} className="text-sm text-slate-600 flex items-start space-x-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{req.requirement}</span>
                      </li>
                    ))}
                    {(!job.requirements || job.requirements.length === 0) && (
                      <li className="text-xs text-slate-400 italic">No specific itemized requirements specified.</li>
                    )}
                  </ul>
                </div>

                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 mb-3">Required & Preferred Skills</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {job.skills?.map((s) => (
                      <span
                        key={s.id}
                        className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                          s.required ? 'bg-indigo-100 text-indigo-800 font-semibold' : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {s.skillName} {s.required ? '(Required)' : '(Preferred)'}
                      </span>
                    ))}
                    {(!job.skills || job.skills.length === 0) && (
                      <span className="text-xs text-slate-400 italic">No specific skill keywords listed.</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Application & ATS Pre-Check Form */}
            <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900">Apply for this Position</h3>
                {selectedResumeId && (
                  <Link
                    to={`/candidate/ats?jobId=${job.id}&versionId=${selectedResumeId}`}
                    className="inline-flex items-center space-x-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-200 transition"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Run ATS Pre-Check</span>
                  </Link>
                )}
              </div>
              
              {applied ? (
                <div className="p-6 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-center space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                  <h4 className="font-bold text-lg">Application Submitted Successfully!</h4>
                  <p className="text-sm text-emerald-700">
                    Your profile and credentials have been forwarded to {job.companyName}'s recruiting team.
                  </p>
                  <div className="pt-2">
                    <button
                      onClick={() => navigate('/candidate/applications')}
                      className="px-4 py-2 rounded-lg bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800 transition"
                    >
                      Track in Application History
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleApply} className="space-y-4">
                  {error && (
                    <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-sm flex items-center space-x-2">
                      <AlertCircle className="w-5 h-5 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  {/* Resume Selector */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                      Attach Resume Document
                    </label>
                    {resumes.length === 0 ? (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center justify-between">
                        <span>No resume uploaded yet.</span>
                        <Link to="/candidate/resumes" className="font-semibold text-indigo-600 underline">
                          Upload Resume First
                        </Link>
                      </div>
                    ) : (
                      <select
                        value={selectedResumeId || ''}
                        onChange={(e) => setSelectedResumeId(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      >
                        {resumes.map((r) => (
                          <option key={r.id} value={r.id}>
                            v{r.versionNumber}: {r.label} ({r.originalFilename}) {r.active ? '— Active' : ''}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                      Cover Letter / Note to Hiring Team (Optional)
                    </label>
                    <textarea
                      rows={4}
                      value={coverLetter}
                      onChange={(e) => setCoverLetter(e.target.value)}
                      placeholder="Explain why you are an exceptional fit for this role and highlight relevant engineering accomplishments..."
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={applying || resumes.length === 0}
                      className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition shadow disabled:opacity-50"
                    >
                      {applying ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                        <>
                          <span>Submit Application</span>
                          <Send className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </DashboardLayout>
  );
};
export default CandidateJobDetailPage;
