import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Users,
  UserCheck,
  UserX,
  Ticket,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Shield,
  ActivitySquare,
  RefreshCw,
  ArrowRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const getToken = () => localStorage.getItem('auth_token');

const ROLE_LABEL = {
  service_desk:    'Service Desk',
  project_manager: 'Project Manager',
  programmer:      'Programmer',
  owner:           'Company Owner',
  client:          'Client',
};

const ACTION_LABEL = {
  create_user:    { label: 'Buat Akun',          color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  update_user:    { label: 'Edit Pengguna',       color: 'text-blue-600 bg-blue-50 border-blue-200' },
  activate_user:  { label: 'Aktifkan Akun',       color: 'text-green-600 bg-green-50 border-green-200' },
  deactivate_user:{ label: 'Nonaktifkan Akun',    color: 'text-red-600 bg-red-50 border-red-200' },
  reset_password: { label: 'Reset Password',      color: 'text-amber-600 bg-amber-50 border-amber-200' },
};

const STATUS_TICKET_LABEL = {
  open:              { label: 'Open',              color: 'text-sky-600 bg-sky-50' },
  in_progress:       { label: 'In Progress',       color: 'text-blue-600 bg-blue-50' },
  resolved:          { label: 'Resolved',          color: 'text-emerald-600 bg-emerald-50' },
  closed:            { label: 'Closed',            color: 'text-slate-600 bg-slate-100' },
  rejected:          { label: 'Rejected',          color: 'text-red-600 bg-red-50' },
  escalated_to_owner:{ label: 'Eskalasi ke Owner', color: 'text-purple-600 bg-purple-50' },
  escalated_to_pm:   { label: 'Eskalasi ke PM',    color: 'text-orange-600 bg-orange-50' },
};

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [statsRes, logsRes] = await Promise.all([
        axios.get(`${API}/admin/stats`, { headers: { Authorization: `Bearer ${getToken()}` } }),
        axios.get(`${API}/admin/activity-logs`, { headers: { Authorization: `Bearer ${getToken()}` } }),
      ]);
      setStats(statsRes.data);
      setLogs(logsRes.data.slice(0, 10)); // show latest 10 on dashboard
    } catch {
      setError('Gagal memuat data admin. Coba refresh halaman.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const formatTime = (ts) => {
    if (!ts) return '-';
    const d = new Date(ts);
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
      + ' ' + d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  const totalTickets = stats ? Object.values(stats.tickets).reduce((a, b) => a + Number(b), 0) : 0;
  const activeTickets = stats ? (Number(stats.tickets?.open || 0) + Number(stats.tickets?.in_progress || 0)) : 0;

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-extrabold text-slate-900 font-display tracking-tight">Admin Dashboard</h1>
          </div>
          <p className="text-xs text-slate-500">Ringkasan statistik sistem & riwayat aktivitas terbaru</p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-primary border border-slate-200 hover:border-primary/30 px-3 py-1.5 rounded-md transition-all cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-xl p-5 animate-pulse">
              <div className="h-3 bg-slate-100 rounded w-2/3 mb-3" />
              <div className="h-7 bg-slate-100 rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Stats Cards — Users */}
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Pengguna Sistem</p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="Total Pengguna"
                value={stats?.users?.total ?? 0}
                icon={<Users className="w-5 h-5" />}
                color="text-blue-600 bg-blue-50"
              />
              <StatCard
                label="Akun Nonaktif"
                value={stats?.users?.inactive ?? 0}
                icon={<UserX className="w-5 h-5" />}
                color="text-red-600 bg-red-50"
              />
              <StatCard
                label="Total Tiket"
                value={totalTickets}
                icon={<Ticket className="w-5 h-5" />}
                color="text-violet-600 bg-violet-50"
              />
              <StatCard
                label="Tiket Aktif"
                value={activeTickets}
                icon={<Clock className="w-5 h-5" />}
                color="text-amber-600 bg-amber-50"
              />
            </div>
          </div>

          {/* Breakdown: Users per Role */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Distribusi Pengguna per Role</p>
              <div className="flex flex-col gap-2">
                {Object.entries(ROLE_LABEL).map(([role, label]) => {
                  const roleData = stats?.users?.by_role?.[role];
                  const total = roleData?.total ?? 0;
                  const active = roleData?.active ?? 0;
                  return (
                    <div key={role} className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0">
                      <span className="text-sm text-slate-700 font-medium">{label}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-400">{active} aktif</span>
                        <span className="text-sm font-bold text-slate-900 w-5 text-right">{total}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Ticket status breakdown */}
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Status Tiket</p>
              {Object.keys(stats?.tickets ?? {}).length === 0 ? (
                <p className="text-xs text-slate-400 italic">Belum ada data tiket.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {Object.entries(stats?.tickets ?? {}).map(([status, count]) => {
                    const meta = STATUS_TICKET_LABEL[status] ?? { label: status, color: 'text-slate-600 bg-slate-100' };
                    return (
                      <div key={status} className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${meta.color}`}>{meta.label}</span>
                        <span className="text-sm font-bold text-slate-900">{count}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity Log */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Aktivitas Terbaru</p>
              <button
                onClick={() => navigate('/admin/activity-logs')}
                className="text-xs text-primary hover:underline flex items-center gap-1 cursor-pointer"
              >
                Lihat semua <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            {logs.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Belum ada aktivitas tercatat.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {logs.map((log) => {
                  const meta = ACTION_LABEL[log.action] ?? { label: log.action, color: 'text-slate-600 bg-slate-50 border-slate-200' };
                  return (
                    <div key={log.id} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
                      <ActivitySquare className="w-4 h-4 text-slate-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${meta.color}`}>{meta.label}</span>
                          <span className="text-xs text-slate-700 font-medium truncate">
                            {log.admin?.name ?? 'Admin'}
                            {log.target_user && ` → ${log.target_user.name}`}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0">{formatTime(log.created_at)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

const StatCard = ({ label, value, icon, color }) => (
  <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-start justify-between gap-3">
    <div>
      <p className="text-xs text-slate-500 mb-1 font-medium">{label}</p>
      <p className="text-2xl font-extrabold text-slate-900 font-display">{value}</p>
    </div>
    <div className={`p-2 rounded-lg ${color}`}>{icon}</div>
  </div>
);
