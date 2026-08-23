import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

export const LoginScreen = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (roleEmail) => {
    setError('');
    setLoading(true);
    try {
      await login(roleEmail, 'password');
    } catch (err) {
      setError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas p-6">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-lg p-10 text-left">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold tracking-tight text-primary">
            Ticketing System
          </h2>
          <p className="text-sm text-slate-500 mt-2">
            Penanganan Kendala Client — RBAC Console
          </p>
        </div>

        {error && (
          <div className={`border text-xs p-3.5 rounded-sm mb-6 flex items-start gap-2 ${
            error.toLowerCase().includes('dinonaktifkan')
              ? 'bg-amber-50 border-amber-300 text-amber-800'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}>
            {error.toLowerCase().includes('dinonaktifkan') && <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5" />}
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              className="w-full text-sm border border-slate-300 rounded-sm px-3.5 py-2 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-150"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
              Password
            </label>
            <input
              type="password"
              className="w-full text-sm border border-slate-300 rounded-sm px-3.5 py-2 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-150"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-primary text-white font-bold text-sm rounded-sm hover:bg-primary-hover transition-colors shadow-sm mt-2 cursor-pointer"
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>

          {/* Forgot Password - only relevant for Client accounts */}
          <div className="text-center">
            <Link
              to="/forgot-password"
              className="text-xs text-slate-400 hover:text-primary transition-colors"
            >
              Lupa password akun Client?
            </Link>
          </div>
        </form>

        <div className="relative my-8 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <span className="relative bg-white px-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Demo Access Key
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <button
            onClick={() => handleQuickLogin('servicedesk@example.com')}
            className="border border-slate-200 text-slate-700 font-semibold text-xs py-2 px-3 rounded-sm hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer text-center"
            disabled={loading}
          >
            Service Desk
          </button>
          <button
            onClick={() => handleQuickLogin('pm@example.com')}
            className="border border-slate-200 text-slate-700 font-semibold text-xs py-2 px-3 rounded-sm hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer text-center"
            disabled={loading}
          >
            Project Manager
          </button>
          <button
            onClick={() => handleQuickLogin('programmer@example.com')}
            className="border border-slate-200 text-slate-700 font-semibold text-xs py-2 px-3 rounded-sm hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer text-center"
            disabled={loading}
          >
            Programmer
          </button>
          <button
            onClick={() => handleQuickLogin('owner@example.com')}
            className="border border-slate-200 text-slate-700 font-semibold text-xs py-2 px-3 rounded-sm hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer text-center"
            disabled={loading}
          >
            Owner
          </button>
          <button
            onClick={() => handleQuickLogin('client@example.com')}
            className="border border-slate-200 text-slate-700 font-semibold text-xs py-2 px-3 rounded-sm hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer text-center col-span-2 sm:col-span-1"
            disabled={loading}
          >
            Client
          </button>
          <button
            onClick={() => handleQuickLogin('admin@example.com')}
            className="border border-primary/30 text-primary font-semibold text-xs py-2 px-3 rounded-sm hover:bg-primary/5 hover:border-primary/50 transition-all cursor-pointer text-center col-span-2 sm:col-span-3"
            disabled={loading}
          >
            Admin (RBAC)
          </button>
        </div>
      </div>
    </div>
  );
};
