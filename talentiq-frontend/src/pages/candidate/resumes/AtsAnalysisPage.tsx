import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '../../../components/layout/DashboardLayout';
import api from '../../../api/client';
import { 
  Sparkles, 
  Target, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  ArrowRight, 
  Loader2, 
  Info,
  Check
} from 'lucide-react';

interface ResumeVersion {
  id: number;
  versionNumber: number;
  label: string;
  originalFilename: string;
  active: boolean;
}

interface JobSummary {
  id: number;
  title: string;
  companyName: string;
  location: string;
}

interface AtsEvidence {
  category: string;
  finding: string;
  snippet?: string;
}

interface AtsSuggestion {
  section: string;
  issue: string;
  recommendation: string;
}

interface AtsAnalysis {
  id: number;
  resumeVersionId: number;
  jobId?: number;
  jobTitle?: string;
  overallScore: number;
  keywordScore: number;
  formatScore: number;
  completenessScore: number;
  relevanceScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  supportingEvidence: AtsEvidence[];
  suggestions: AtsSuggestion[];
  scoringPolicy: any;
  limitationsNote: string;
  completedAt: string;
}

export const AtsAnalysisPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialVersionId = searchParams.get('versionId');
  const initialJobId = searchParams.get('jobId');

  const [versions, setVersions] = useState<ResumeVersion[]>([]);
  const [jobs, setJobs] = useState<JobSummary[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<string>(initialVersionId || '');
  const [selectedJobId, setSelectedJobId] = useState<string>(initialJobId || '');

  const [loading, setLoading] = useState<boolean>(true);
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [analysis, setAnalysis] = useState<AtsAnalysis | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        setLoading(true);
        const [resVersions, resJobs] = await Promise.all([
          api.get('/resumes/me'),
          api.get('/jobs?size=50')
        ]);

        const versList: ResumeVersion[] = resVersions.data.data || resVersions.data || [];
        setVersions(versList);
        
        // Auto-select active or first version
        if (!selectedVersionId && versList.length > 0) {
          const activeVer = versList.find(v => v.active) || versList[0];
          setSelectedVersionId(String(activeVer.id));
        }

        const jobList: JobSummary[] = resJobs.data?.content || [];
        setJobs(jobList);
      } catch (err: any) {
        console.error('Failed to load metadata:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMetadata();
  }, []);

  const runAnalysis = async () => {
    if (!selectedVersionId) {
      setErrorMsg('Please select a resume version.');
      return;
    }

    try {
      setAnalyzing(true);
      setErrorMsg(null);

      const payload: any = {
        resumeVersionId: Number(selectedVersionId)
      };
      if (selectedJobId) {
        payload.jobId = Number(selectedJobId);
      }

      const res = await api.post('/ats/analyze', payload);
      const data: AtsAnalysis = res.data.data || res.data;
      setAnalysis(data);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to analyze resume ATS score.');
    } finally {
      setAnalyzing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 border-emerald-500 bg-emerald-50';
    if (score >= 60) return 'text-amber-600 border-amber-500 bg-amber-50';
    return 'text-rose-600 border-rose-500 bg-rose-50';
  };

  return (
    <DashboardLayout role="CANDIDATE">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <Sparkles className="w-6 h-6 text-indigo-600" />
            <span>ATS Resume Intelligence</span>
          </h1>
          <p className="text-slate-600 mt-1 text-sm">
            Transparent, documented ATS scoring evaluates format compliance, skill density, experience indicators, and role relevance.
          </p>
        </div>

        {/* Configuration Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Select Resume Version
              </label>
              <select
                value={selectedVersionId}
                disabled={loading}
                onChange={(e) => setSelectedVersionId(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {versions.map((ver) => (
                  <option key={ver.id} value={ver.id}>
                    v{ver.versionNumber}: {ver.label} {ver.active ? '(Active)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Target Requisition (Optional)
              </label>
              <select
                value={selectedJobId}
                onChange={(e) => setSelectedJobId(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">General ATS Benchmark (No specific job)</option>
                {jobs.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.title} — {job.companyName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <button
                onClick={runAnalysis}
                disabled={analyzing || versions.length === 0}
                className="w-full flex items-center justify-center space-x-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium text-sm rounded-lg shadow-sm transition"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Evaluating Pillars...</span>
                  </>
                ) : (
                  <>
                    <Target className="w-4 h-4" />
                    <span>Run ATS Analysis</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {errorMsg}
            </div>
          )}
        </div>

        {/* Results Screen */}
        {analysis && (
          <div className="space-y-6">
            {/* Score Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {/* Overall Score */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col items-center justify-center text-center col-span-1 md:col-span-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Overall Score</span>
                <div className={`w-24 h-24 rounded-full border-4 flex items-center justify-center text-3xl font-black ${getScoreColor(analysis.overallScore)}`}>
                  {analysis.overallScore}
                </div>
                <span className="text-xs text-slate-400 mt-2">Scale: 0 - 100</span>
              </div>

              {/* 4 Pillars Breakdown */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 col-span-1 md:col-span-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex flex-col justify-between">
                  <div className="text-xs text-slate-500 font-medium">Keywords Match (35%)</div>
                  <div className="text-2xl font-bold text-slate-800 my-1">{analysis.keywordScore}</div>
                  <div className="text-[11px] text-slate-400">Skill overlap with role</div>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex flex-col justify-between">
                  <div className="text-xs text-slate-500 font-medium">Structure & Format (20%)</div>
                  <div className="text-2xl font-bold text-slate-800 my-1">{analysis.formatScore}</div>
                  <div className="text-[11px] text-slate-400">Headings, contacts, length</div>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex flex-col justify-between">
                  <div className="text-xs text-slate-500 font-medium">Evidence & Depth (25%)</div>
                  <div className="text-2xl font-bold text-slate-800 my-1">{analysis.completenessScore}</div>
                  <div className="text-[11px] text-slate-400">Metrics, projects, history</div>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex flex-col justify-between">
                  <div className="text-xs text-slate-500 font-medium">Role Relevance (20%)</div>
                  <div className="text-2xl font-bold text-slate-800 my-1">{analysis.relevanceScore}</div>
                  <div className="text-[11px] text-slate-400">Seniority & domain match</div>
                </div>
              </div>
            </div>

            {/* Matched & Missing Skills */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Matched Skills */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-base font-semibold text-slate-900 mb-3 flex items-center space-x-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>Matched Skills ({analysis.matchedSkills.length})</span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {analysis.matchedSkills.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No direct keyword matches detected.</p>
                  ) : (
                    analysis.matchedSkills.map((skill, idx) => (
                      <span key={idx} className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <Check className="w-3 h-3" />
                        <span>{skill}</span>
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* Missing Skills */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-base font-semibold text-slate-900 mb-3 flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  <span>Missing or Unclear Skills ({analysis.missingSkills.length})</span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {analysis.missingSkills.length === 0 ? (
                    <p className="text-xs text-emerald-600 font-medium">Excellent! All required requisition skills are represented.</p>
                  ) : (
                    analysis.missingSkills.map((skill, idx) => (
                      <span key={idx} className="px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
                        {skill}
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Supporting Evidence & Improvement Suggestions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Supporting Evidence */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
                <h3 className="text-base font-semibold text-slate-900 flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  <span>Extracted Supporting Evidence</span>
                </h3>
                <div className="space-y-3">
                  {analysis.supportingEvidence.map((ev, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                      <div className="font-semibold text-slate-800 flex items-center justify-between">
                        <span>{ev.category}</span>
                        <span className="text-[10px] text-indigo-600 font-bold uppercase">Verified</span>
                      </div>
                      <p className="text-slate-600">{ev.finding}</p>
                      {ev.snippet && (
                        <div className="p-1.5 bg-white rounded border border-slate-200 text-slate-500 font-mono text-[11px]">
                          {ev.snippet}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Actionable Improvement Suggestions */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
                <h3 className="text-base font-semibold text-slate-900 flex items-center space-x-2">
                  <ArrowRight className="w-5 h-5 text-indigo-600" />
                  <span>Actionable Improvement Recommendations</span>
                </h3>
                <div className="space-y-3">
                  {analysis.suggestions.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No critical formatting or structural issues flagged.</p>
                  ) : (
                    analysis.suggestions.map((sug, idx) => (
                      <div key={idx} className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-lg text-xs space-y-1">
                        <div className="font-semibold text-indigo-900 flex items-center space-x-2">
                          <span className="px-1.5 py-0.5 rounded bg-indigo-200 text-indigo-800 font-bold text-[10px]">{sug.section}</span>
                          <span>{sug.issue}</span>
                        </div>
                        <p className="text-slate-700 mt-1">{sug.recommendation}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Documented Policy & Limitations Note */}
            <div className="bg-slate-100 rounded-xl p-5 border border-slate-200 text-xs text-slate-600 space-y-2">
              <div className="flex items-center space-x-1.5 font-semibold text-slate-800">
                <Info className="w-4 h-4 text-slate-500" />
                <span>Deterministic Scoring Policy & Audit Note</span>
              </div>
              <p>
                <strong>Mathematical Model:</strong> Overall Score = (0.20 × Format) + (0.35 × Keyword Match) + (0.25 × Evidence Completeness) + (0.20 × Role Relevance).
              </p>
              <p className="text-slate-500 italic">
                {analysis.limitationsNote}
              </p>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
export default AtsAnalysisPage;
