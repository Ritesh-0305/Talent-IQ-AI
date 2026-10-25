import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../../components/layout/DashboardLayout';
import api from '../../../api/client';
import { 
  ArrowLeft, 
  Users, 
  Star, 
  MessageSquare, 
  Loader2, 
  Plus,
  FileText,
  Download,
  ShieldCheck
} from 'lucide-react';

interface Note {
  id: number;
  recruiterName: string;
  noteText: string;
  createdAt: string;
}

interface Applicant {
  id: number;
  candidateId: number;
  candidateName: string;
  candidateEmail: string;
  candidateHeadline?: string;
  resumeVersionId?: number;
  resumeFilename?: string;
  coverLetterText?: string;
  status: string;
  shortlisted: boolean;
  appliedAt: string;
  recruiterNotes: Note[];
}

interface ParsedResume {
  resumeVersionId: number;
  parseStatus: string;
  contact: {
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    github?: string;
  };
  skills: string[];
  education: Array<{ institution?: string; degree?: string; year?: string }>;
  experience: Array<{ company?: string; title?: string; start_date?: string; end_date?: string; description?: string }>;
  projects: Array<{ name?: string; description?: string; technologies?: string[] }>;
  certifications: Array<{ name?: string; year?: string }>;
  summary?: string;
}

