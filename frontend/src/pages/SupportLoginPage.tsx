import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { authApi } from '../api/auth.api';
import { useAuth } from '../context/AuthContext';
import brandLogo from '../assets/logo.jpeg';

export const SupportLoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please provide support credentials.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await authApi.login(email.trim(), password);
      if (data.user.role !== 'SUPPORT' && data.user.role !== 'ADMIN') {
        setError('Access denied: You do not have support representative privileges.');
        return;
      }
      login(data.user, data.token);
      navigate('/support');
    } catch (err: any) {
      setError(err?.friendlyMessage || 'Invalid support credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen py-16 px-4 flex items-center justify-center text-slate-800">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-xl p-8 sm:p-10 shadow-sm space-y-6">
        <div className="text-center space-y-2">
          <img
            src={brandLogo}
            alt="Martify Collection"
            className="w-14 h-14 rounded-full object-cover border border-slate-200 shadow-sm mx-auto"
          />
          <h1 className="text-2xl font-bold text-slate-900 tracking-normal">
            Customer Support Login
          </h1>
          <p className="text-xs text-slate-500">
            Sign in with your customer support credentials to manage tickets and fulfillment.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-medium text-slate-700 block mb-1">Customer support email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="support.lead@martifycollection.com"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-sm focus:outline-none focus:border-navy-900"
            />
          </div>

          <div>
            <label className="font-medium text-slate-700 block mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-sm focus:outline-none focus:border-navy-900"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-navy-900 hover:bg-navy-800 text-white font-medium rounded-lg text-xs flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer"
          >
            <span>{loading ? 'Authenticating...' : 'Sign in'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-2 text-center border-t border-slate-100">
          <Link
            to="/"
            className="text-xs text-slate-500 hover:text-navy-900 font-medium transition-colors"
          >
            ← Return to marketplace
          </Link>
        </div>
      </div>
    </div>
  );
};
