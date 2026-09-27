import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  UploadCloud,
  FileCheck,
  X,
} from 'lucide-react';
import { authApi } from '../api/auth.api';
import { sellerApi } from '../api/seller.api';
import { useAuth } from '../context/AuthContext';
import brandLogo from '../assets/logo.jpeg';

export const SellerRegisterPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [verificationFiles, setVerificationFiles] = useState<File[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setVerificationFiles((prev) => [...prev, ...newFiles]);
      // Reset input so same file can be selected again if needed
      e.target.value = '';
    }
  };

  const handleRemoveFile = (index: number) => {
    setVerificationFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !phone.trim() || !password.trim()) {
      setError('All registration fields are required.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // 1. Register Seller
      setUploadProgress('Creating merchant account...');
      const authData = await authApi.register({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
      });

      // Save token in localStorage so subsequent sellerApi calls are authorized
      localStorage.setItem('token', authData.token);
      localStorage.setItem('user', JSON.stringify(authData.user));

      // 2. Upload Verification Documents if provided
      if (verificationFiles.length > 0) {
        setUploadProgress(
          `Uploading ${verificationFiles.length} verification document${
            verificationFiles.length > 1 ? 's' : ''
          }...`
        );
        try {
          const uploadRes = await sellerApi.uploadKycDocument(verificationFiles);
          const urls = uploadRes.urls && uploadRes.urls.length > 0 ? uploadRes.urls : [uploadRes.url];
          await sellerApi.submitKyc(urls);
          authData.user.kycDocumentUrl = urls.length > 1 ? JSON.stringify(urls) : urls[0];
          authData.user.kycStatus = 'PENDING';
        } catch (docErr: any) {
          console.warn('Verification document upload note:', docErr);
        }
      }

      login(authData.user, authData.token);
      navigate('/seller/dashboard');
    } catch (err: any) {
      setError(err?.friendlyMessage || 'Registration failed. Please check your details.');
    } finally {
      setLoading(false);
      setUploadProgress(null);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen py-16 px-4 flex items-center justify-center text-navy-900">
      <div className="max-w-lg w-full bg-white border border-slate-200 rounded-2xl p-8 sm:p-10 shadow-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <img
            src={brandLogo}
            alt="Martify Collection"
            className="w-16 h-16 rounded-full object-cover border border-slate-200 shadow-sm mx-auto"
          />
          <span className="text-xs font-black uppercase tracking-widest text-accent-orange block pt-1">
            JOIN THE MERCHANT NETWORK
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-navy-900 tracking-tight">
            BECOME A VERIFIED SELLER
          </h1>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            List your own products or clone from our verified wholesale catalog.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs font-bold text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Store / Business Name */}
          <div>
            <label className="text-xs font-bold text-navy-900 uppercase tracking-wider block mb-1">
              Store or Business Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Apex Modern Goods"
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-navy-900 font-medium"
            />
          </div>

          {/* Email */}
          <div>
            <label className="text-xs font-bold text-navy-900 uppercase tracking-wider block mb-1">
              Business Email *
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

          {/* Phone */}
          <div>
            <label className="text-xs font-bold text-navy-900 uppercase tracking-wider block mb-1">
              Contact Phone Number *
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (555) 019-2834"
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-navy-900 font-medium"
            />
          </div>

          {/* Password */}
          <div>
            <label className="text-xs font-bold text-navy-900 uppercase tracking-wider block mb-1">
              Password *
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-navy-900 font-medium"
            />
          </div>

          {/* Document Verification Upload */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-navy-900 uppercase tracking-wider block">
                Document Verification (ID / Business License)
              </label>
              {verificationFiles.length > 0 && (
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  {verificationFiles.length} file{verificationFiles.length > 1 ? 's' : ''} selected
                </span>
              )}
            </div>

            <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center hover:border-navy-900 transition-colors bg-slate-50 cursor-pointer relative">
              <input
                type="file"
                multiple
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="space-y-1">
                <UploadCloud className="w-6 h-6 text-slate-400 mx-auto" />
                <span className="text-xs font-bold text-navy-900 block">
                  Click or drag & drop to add verification documents
                </span>
                <span className="text-[10px] text-slate-400 block">
                  Select multiple files (PNG, JPG, or PDF max 5MB each)
                </span>
              </div>
            </div>

            {verificationFiles.length > 0 && (
              <div className="mt-3 space-y-1.5">
                {verificationFiles.map((file, idx) => (
                  <div
                    key={`${file.name}-${idx}`}
                    className="flex items-center justify-between gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-semibold text-slate-800 truncate max-w-[240px]">
                        {file.name}
                      </span>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        ({(file.size / 1024).toFixed(0)} KB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(idx)}
                      className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Remove file"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed">
              Upload multiple images or documents (e.g. ID Front & Back, Passport, Trade License). Required for account verification.
            </p>
          </div>

          {/* Progress / Submit */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-lg bg-navy-900 hover:bg-navy-800 text-white text-xs font-black tracking-widest uppercase transition-all duration-300 shadow-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span className="text-xs font-bold">{uploadProgress || 'Processing...'}</span>
              ) : (
                <>
                  <span>REGISTER AS SELLER</span>
                  <ArrowRight className="w-4 h-4 text-accent-orange" />
                </>
              )}
            </button>
          </div>
        </form>

        <div className="pt-4 border-t border-slate-200 text-center text-xs text-slate-500">
          Already registered as a merchant?{' '}
          <Link to="/seller/login" className="font-bold text-navy-900 hover:text-accent-orange underline">
            Seller Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
