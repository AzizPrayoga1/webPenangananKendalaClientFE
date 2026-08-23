import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { KeyRound, Eye, EyeOff, CheckCircle2, AlertTriangle, ArrowLeft } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get('token') || '';
  const emailFromUrl = searchParams.get('email') || '';

  const [email, setEmail] = useState(emailFromUrl);
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState({});
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    setErrorMsg('');

    try {
      await axios.post(`${API}/reset-password`, {
        token,
        email,
        password,
        password_confirmation: passwordConfirmation,
      });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      const errs = err?.response?.data?.errors || {};
      if (Object.keys(errs).length) {
        setErrors(errs);
      } else {
        setErrorMsg(err?.response?.data?.message || 'Link reset tidak valid atau sudah kedaluwarsa. Minta link baru.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-extrabold text-slate-900 font-display tracking-tight">
            <span className="text-primary">Ticketing</span>Flow
          </h1>
          <p className="text-xs text-slate-400 mt-1">Sistem Manajemen Tiket</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-7">
          {success ? (
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-14 h-14 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-900 font-display mb-1">Password Berhasil Direset</h2>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Password Anda telah diperbarui. Anda akan diarahkan ke halaman login dalam beberapa detik.
                </p>
              </div>
              <Link to="/login" className="text-sm text-primary hover:underline flex items-center gap-1">
                <ArrowLeft className="w-3.5 h-3.5" /> Login Sekarang
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-1">
                  <KeyRound className="w-4 h-4 text-primary" />
                  <h2 className="text-base font-extrabold text-slate-900 font-display">Buat Password Baru</h2>
                </div>
                <p className="text-xs text-slate-500">Masukkan password baru untuk akun Anda.</p>
              </div>

              {errorMsg && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-lg flex items-start gap-2 mb-4">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {/* Email (pre-filled but editable in case URL is wrong) */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-600">Email Akun</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    required
                  />
                  {errors.email && <p className="text-xs text-red-600">{errors.email[0]}</p>}
                </div>

                {/* New Password */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-600">Password Baru</label>
                  <div className="relative">
                    <input
                      type={showPw ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Min. 8 karakter"
                      className="w-full border border-slate-200 rounded-lg px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-red-600">{errors.password[0]}</p>}
                </div>

                {/* Confirm Password */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-600">Konfirmasi Password Baru</label>
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={passwordConfirmation}
                    onChange={e => setPasswordConfirmation(e.target.value)}
                    placeholder="Ulangi password baru"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-primary text-white py-2.5 rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer mt-1"
                >
                  {submitting ? (
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <KeyRound className="w-4 h-4" />
                  )}
                  {submitting ? 'Menyimpan...' : 'Simpan Password Baru'}
                </button>
              </form>

              <div className="mt-5 pt-4 border-t border-slate-100 text-center">
                <Link to="/forgot-password" className="text-xs text-slate-500 hover:text-primary">
                  Minta link reset baru
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
