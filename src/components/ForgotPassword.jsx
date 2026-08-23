import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Mail, ArrowLeft, Send, CheckCircle2, AlertTriangle } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await axios.post(`${API}/forgot-password`, { email });
      setSent(true);
    } catch (err) {
      setError(err?.response?.data?.message || 'Terjadi kesalahan. Coba beberapa saat lagi.');
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
          {sent ? (
            /* Success state */
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-14 h-14 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-900 font-display mb-1">Email Terkirim</h2>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Jika email <strong>{email}</strong> terdaftar sebagai akun Client, kami telah mengirimkan link reset password.
                  Periksa kotak masuk atau folder spam Anda.
                </p>
              </div>
              <p className="text-xs text-slate-400">Link akan kedaluwarsa dalam <strong>60 menit</strong>.</p>
              <Link to="/login" className="text-sm text-primary hover:underline flex items-center gap-1 mt-2">
                <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Login
              </Link>
            </div>
          ) : (
            /* Form state */
            <>
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-1">
                  <Mail className="w-4 h-4 text-primary" />
                  <h2 className="text-base font-extrabold text-slate-900 font-display">Lupa Password</h2>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Masukkan email akun Client Anda. Kami akan mengirimkan link untuk membuat password baru.
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-lg flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-600">Alamat Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="email@anda.com"
                    required
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-primary text-white py-2.5 rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {submitting ? (
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  {submitting ? 'Mengirim...' : 'Kirim Link Reset'}
                </button>
              </form>

              <div className="mt-5 pt-4 border-t border-slate-100 text-center">
                <Link to="/login" className="text-xs text-slate-500 hover:text-primary flex items-center justify-center gap-1">
                  <ArrowLeft className="w-3 h-3" /> Kembali ke Login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
