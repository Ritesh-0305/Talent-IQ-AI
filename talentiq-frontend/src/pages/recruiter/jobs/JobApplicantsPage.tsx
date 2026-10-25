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
  Plus
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
  coverLetterText?: string;
  status: string;
  shortlisted: boolean;
  appliedAt: string;
  recruiterNotes: Note[];
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
      alert(err.response?.data?.message || 'Could not toggle shortlist.');
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeNoteModalAppId || !noteText.trim()) return;

    setSavingNote(true);
    try {
      await api.post(`/recruiter/applications/${activeNoteModalAppId}/notes`, {
        noteText: noteText.trim(),
      });
      setNoteText('');
      setActiveNoteModalAppId(null);
      await fetchApplicants();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Could not add note.');
    } finally {
      setSavingNote(false);
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
          <span>Back to Jobs</span>
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Applicants: {jobTitle}</h1>
            <p className="text-sm text-slate-500">
              Review received candidate submissions, change status stages, and record internal evaluations.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs uppercase font-semibold text-slate-500">Filter Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium bg-white"
            >
              <option value="">All Applications</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="REVIEWED">Reviewed</option>
              <option value="SHORTLISTED">Shortlisted</option>
              <option value="INTERVIEWING">Interviewing</option>
              <option value="OFFERED">Offered</option>
              <option value="REJECTED">Rejected</option>
              <option value="WITHDRAWN">Withdrawn</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          </div>
        ) : applicants.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-xl border border-slate-200 shadow-sm">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-800">No applicants found for this position</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
              Once candidates discover and apply to this job opening, their profiles and cover letters will appear here.
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

        {/* Modal for Adding Note */}
        {activeNoteModalAppId && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
              <h3 className="text-base font-bold text-slate-900">Add Confidential Recruiter Note</h3>
              <p className="text-xs text-slate-500">
                This note will be visible to your recruiting team and will never be exposed to the candidate.
              </p>

              <form onSubmit={handleAddNote} className="space-y-4">
                <textarea
                  rows={4}
                  required
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Record interview notes, technical screening feedback, or salary expectations..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />

                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveNoteModalAppId(null);
                      setNoteText('');
                    }}
                    className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingNote}
                    className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold disabled:opacity-50"
                  >
                    {savingNote ? 'Saving...' : 'Save Internal Note'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
