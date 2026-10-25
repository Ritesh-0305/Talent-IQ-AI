import React from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, ArrowRight, CheckCircle2, ShieldCheck, Sparkles, Building, UserCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const LandingPage: React.FC = () => {
  const { isAuthenticated, hasRole } = useAuth();

  const getDashboardLink = () => {
    if (hasRole('ROLE_ADMIN')) return '/admin/dashboard';
    if (hasRole('ROLE_RECRUITER')) return '/recruiter/dashboard';
    return '/candidate/dashboard';
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* Top Navigation */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
              <Briefcase className="w-6 h-6" />
            </div>
            <span className="font-extrabold text-2xl tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
              TalentIQ AI
            </span>
          </div>

          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <Link
                to={getDashboardLink()}
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition shadow-lg shadow-indigo-600/20"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition shadow-lg shadow-indigo-600/20"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 max-w-7xl mx-auto px-6 pt-24 pb-20 flex flex-col items-center text-center">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-indigo-950/80 border border-indigo-800/60 text-indigo-300 text-xs font-semibold mb-8">
          <Sparkles className="w-4 h-4" />
          <span>Enterprise Recruitment & AI-Powered Career Intelligence</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight max-w-4xl leading-tight">
          An Intelligent Hiring and Career Guidance System Using{' '}
          <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
            Artificial Intelligence
          </span>
        </h1>

        <p className="mt-6 text-lg md:text-xl text-slate-400 max-w-2xl leading-relaxed">
          Empowering candidates with resume intelligence and mock preparation while streamlining verified recruiter pipelines and candidate ranking.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
          <Link
            to="/register"
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-8 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-base transition shadow-xl shadow-indigo-600/30"
          >
            <span>Create Candidate or Recruiter Account</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            to="/login"
            className="w-full sm:w-auto px-8 py-4 rounded-xl border border-slate-700 hover:border-slate-600 bg-slate-800/50 text-slate-300 hover:text-white font-semibold text-base transition"
          >
            Sign In to Existing Portal
          </Link>
        </div>

        {/* Feature Highlights Grid */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 w-full text-left">
          <div className="p-8 rounded-2xl bg-slate-800/40 border border-slate-800 backdrop-blur">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-6">
              <UserCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Candidate Intelligence</h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              Comprehensive profile management, ATS-tailored scoring breakdowns, resume version management, and skill-gap recommendations.
            </p>
            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>PDF and DOCX structured parsing</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>AI Mock interview simulations</span>
              </li>
            </ul>
          </div>

          <div className="p-8 rounded-2xl bg-slate-800/40 border border-slate-800 backdrop-blur">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-6">
              <Building className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Recruiter Pipelines</h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              Authorized job publishing, verified company identities, and explainable semantic matching that assists hiring teams without automated bias.
            </p>
            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Explainable candidate ranking</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Anonymized evaluation modes</span>
              </li>
            </ul>
          </div>

          <div className="p-8 rounded-2xl bg-slate-800/40 border border-slate-800 backdrop-blur">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-6">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Enterprise Security</h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              Hardened Spring Security with stateless JWTs, strict RBAC boundaries, Flyway versioned schemas, and non-bypassable ownership checks.
            </p>
            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Secure admin bootstrap provisioning</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Backend-enforced route protection</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8 text-center text-sm text-slate-500">
        <p>© 2026 TalentIQ AI. All rights reserved. Production Architecture & Engineering.</p>
      </footer>
    </div>
  );
};
