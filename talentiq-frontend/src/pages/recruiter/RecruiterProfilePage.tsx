import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import api from '../../api/client';
import { Loader2, CheckCircle2, AlertCircle, Building2 } from 'lucide-react';

interface Company {
  id?: number;
  name: string;
  description: string;
  website: string;
  industry: string;
  sizeRange: string;
  logoUrl: string;
  verified: boolean;
}

interface RecruiterForm {
  firstName: string;
  lastName: string;
  title: string;
  phone: string;
  company: Company;
}

export const RecruiterProfilePage: React.FC = () => {
  const [form, setForm] = useState<RecruiterForm>({
    firstName: '',
    lastName: '',
    title: '',
    phone: '',
    company: {
      name: '',
      description: '',
      website: '',
      industry: '',
      sizeRange: '',
      logoUrl: '',
      verified: false,
    },
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/recruiter/me');
        setForm({
          firstName: response.data.firstName || '',
          lastName: response.data.lastName || '',
          title: response.data.title || '',
          phone: response.data.phone || '',
          company: response.data.company || {
            name: '',
            description: '',
            website: '',
            industry: '',
            sizeRange: '',
            logoUrl: '',
            verified: false,
          },
        });
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load recruiter profile.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    setError(null);

    try {
      await api.put('/recruiter/me', form);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update recruiter information.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout role="RECRUITER">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Recruiter & Company Profile</h1>
          <p className="text-sm text-slate-500">
            Configure your professional recruiter credentials and company information for candidate-facing job postings.
          </p>
        </div>

        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm space-y-6">
            {success && (
              <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center space-x-2 text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>Recruiter and Company details saved successfully!</span>
              </div>
            )}

            {error && (
              <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 flex items-center space-x-2 text-sm">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Personal Details */}
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-200">
              Personal Representative Details
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">First Name *</label>
                <input
                  type="text"
                  required
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Last Name *</label>
                <input
                  type="text"
                  required
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Professional Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Senior Technical Recruiter"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Direct Phone</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+1 (555) 012-3456"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Company Details */}
            <div className="pt-4 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                  <Building2 className="w-4 h-4 text-indigo-600" />
                  <span>Company Organization Details</span>
                </h2>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                  form.company.verified ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {form.company.verified ? 'Verified Employer' : 'Pending Verification'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Company Legal Name *</label>
                  <input
                    type="text"
                    required
                    value={form.company.name}
                    onChange={(e) => setForm({
                      ...form,
                      company: { ...form.company, name: e.target.value }
                    })}
                    placeholder="Acme Technologies Inc."
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Official Website</label>
                  <input
                    type="url"
                    value={form.company.website}
                    onChange={(e) => setForm({
                      ...form,
                      company: { ...form.company, website: e.target.value }
                    })}
                    placeholder="https://acme.com"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Company Overview</label>
                <textarea
                  rows={3}
                  value={form.company.description}
                  onChange={(e) => setForm({
                    ...form,
                    company: { ...form.company, description: e.target.value }
                  })}
                  placeholder="Overview of company mission, engineering culture, and products..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Industry Sector</label>
                  <input
                    type="text"
                    value={form.company.industry}
                    onChange={(e) => setForm({
                      ...form,
                      company: { ...form.company, industry: e.target.value }
                    })}
                    placeholder="e.g. Cloud Computing / AI / Fintech"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Company Headcount Size</label>
                  <input
                    type="text"
                    value={form.company.sizeRange}
                    onChange={(e) => setForm({
                      ...form,
                      company: { ...form.company, sizeRange: e.target.value }
                    })}
                    placeholder="e.g. 50-250 employees"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-200 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition shadow disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Profile Changes'}
              </button>
            </div>
          </form>
        )}
      </div>
    </DashboardLayout>
  );
};