export const JobApplicantsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [jobTitle, setJobTitle] = useState('Requisition');
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [activeNoteModalAppId, setActiveNoteModalAppId] = useState<number | null>(null);
  const [noteText, setNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  // Resume Review Modal
  const [resumeModalOpen, setResumeModalOpen] = useState(false);
  const [activeApp, setActiveApp] = useState<Applicant | null>(null);
  const [parsedResume, setParsedResume] = useState<ParsedResume | null>(null);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [anonymizedMode, setAnonymizedMode] = useState(false);

  const fetchApplicants = async () => {
    try {
      const [appRes, jobRes] = await Promise.all([
        api.get(`/recruiter/jobs/${id}/applicants`, {
          params: { status: statusFilter || undefined, page: 0, size: 50 },
        }),
        api.get(`/jobs/${id}`),
      ]);
      setApplicants(appRes.data.content || []);
      setJobTitle(jobRes.data.title || 'Requisition');
    } catch {
      setApplicants([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplicants();
  }, [id, statusFilter]);

  const handleStatusChange = async (appId: number, newStatus: string) => {
    try {
      await api.patch(`/recruiter/applications/${appId}/status`, {
        status: newStatus,
        note: `Status updated to ${newStatus} by hiring manager`,
      });
      await fetchApplicants();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Could not update applicant status.');
    }
  };

  const handleToggleShortlist = async (appId: number) => {
    try {
      await api.patch(`/recruiter/applications/${appId}/shortlist`);
      await fetchApplicants();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Could not update shortlist status.');
    }
  };

  const handleSaveNote = async () => {
    if (!activeNoteModalAppId || !noteText.trim()) return;
    try {
      setSavingNote(true);
      await api.post(`/recruiter/applications/${activeNoteModalAppId}/notes`, {
        noteText: noteText.trim(),
      });
      setNoteText('');
      setActiveNoteModalAppId(null);
      await fetchApplicants();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save internal note.');
    } finally {
      setSavingNote(false);
    }
  };

  const openResumeReview = async (app: Applicant, anonymized: boolean) => {
    setActiveApp(app);
    setAnonymizedMode(anonymized);
    setResumeModalOpen(true);
    setResumeLoading(true);

    try {
      const res = await api.get(`/recruiter/applications/${app.id}/resume`, {
        params: { anonymized }
      });
      setParsedResume(res.data.data || res.data);
    } catch (err: any) {
      alert('Failed to load candidate resume: ' + (err.response?.data?.message || err.message));
      setResumeModalOpen(false);
    } finally {
      setResumeLoading(false);
    }
  };

  const toggleAnonymizeInModal = async (enabled: boolean) => {
    if (!activeApp) return;
    setAnonymizedMode(enabled);
    setResumeLoading(true);
    try {
      const res = await api.get(`/recruiter/applications/${activeApp.id}/resume`, {
        params: { anonymized: enabled }
      });
      setParsedResume(res.data.data || res.data);
    } catch (err: any) {
      alert('Error updating view mode: ' + (err.response?.data?.message || err.message));
    } finally {
      setResumeLoading(false);
    }
  };

  const downloadOriginalFile = async (versionId: number, filename: string) => {
    try {
      const res = await api.get(`/resumes/${versionId}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err: any) {
      alert('Failed to download resume document: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <DashboardLayout role="RECRUITER">
      <div className="max-w-6xl mx-auto space-y-6">
        <button
          onClick={() => navigate('/recruiter/jobs')}
          className="inline-flex items-center space-x-1.5 text-sm text-slate-500 hover:text-slate-800 transition font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Requisitions</span>
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Applicants: {jobTitle}
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Review applicant resumes, conduct anonymized unbiased evaluations, and advance candidates through the hiring pipeline.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <span className="text-xs font-semibold uppercase text-slate-400">Filter Stage:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium bg-white text-slate-700 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Stages</option>
              <option value="SUBMITTED">SUBMITTED</option>
              <option value="REVIEWED">REVIEWED</option>
              <option value="SHORTLISTED">SHORTLISTED</option>
              <option value="INTERVIEWING">INTERVIEWING</option>
              <option value="OFFERED">OFFERED</option>
              <option value="REJECTED">REJECTED</option>
              <option value="WITHDRAWN">WITHDRAWN</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-12 flex justify-center items-center text-slate-400 space-x-2">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>Loading candidate applications...</span>
          </div>
        ) : applicants.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-xl border border-slate-200 shadow-sm">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-800">No applicants found for this position</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
              Once candidates discover and apply to this job opening, their profiles and verified resumes will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {applicants.map((app) => (
              <div
                key={app.id}
                className={`bg-white p-6 rounded-xl border transition shadow-sm space-y-4 ${
                  app.shortlisted ? 'border-amber-300 ring-1 ring-amber-300/50' : 'border-slate-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-lg font-bold text-slate-900">{app.candidateName}</h3>
                      <button
                        onClick={() => handleToggleShortlist(app.id)}
                        className={`p-1 rounded transition ${
                          app.shortlisted ? 'text-amber-500 hover:text-amber-600' : 'text-slate-300 hover:text-amber-400'
                        }`}
                        title={app.shortlisted ? 'Remove Shortlist' : 'Add to Shortlist'}
                      >
                        <Star className="w-4 h-4 fill-current" />
                      </button>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {app.candidateHeadline || 'Candidate'} • {app.candidateEmail}
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    {/* Resume Review Action Buttons */}
                    {app.resumeVersionId && (
                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={() => openResumeReview(app, false)}
                          className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-semibold transition border border-indigo-200"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Review Resume</span>
                        </button>
                        <button
                          onClick={() => openResumeReview(app, true)}
                          className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition"
                          title="Review Anonymized (Unbiased Evaluation)"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
                          <span>Blind Review</span>
                        </button>
                      </div>
                    )}

                    <span className="text-xs font-semibold uppercase text-slate-400">Stage:</span>
                    <select
                      value={app.status}
                      disabled={app.status === 'WITHDRAWN'}
                      onChange={(e) => handleStatusChange(app.id, e.target.value)}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="SUBMITTED">SUBMITTED</option>
                      <option value="REVIEWED">REVIEWED</option>
                      <option value="SHORTLISTED">SHORTLISTED</option>
                      <option value="INTERVIEWING">INTERVIEWING</option>
                      <option value="OFFERED">OFFERED</option>
                      <option value="REJECTED">REJECTED</option>
                      {app.status === 'WITHDRAWN' && <option value="WITHDRAWN">WITHDRAWN</option>}
                    </select>

                    <button
                      onClick={() => setActiveNoteModalAppId(app.id)}
                      className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Note</span>
                    </button>
                  </div>
                </div>

                {/* Cover Letter */}
                {app.coverLetterText && (
                  <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-700 space-y-1">
                    <div className="font-semibold uppercase tracking-wider text-slate-400 text-[10px]">Candidate Cover Letter</div>
                    <p className="whitespace-pre-line">{app.coverLetterText}</p>
                  </div>
                )}

                {/* Private Internal Notes */}
                {app.recruiterNotes && app.recruiterNotes.length > 0 && (
                  <div className="space-y-1.5 pt-2">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1">
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Internal Recruiter Notes (Confidential)</span>
                    </div>
                    <div className="space-y-1">
                      {app.recruiterNotes.map((n) => (
                        <div key={n.id} className="p-2.5 rounded-lg bg-amber-50/60 border border-amber-200/60 text-xs text-amber-950">
                          <p className="font-medium">{n.noteText}</p>
                          <div className="text-[10px] text-amber-700 mt-1">
                            By {n.recruiterName} on {new Date(n.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Resume Review Drawer/Modal */}
        {resumeModalOpen && activeApp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center space-x-3">
                    <h3 className="text-lg font-bold text-slate-900">
                      {anonymizedMode ? 'Anonymized Candidate Profile' : activeApp.candidateName}
                    </h3>
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                      anonymizedMode ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-indigo-800'
                    }`}>
                      {anonymizedMode ? 'Unbiased Blind Evaluation' : 'Standard View'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Extracted structure and skills verified by TalentIQ AI parsing engine.
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => toggleAnonymizeInModal(!anonymizedMode)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 transition"
                  >
                    {anonymizedMode ? 'Reveal Identity' : 'Anonymize'}
                  </button>
                  <button
                    onClick={() => setResumeModalOpen(false)}
                    className="text-slate-400 hover:text-slate-600 font-bold px-2 py-1"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {resumeLoading ? (
                <div className="py-16 flex justify-center items-center text-slate-400 space-x-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Loading candidate resume...</span>
                </div>
              ) : parsedResume ? (
                <div className="space-y-6">
                  {/* Contact Credentials */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 font-medium block">Candidate Name:</span>
                      <span className="font-semibold text-slate-800">{parsedResume.contact?.name || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium block">Email:</span>
                      <span className="font-semibold text-slate-800">{parsedResume.contact?.email || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium block">Location:</span>
                      <span className="font-semibold text-slate-800">{parsedResume.contact?.location || 'Undisclosed'}</span>
                    </div>
                  </div>

                  {/* Summary */}
                  {parsedResume.summary && (
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Professional Summary</h4>
                      <p className="text-xs text-slate-600 bg-white p-3 rounded-lg border border-slate-200 leading-relaxed">
                        {parsedResume.summary}
                      </p>
                    </div>
                  )}

                  {/* Skills Bank */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Verified Technical Skills ({parsedResume.skills?.length || 0})</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {parsedResume.skills?.map((s, idx) => (
                        <span key={idx} className="px-2.5 py-1 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Work Experience */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Professional Experience ({parsedResume.experience?.length || 0})</h4>
                    <div className="space-y-3">
                      {parsedResume.experience?.map((exp, idx) => (
                        <div key={idx} className="p-3.5 bg-white rounded-lg border border-slate-200 text-xs space-y-1">
                          <div className="flex items-center justify-between font-semibold text-slate-900">
                            <span>{exp.title}</span>
                            <span className="text-slate-400 text-[11px] font-normal">{exp.start_date || 'N/A'} - {exp.end_date || 'Present'}</span>
                          </div>
                          <div className="text-slate-600 font-medium">{exp.company}</div>
                          {exp.description && (
                            <p className="text-slate-500 whitespace-pre-line mt-1.5 pt-1.5 border-t border-slate-100">
                              {exp.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Education */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Academic History ({parsedResume.education?.length || 0})</h4>
                    <div className="space-y-2">
                      {parsedResume.education?.map((edu, idx) => (
                        <div key={idx} className="p-3 bg-white rounded-lg border border-slate-200 text-xs flex items-center justify-between">
                          <div>
                            <span className="font-semibold text-slate-900">{edu.institution}</span>
                            <span className="text-slate-500 ml-2">— {edu.degree}</span>
                          </div>
                          <span className="text-slate-400 text-[11px]">{edu.year || 'Graduated'}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Document Download & Footer */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    {!anonymizedMode && activeApp.resumeVersionId && activeApp.resumeFilename && (
                      <button
                        onClick={() => downloadOriginalFile(activeApp.resumeVersionId!, activeApp.resumeFilename!)}
                        className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Original Document ({activeApp.resumeFilename})</span>
                      </button>
                    )}
                    <button
                      onClick={() => setResumeModalOpen(false)}
                      className="ml-auto px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700"
                    >
                      Close Review
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* Modal for Adding Note */}
        {activeNoteModalAppId && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
              <h3 className="text-base font-bold text-slate-900">Add Confidential Recruiter Note</h3>
              <p className="text-xs text-slate-500">
                This note will be visible to your recruiting team and will never be exposed to the candidate.
              </p>
              <textarea
                rows={3}
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Candidate interview feedback, technical ratings, or evaluation notes..."
                className="w-full text-xs p-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => {
                    setActiveNoteModalAppId(null);
                    setNoteText('');
                  }}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveNote}
                  disabled={savingNote || !noteText.trim()}
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold shadow"
                >
                  {savingNote ? 'Saving...' : 'Save Note'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
export default JobApplicantsPage;
