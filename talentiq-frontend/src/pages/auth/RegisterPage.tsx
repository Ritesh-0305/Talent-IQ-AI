import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import { Briefcase, AlertCircle, Loader2, User, Building2 } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const [role, setRole] = useState<'CANDIDATE' | 'RECRUITER'>('CANDIDATE');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');

  // Candidate specifics
  const [headline, setHeadline] = useState('');
  const [location, setLocation] = useState('');

  // Recruiter specifics
  const [title, setTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [companyIndustry, setCompanyIndustry] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let endpoint = '';
      let payload = {};

      if (role === 'CANDIDATE') {
        endpoint = '/auth/register/candidate';
        payload = {
          email,
          password,
          firstName,
          lastName,
          phone,
          headline,
          location,
        };
      } else {
        endpoint = '/auth/register/recruiter';
        payload = {
          email,
          password,
          firstName,
          lastName,
          phone,
          title,
          companyName,
          companyWebsite,
          companyIndustry,
        };
      }

      const response = await api.post(endpoint, payload);
      login(response.data);

      if (role === 'CANDIDATE') {
        navigate('/candidate/dashboard');
      } else {
        navigate('/recruiter/dashboard');
      }
    } catch (err: any) {
      if (err.response?.data?.details && typeof err.response.data.details === 'object') {
        const details = err.response.data.details as Record<string, string>;
        const messages = Object.values(details);
        setError(messages.join(' • '));
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.code === 'ERR_NETWORK' || !err.response) {
        setError('Cannot connect to backend server. Please verify the backend is running on port 8088.');
      } else {
        setError('Registration could not be completed. Please check your information and password criteria.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center">
        <Link to="/" className="inline-flex items-center space-x-2 text-2xl font-bold text-white mb-2">
          <Briefcase className="w-8 h-8 text-indigo-500" />
          <span>TalentIQ AI</span>
        </Link>
        <h2 className="text-xl font-semibold text-slate-300">Create your enterprise account</h2>
        <p className="mt-1 text-sm text-slate-400">
          Already registered?{' '}
          <Link to="/login" className="font-medium text-indigo-400 hover:text-indigo-300">
            Sign in
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-slate-800 py-8 px-6 shadow-xl rounded-2xl border border-slate-700 sm:px-10">
          {/* Role Selection Tabs */}
          <div className="grid grid-cols-2 gap-3 mb-6 p-1 bg-slate-900 rounded-xl">
            <button
              type="button"
              onClick={() => setRole('CANDIDATE')}
              className={`flex items-center justify-center space-x-2 py-2.5 rounded-lg text-sm font-semibold transition ${
                role === 'CANDIDATE'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Candidate</span>
            </button>
            <button
              type="button"
              onClick={() => setRole('RECRUITER')}
              className={`flex items-center justify-center space-x-2 py-2.5 rounded-lg text-sm font-semibold transition ${
                role === 'RECRUITER'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Recruiter</span>
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-start space-x-3 text-rose-400 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300">First Name *</label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300">Last Name *</label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300">Email Address *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="mt-1 w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300">Password * (min 8 chars, 1 uppercase, 1 digit, 1 special)</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="mt-1 w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="mt-1 w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Candidate Fields */}
            {role === 'CANDIDATE' && (
              <div className="space-y-4 pt-2 border-t border-slate-700/60">
                <div>
                  <label className="block text-xs font-medium text-slate-300">Professional Headline</label>
                  <input
                    type="text"
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    placeholder="e.g. Senior Full-Stack Engineer"
                    className="mt-1 w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300">Location</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. San Francisco, CA or Remote"
                    className="mt-1 w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            )}

            {/* Recruiter Fields */}
            {role === 'RECRUITER' && (
              <div className="space-y-4 pt-2 border-t border-slate-700/60">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300">Job Title</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Head of Talent Acquisition"
                      className="mt-1 w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300">Company Name *</label>
                    <input
                      type="text"
                      required
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Acme Corp"
                      className="mt-1 w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300">Company Website</label>
                    <input
                      type="url"
                      value={companyWebsite}
                      onChange={(e) => setCompanyWebsite(e.target.value)}
                      placeholder="https://example.com"
                      className="mt-1 w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300">Industry</label>
                    <input
                      type="text"
                      value={companyIndustry}
                      onChange={(e) => setCompanyIndustry(e.target.value)}
                      placeholder="Technology / Finance"
                      className="mt-1 w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : `Register as ${role === 'CANDIDATE' ? 'Candidate' : 'Recruiter'}`}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
