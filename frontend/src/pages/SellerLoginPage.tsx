import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, AlertCircle } from 'lucide-react';
import { authApi } from '../api/auth.api';
import { useAuth } from '../context/AuthContext';
import brandLogo from '../assets/logo.jpeg';

export const SellerLoginPage: React.FC = () => {
  const { login, logout } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await authApi.login(email.trim(), password, 'SELLER');

      // Strict role check: only SELLER is permitted in Merchant Portal
      if (data.user.role !== 'SELLER') {
        logout();
        setError('Access denied: Please use the Support or Admin portal to sign in.');
        return;
      }

      login(data.user, data.token);

      // Clean navigation to seller dashboard (which presents approved or pending status screen)
      navigate('/seller/dashboard');
    } catch (err: any) {
      // Preserve form field inputs on error — do NOT reset or substitute demo values
      setError(
        err?.friendlyMessage ||
        err?.message ||
        'Invalid email or password. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen py-16 px-4 flex items-center justify-center text-navy-900">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-8 sm:p-10 shadow-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <img
            src={brandLogo}
            alt="Martify Collection"
            className="w-16 h-16 rounded-full object-cover border border-slate-200 shadow-sm mx-auto"
          />
          <span className="text-xs font-black uppercase tracking-widest text-accent-orange block pt-1">
            MERCHANT PORTAL
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-navy-900 tracking-tight">
            SELLER SIGN IN
          </h1>
          <p className="text-xs text-slate-500">
            Access your inventory, wholesale stock, and customer orders.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-navy-900 uppercase tracking-wider block mb-1">
              Registered Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seller@example.com"
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-navy-900 font-medium"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-navy-900 uppercase tracking-wider block mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-navy-900 font-medium"
            />
          </div>

          <div className="pt-2 space-y-3">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-lg bg-navy-900 hover:bg-navy-800 text-white text-xs font-black tracking-widest uppercase transition-all duration-300 shadow-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>SIGN IN TO DASHBOARD</span>
                  <ArrowRight className="w-4 h-4 text-accent-orange" />
                </>
              )}
            </button>

            {/* Exact backend error message surfaced directly below the button */}
            {error && (
              <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs font-bold text-red-600 flex items-start gap-2 animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
          </div>
        </form>

        <div className="pt-4 border-t border-slate-200 flex flex-col gap-2 text-center text-xs text-slate-500">
          <div>
            Don't have a seller account yet?{' '}
            <Link to="/seller/register" className="font-bold text-navy-900 hover:text-accent-orange underline">
              Apply to Sell
            </Link>
          </div>
          <div className="flex justify-center gap-4 text-[11px] text-slate-400 pt-1">
            <Link to="/admin/login" className="hover:text-navy-900">Admin Portal</Link>
            <span>•</span>
            <Link to="/support/login" className="hover:text-navy-900">Customer Support Portal</Link>
          </div>
        </div>
      </div>
    </div>
  );
};
