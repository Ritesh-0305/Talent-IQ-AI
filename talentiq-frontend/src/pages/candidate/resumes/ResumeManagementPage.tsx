import React, { useEffect, useState, useRef } from 'react';
import { DashboardLayout } from '../../../components/layout/DashboardLayout';
import api from '../../../api/client';
import { 
  FileText, 
  UploadCloud, 
  CheckCircle2, 
  Trash2, 
  Download, 
  Edit3, 
  Sparkles, 
  Loader2, 
  AlertCircle,
  FileCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface ResumeVersion {
  id: number;
  resumeId: number;
  versionNumber: number;
  label: string;
  originalFilename: string;
  fileSizeBytes: number;
  mimeType: string;
  active: boolean;
  uploadTimestamp: string;
  parseStatus: string;
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

export const ResumeManagementPage: React.FC = () => {
  const [versions, setVersions] = useState<ResumeVersion[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Selected file state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [versionLabel, setVersionLabel] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parsed Resume Inspection / Edit Modal
  const [inspectModalOpen, setInspectModalOpen] = useState<boolean>(false);
  const [inspectingVersionId, setInspectingVersionId] = useState<number | null>(null);
  const [parsedData, setParsedData] = useState<ParsedResume | null>(null);
  const [inspectLoading, setInspectLoading] = useState<boolean>(false);
  const [savingEdits, setSavingEdits] = useState<boolean>(false);

  // Edit fields
  const [editName, setEditName] = useState<string>('');
  const [editEmail, setEditEmail] = useState<string>('');
  const [editPhone, setEditPhone] = useState<string>('');
  const [editSkillsStr, setEditSkillsStr] = useState<string>('');
  const [editSummary, setEditSummary] = useState<string>('');

  const fetchResumes = async () => {
    try {
      setLoading(true);
      const res = await api.get('/resumes/me');
      setVersions(res.data.data || res.data || []);
    } catch (err: any) {
      console.error('Failed to load resumes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResumes();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext !== 'pdf' && ext !== 'docx') {
        setUploadError('Only .pdf and .docx documents are supported.');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setUploadError('File exceeds 10MB maximum limit.');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    try {
      setUploading(true);
      setUploadError(null);
      setSuccessMsg(null);

      const formData = new FormData();
      formData.append('file', selectedFile);
      if (versionLabel.trim()) {
        formData.append('label', versionLabel.trim());
      }

      await api.post('/resumes/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setSuccessMsg('Resume uploaded and parsed successfully!');
      setSelectedFile(null);
      setVersionLabel('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      await fetchResumes();
    } catch (err: any) {
      setUploadError(err.response?.data?.message || 'Upload failed. Ensure file is a valid PDF or DOCX document.');
    } finally {
      setUploading(false);
    }
  };

  const handleSetActive = async (versionId: number) => {
    try {
      await api.patch(`/resumes/${versionId}/set-active`);
      await fetchResumes();
    } catch (err: any) {
      alert('Failed to set active version: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDelete = async (versionId: number) => {
    if (!window.confirm('Are you sure you want to delete this resume version?')) return;
    try {
      await api.delete(`/resumes/${versionId}`);
      await fetchResumes();
    } catch (err: any) {
      alert('Failed to delete version: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDownload = async (versionId: number, filename: string) => {
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
      alert('Failed to download file: ' + (err.response?.data?.message || err.message));
    }
  };

  const openInspectModal = async (versionId: number) => {
    setInspectingVersionId(versionId);
    setInspectModalOpen(true);
    setInspectLoading(true);
    try {
      const res = await api.get(`/resumes/${versionId}/parsed`);
      const parsed: ParsedResume = res.data.data || res.data;
      setParsedData(parsed);
      setEditName(parsed.contact?.name || '');
      setEditEmail(parsed.contact?.email || '');
      setEditPhone(parsed.contact?.phone || '');
      setEditSkillsStr((parsed.skills || []).join(', '));
      setEditSummary(parsed.summary || '');
    } catch (err: any) {
      alert('Failed to load parsed resume data: ' + (err.response?.data?.message || err.message));
      setInspectModalOpen(false);
    } finally {
      setInspectLoading(false);
    }
  };

  const handleSaveEdits = async () => {
    if (!inspectingVersionId || !parsedData) return;
    try {
      setSavingEdits(true);
      const skillList = editSkillsStr.split(',').map(s => s.trim()).filter(Boolean);
      const updatedContact = {
        ...parsedData.contact,
        name: editName,
        email: editEmail,
        phone: editPhone
      };

      const payload = {
        contact: updatedContact,
        skills: skillList,
        education: parsedData.education,
        experience: parsedData.experience,
        projects: parsedData.projects,
        certifications: parsedData.certifications,
        summary: editSummary
      };

      await api.put(`/resumes/${inspectingVersionId}/parsed`, payload);
      alert('Parsed fields updated successfully!');
      setInspectModalOpen(false);
      await fetchResumes();
    } catch (err: any) {
      alert('Failed to update parsed fields: ' + (err.response?.data?.message || err.message));
    } finally {
      setSavingEdits(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <DashboardLayout role="CANDIDATE">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Resume Intelligence & Management</h1>
          <p className="text-slate-600 mt-1 text-sm">
            Upload PDF or DOCX resumes. Our AI parser extracts structured experience and verifies ATS compatibility.
          </p>
        </div>

        {/* Upload Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-base font-semibold text-slate-800 mb-4 flex items-center space-x-2">
            <UploadCloud className="w-5 h-5 text-indigo-600" />
            <span>Upload New Resume Version</span>
          </h2>

          <form onSubmit={handleUpload} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  Resume Document (PDF or DOCX, max 10MB)
                </label>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  accept=".pdf,.docx"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer border border-slate-300 rounded-lg p-1.5"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  Version Label (Optional)
                </label>
                <input 
                  type="text" 
                  value={versionLabel}
                  onChange={(e) => setVersionLabel(e.target.value)}
                  placeholder="e.g., Senior Backend 2026, Cloud Architect"
                  className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {uploadError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700 flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!selectedFile || uploading}
                className="flex items-center space-x-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium text-sm rounded-lg shadow-sm transition"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Extracting & Parsing...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4" />
                    <span>Upload & Process Resume</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Resume Versions List */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-800 flex items-center space-x-2">
              <FileCheck className="w-5 h-5 text-indigo-600" />
              <span>Resume Version History ({versions.length})</span>
            </h2>
          </div>

          {loading ? (
            <div className="py-12 flex justify-center items-center text-slate-400 space-x-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Loading resume history...</span>
            </div>
          ) : versions.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl">
              <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-700">No resumes uploaded yet</p>
              <p className="text-xs text-slate-400 mt-1">Upload a PDF or DOCX file above to begin ATS scoring and intelligent applications.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="text-xs font-semibold text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Version / Label</th>
                    <th className="px-4 py-3">Filename & Size</th>
                    <th className="px-4 py-3">Upload Date</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Active</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {versions.map((ver) => (
                    <tr key={ver.id} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-3 font-medium text-slate-900">
                        <div className="flex items-center space-x-2">
                          <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                          <span>v{ver.versionNumber}: {ver.label}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>{ver.originalFilename}</div>
                        <div className="text-xs text-slate-400">{formatFileSize(ver.fileSizeBytes)}</div>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {new Date(ver.uploadTimestamp).toLocaleDateString()} {new Date(ver.uploadTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          ver.parseStatus === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          ver.parseStatus === 'LOW_TEXT_WARNING' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                          {ver.parseStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {ver.active ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Active</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => handleSetActive(ver.id)}
                            className="text-xs text-slate-500 hover:text-indigo-600 font-medium hover:underline"
                          >
                            Set Active
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => openInspectModal(ver.id)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition"
                            title="Inspect & Edit Parsed Information"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <Link
                            to={`/candidate/ats?versionId=${ver.id}`}
                            className="p-1.5 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition"
                            title="View ATS Score Analysis"
                          >
                            <Sparkles className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDownload(ver.id, ver.originalFilename)}
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                            title="Download Original File"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(ver.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Delete Version"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Inspect / Edit Parsed Resume Modal */}
        {inspectModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
            <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-xl border border-slate-200 p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Extracted Resume Profile</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Review and verify fields extracted by PyMuPDF / python-docx. You can correct any inaccurate information.
                  </p>
                </div>
                <button
                  onClick={() => setInspectModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
                >
                  ✕ Close
                </button>
              </div>

              {inspectLoading ? (
                <div className="py-16 flex justify-center items-center text-slate-400 space-x-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Loading parsed resume...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name</label>
                      <input 
                        type="text" 
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Email</label>
                      <input 
                        type="email" 
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Phone</label>
                      <input 
                        type="text" 
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Technical Skills (comma-separated)
                    </label>
                    <textarea 
                      rows={3}
                      value={editSkillsStr}
                      onChange={(e) => setEditSkillsStr(e.target.value)}
                      className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Professional Summary
                    </label>
                    <textarea 
                      rows={3}
                      value={editSummary}
                      onChange={(e) => setEditSummary(e.target.value)}
                      className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Read-only Experience & Education Extracted */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Experience Extracted ({parsedData?.experience?.length || 0})</h4>
                    <div className="space-y-2">
                      {parsedData?.experience?.map((exp, idx) => (
                        <div key={idx} className="bg-white p-3 rounded-lg border border-slate-200 text-xs">
                          <span className="font-semibold text-slate-800">{exp.title}</span> at <span className="font-medium text-slate-600">{exp.company}</span>
                          <span className="text-slate-400 ml-2">({exp.start_date || 'N/A'} - {exp.end_date || 'Present'})</span>
                        </div>
                      ))}
                    </div>

                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 pt-2">Education Extracted ({parsedData?.education?.length || 0})</h4>
                    <div className="space-y-2">
                      {parsedData?.education?.map((edu, idx) => (
                        <div key={idx} className="bg-white p-3 rounded-lg border border-slate-200 text-xs">
                          <span className="font-semibold text-slate-800">{edu.institution}</span> — {edu.degree} <span className="text-slate-400">({edu.year || 'Graduated'})</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                    <button
                      onClick={() => setInspectModalOpen(false)}
                      className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveEdits}
                      disabled={savingEdits}
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition"
                    >
                      {savingEdits ? 'Saving...' : 'Save & Update Parsed Profile'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
export default ResumeManagementPage;
