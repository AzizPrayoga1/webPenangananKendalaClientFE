import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { ActivitySquare, RefreshCw, AlertTriangle, Search } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const getToken = () => localStorage.getItem('auth_token');

const ACTION_LABEL = {
  create_user:     { label: 'Buat Akun',           color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  update_user:     { label: 'Edit Pengguna',        color: 'text-blue-700 bg-blue-50 border-blue-200' },
  activate_user:   { label: 'Aktifkan Akun',        color: 'text-green-700 bg-green-50 border-green-200' },
  deactivate_user: { label: 'Nonaktifkan Akun',     color: 'text-red-700 bg-red-50 border-red-200' },
  reset_password:  { label: 'Reset Password',       color: 'text-amber-700 bg-amber-50 border-amber-200' },
};

const formatTime = (ts) => {
  if (!ts) return '-';
  const d = new Date(ts);
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
    + ' ' + d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

const getDetailText = (log) => {
  if (!log.details) return null;
  const d = log.details;
  switch (log.action) {
    case 'create_user':
      return `Role: ${d.role} | Email: ${d.email}`;
    case 'update_user':
      if (d.old && d.new) {
        const changes = [];
        if (d.old.name !== d.new.name) changes.push(`Nama: "${d.old.name}" → "${d.new.name}"`);
        if (d.old.email !== d.new.email) changes.push(`Email: "${d.old.email}" → "${d.new.email}"`);
        if (d.old.role !== d.new.role) changes.push(`Role: "${d.old.role}" → "${d.new.role}"`);
        return changes.length ? changes.join(' | ') : 'Tidak ada perubahan';
      }
      return null;
    case 'reset_password':
      return `Role: ${d.role}`;
    default:
      return null;
  }
};

export const AdminActivityLog = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${API}/admin/activity-logs`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setLogs(res.data);
    } catch {
      setError('Gagal memuat log aktivitas.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const filtered = logs.filter(log => {
    const matchSearch =
      log.admin?.name?.toLowerCase().includes(search.toLowerCase()) ||
      log.target_user?.name?.toLowerCase().includes(search.toLowerCase());
    const matchAction = actionFilter === 'all' || log.action === actionFilter;
    return matchSearch && matchAction;
  });

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ActivitySquare className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-extrabold text-slate-900 font-display tracking-tight">Log Aktivitas Admin</h1>
          </div>
          <p className="text-xs text-slate-500">Seluruh tindakan yang dilakukan oleh administrator sistem</p>
        </div>
        <button
          onClick={fetchLogs}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-primary border border-slate-200 hover:border-primary/30 px-3 py-1.5 rounded-md transition-all cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari nama admin atau target..."
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
          />
        </div>
        <select
          value={actionFilter}
          onChange={e => setActionFilter(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all cursor-pointer"
        >
          <option value="all">Semua Tindakan</option>
          {Object.entries(ACTION_LABEL).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {/* Log Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 flex justify-center">
            <div className="animate-spin rounded-full w-6 h-6 border-2 border-primary border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400">Tidak ada log aktivitas yang sesuai filter.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Waktu</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Admin</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Tindakan</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Target</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(log => {
                const meta = ACTION_LABEL[log.action] ?? { label: log.action, color: 'text-slate-600 bg-slate-100 border-slate-200' };
                const detail = getDetailText(log);
                return (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors align-top">
                    <td className="px-5 py-3.5 text-xs text-slate-400 whitespace-nowrap">{formatTime(log.created_at)}</td>
                    <td className="px-5 py-3.5 font-semibold text-slate-800">{log.admin?.name ?? '—'}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${meta.color}`}>{meta.label}</span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">
                      {log.target_user ? (
                        <span>{log.target_user.name} <span className="text-xs text-slate-400">({log.target_user.role})</span></span>
                      ) : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-500 max-w-xs">{detail ?? '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <p className="text-xs text-slate-400">{filtered.length} entri ditampilkan dari total {logs.length} log.</p>
    </div>
  );
};
