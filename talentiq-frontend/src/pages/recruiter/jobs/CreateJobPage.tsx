import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../../components/layout/DashboardLayout';
import api from '../../../api/client';
import { ArrowLeft, Plus, Trash2, Loader2, AlertCircle } from 'lucide-react';

interface Requirement {
  requirement: string;
  required: boolean;
}

interface Skill {
  skillName: string;
  required: boolean;
}

export const CreateJobPage: React.FC = () => {
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [jobType, setJobType] = useState('FULL_TIME');
  const [salaryMin, setSalaryMin] = useState<number | ''>('');
  const [salaryMax, setSalaryMax] = useState<number | ''>('');
  const [salaryCurrency, setSalaryCurrency] = useState('INR');
  const [remote, setRemote] = useState(false);

  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [newReq, setNewReq] = useState('');
  const [skills, setSkills] = useState<Skill[]>([]);
  const [newSkill, setNewSkill] = useState('');
  const [newSkillReq, setNewSkillReq] = useState(true);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddReq = () => {
    if (!newReq.trim()) return;
    setRequirements([...requirements, { requirement: newReq.trim(), required: true }]);
    setNewReq('');
  };

  const handleRemoveReq = (index: number) => {
    setRequirements(requirements.filter((_, i) => i !== index));
  };

  const handleAddSkill = () => {
    if (!newSkill.trim()) return;
    setSkills([...skills, { skillName: newSkill.trim(), required: newSkillReq }]);
    setNewSkill('');
  };

  const handleRemoveSkill = (index: number) => {
    setSkills(skills.filter((_, i) => i !== index));
  };

  const handleSubmit = async (publishImmediate: boolean) => {
    if (!title.trim() || !description.trim() || !location.trim()) {
      setError('Please fill in all mandatory job attributes (title, description, location).');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload = {
        title,
        description,
        location,
        jobType,
        salaryMin: salaryMin === '' ? null : salaryMin,
        salaryMax: salaryMax === '' ? null : salaryMax,
        salaryCurrency,
        remote,
        requirements,
        skills,
      };

      const res = await api.post('/recruiter/jobs', payload);
      const createdId = res.data.id;

      if (publishImmediate) {
        await api.patch(`/recruiter/jobs/${createdId}/publish`);
      }

      navigate('/recruiter/jobs');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save job posting.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout role="RECRUITER">
      <div className="max-w-4xl mx-auto space-y-6">
        <button
          onClick={() => navigate('/recruiter/jobs')}
          className="inline-flex items-center space-x-1.5 text-sm text-slate-500 hover:text-slate-800 transition font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Job Listings</span>
        </button>

        <div>
          <h1 className="text-2xl font-bold text-slate-900">Post a New Job Requisition</h1>
          <p className="text-sm text-slate-500">
            Define requirements, target qualifications, and compensation to begin receiving applicant profiles.
          </p>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center space-x-2 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Job Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Senior Backend Engineer (Java)"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Employment Type *</label>
              <select
                value={jobType}
                onChange={(e) => setJobType(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="FULL_TIME">Full Time</option>
                <option value="PART_TIME">Part Time</option>
                <option value="CONTRACT">Contract</option>
                <option value="INTERNSHIP">Internship</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Primary Location *</label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Bengaluru, India or Remote"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center pt-6">
              <label className="flex items-center space-x-2 cursor-pointer text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={remote}
                  onChange={(e) => setRemote(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Remote position eligible</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Job Description & Responsibilities *</label>
            <textarea
              rows={6}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Outline role responsibilities, team impact, tech stack, and day-to-day workflow..."
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* Compensation */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Salary Minimum</label>
              <input
                type="number"
                value={salaryMin}
                onChange={(e) => setSalaryMin(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="e.g. 1500000"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Salary Maximum</label>
              <input
                type="number"
                value={salaryMax}
                onChange={(e) => setSalaryMax(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="e.g. 2400000"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Currency</label>
              <input
                type="text"
                value={salaryCurrency}
                onChange={(e) => setSalaryCurrency(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Itemized Requirements */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <label className="block text-xs font-semibold text-slate-700 uppercase">Itemized Requirements & Qualifications</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newReq}
                onChange={(e) => setNewReq(e.target.value)}
                placeholder="e.g. 5+ years building distributed Java services with Spring Boot"
                className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddReq}
                className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700 transition flex items-center space-x-1"
              >
                <Plus className="w-4 h-4" />
                <span>Add</span>
              </button>
            </div>

            <div className="space-y-1.5 pt-1">
              {requirements.map((r, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                  <span>{r.requirement}</span>
                  <button type="button" onClick={() => handleRemoveReq(i)} className="text-slate-400 hover:text-rose-600">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Skills Keywords */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <label className="block text-xs font-semibold text-slate-700 uppercase">Target Technical Skills</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                placeholder="e.g. Spring Boot, PostgreSQL, Docker"
                className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <select
                value={newSkillReq ? 'REQUIRED' : 'PREFERRED'}
                onChange={(e) => setNewSkillReq(e.target.value === 'REQUIRED')}
                className="px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
              >
                <option value="REQUIRED">Required</option>
                <option value="PREFERRED">Preferred</option>
              </select>
              <button
                type="button"
                onClick={handleAddSkill}
                className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700 transition flex items-center space-x-1"
              >
                <Plus className="w-4 h-4" />
                <span>Add</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {skills.map((s, i) => (
                <span
                  key={i}
                  className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                    s.required ? 'bg-indigo-100 text-indigo-800 font-semibold' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  <span>{s.skillName}</span>
                  <button type="button" onClick={() => handleRemoveSkill(i)} className="text-slate-400 hover:text-rose-600">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-6 border-t border-slate-200 flex items-center justify-end space-x-3">
            <button
              type="button"
              disabled={saving}
              onClick={() => handleSubmit(false)}
              className="px-5 py-2.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-semibold transition"
            >
              Save as Draft
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => handleSubmit(true)}
              className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition shadow disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Publish Requisition'}
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
