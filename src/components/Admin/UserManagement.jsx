import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import {
  Users,
  UserPlus,
  Search,
  Edit2,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  ShieldOff,
  ShieldCheck,
  Key,
  Eye,
  EyeOff,
  X,
  Save,
  UserCheck,
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const getToken = () => localStorage.getItem('auth_token');

const ROLE_OPTIONS = [
  { value: 'service_desk',    label: 'Service Desk' },
  { value: 'project_manager', label: 'Project Manager' },
  { value: 'programmer',      label: 'Programmer' },
  { value: 'owner',           label: 'Company Owner' },
  { value: 'client',          label: 'Client (Eksternal)' },
];

const ROLE_BADGE = {
  service_desk:    'bg-sky-100 text-sky-700',
  project_manager: 'bg-violet-100 text-violet-700',
  programmer:      'bg-blue-100 text-blue-700',
  owner:           'bg-amber-100 text-amber-700',
  client:          'bg-emerald-100 text-emerald-700',
  admin:           'bg-slate-200 text-slate-700',
};

const ROLE_LABEL = {
  service_desk:    'Service Desk',
  project_manager: 'Project Manager',
  programmer:      'Programmer',
  owner:           'Company Owner',
  client:          'Client',
  admin:           'Admin',
};

// Reusable toast component
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  const colors = {
    success: 'bg-emerald-50 border-emerald-300 text-emerald-800',
    error:   'bg-red-50 border-red-300 text-red-800',
  };

  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 border rounded-lg shadow-lg text-sm font-medium animate-fade-in ${colors[type]}`}>
      {type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
      <span>{message}</span>
      <button onClick={onClose} className="ml-2 cursor-pointer opacity-60 hover:opacity-100"><X className="w-3.5 h-3.5" /></button>
    </div>
  );
};

// Modal wrapper
const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 relative" onClick={e => e.stopPropagation()}>
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base font-extrabold text-slate-900 font-display">{title}</h3>
        <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"><X className="w-4 h-4" /></button>
      </div>
      {children}
    </div>
  </div>
);

// Form field
const Field = ({ label, error, children }) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-semibold text-slate-600">{label}</label>
    {children}
    {error && <p className="text-xs text-red-600">{error}</p>}
  </div>
);

const inputCls = "w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all";

export const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [toast, setToast] = useState(null);

  // Modals
  const [createModal, setCreateModal]   = useState(false);
  const [editModal, setEditModal]       = useState(null); // user object
  const [resetModal, setResetModal]     = useState(null); // user object
  const [toggleTarget, setToggleTarget] = useState(null); // user object

  const showToast = (message, type = 'success') => setToast({ message, type });
  const closeToast = () => setToast(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/admin/users`, { headers: { Authorization: `Bearer ${getToken()}` } });
      setUsers(res.data);
    } catch {
      showToast('Gagal memuat daftar pengguna.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const filtered = users.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole   = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  // Toggle active/inactive
  const handleToggle = async (user) => {
    try {
      await axios.patch(`${API}/admin/users/${user.id}/toggle-active`, {}, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      showToast(user.is_active ? `Akun ${user.name} berhasil dinonaktifkan.` : `Akun ${user.name} berhasil diaktifkan.`);
      setToggleTarget(null);
      fetchUsers();
    } catch (err) {
      showToast(err?.response?.data?.message || 'Gagal mengubah status akun.', 'error');
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-extrabold text-slate-900 font-display tracking-tight">Manajemen Pengguna</h1>
          </div>
          <p className="text-xs text-slate-500">Kelola seluruh akun pengguna sistem</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchUsers}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-primary border border-slate-200 hover:border-primary/30 px-3 py-1.5 rounded-md transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
          <button
            onClick={() => setCreateModal(true)}
            className="flex items-center gap-1.5 text-xs font-semibold text-white bg-primary hover:bg-primary/90 px-4 py-2 rounded-lg transition-colors shadow-sm cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" /> Buat Akun Baru
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari nama atau email..."
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
          />
        </div>
        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all cursor-pointer"
        >
          <option value="all">Semua Role</option>
          {ROLE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 flex justify-center">
            <div className="animate-spin rounded-full w-6 h-6 border-2 border-primary border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400">Tidak ada pengguna yang sesuai filter.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Nama</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Email</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Role</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Bergabung</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(user => (
                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-3.5 font-semibold text-slate-800">{user.name}</td>
                  <td className="px-5 py-3.5 text-slate-500">{user.email}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${ROLE_BADGE[user.role] || 'bg-slate-100 text-slate-600'}`}>
                      {ROLE_LABEL[user.role] || user.role}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${user.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                      {user.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-400 text-xs">
                    {new Date(user.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-5 py-3.5">
                    {user.role !== 'admin' && (
                      <div className="flex items-center gap-1 justify-end">
                        {/* Edit */}
                        <ActionBtn icon={<Edit2 className="w-3.5 h-3.5" />} title="Edit Pengguna" color="hover:text-blue-600 hover:bg-blue-50" onClick={() => setEditModal(user)} />
                        {/* Reset Password (only for internal staff) */}
                        {user.role !== 'client' && (
                          <ActionBtn icon={<Key className="w-3.5 h-3.5" />} title="Reset Password" color="hover:text-amber-600 hover:bg-amber-50" onClick={() => setResetModal(user)} />
                        )}
                        {/* Toggle Active */}
                        <ActionBtn
                          icon={user.is_active ? <ShieldOff className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                          title={user.is_active ? 'Nonaktifkan Akun' : 'Aktifkan Akun'}
                          color={user.is_active ? 'hover:text-red-600 hover:bg-red-50' : 'hover:text-emerald-600 hover:bg-emerald-50'}
                          onClick={() => setToggleTarget(user)}
                        />
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Summary */}
      <p className="text-xs text-slate-400">{filtered.length} pengguna ditampilkan dari total {users.filter(u => u.role !== 'admin').length} pengguna.</p>

      {/* Modals */}
      {createModal && (
        <CreateUserModal
          onClose={() => setCreateModal(false)}
          onSuccess={() => { setCreateModal(false); fetchUsers(); showToast('Akun baru berhasil dibuat.'); }}
          onError={msg => showToast(msg, 'error')}
        />
      )}
      {editModal && (
        <EditUserModal
          user={editModal}
          onClose={() => setEditModal(null)}
          onSuccess={() => { setEditModal(null); fetchUsers(); showToast('Data pengguna berhasil diperbarui.'); }}
          onError={msg => showToast(msg, 'error')}
        />
      )}
      {resetModal && (
        <ResetPasswordModal
          user={resetModal}
          onClose={() => setResetModal(null)}
          onSuccess={() => { setResetModal(null); showToast(`Password ${resetModal.name} berhasil direset.`); }}
          onError={msg => showToast(msg, 'error')}
        />
      )}
      {toggleTarget && (
        <ConfirmToggleModal
          user={toggleTarget}
          onClose={() => setToggleTarget(null)}
          onConfirm={() => handleToggle(toggleTarget)}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}
    </div>
  );
};

// ─── Action Button ──────────────────────────────────────────────────────────────
const ActionBtn = ({ icon, title, color, onClick }) => (
  <button
    title={title}
    onClick={onClick}
    className={`p-1.5 rounded-md text-slate-400 transition-colors cursor-pointer ${color}`}
  >
    {icon}
  </button>
);

// ─── Create User Modal ──────────────────────────────────────────────────────────
const CreateUserModal = ({ onClose, onSuccess, onError }) => {
  const [form, setForm] = useState({ name: '', email: '', role: 'service_desk', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handle = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    try {
      await axios.post(`${API}/admin/users`, form, { headers: { Authorization: `Bearer ${getToken()}` } });
      onSuccess();
    } catch (err) {
      const errs = err?.response?.data?.errors || {};
      if (Object.keys(errs).length) setErrors(errs);
      else onError(err?.response?.data?.message || 'Gagal membuat akun.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal title="Buat Akun Pengguna Baru" onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field label="Nama Lengkap" error={errors.name?.[0]}>
          <input type="text" value={form.name} onChange={handle('name')} className={inputCls} placeholder="Nama pengguna" required />
        </Field>
        <Field label="Email" error={errors.email?.[0]}>
          <input type="email" value={form.email} onChange={handle('email')} className={inputCls} placeholder="email@perusahaan.com" required />
        </Field>
        <Field label="Role" error={errors.role?.[0]}>
          <select value={form.role} onChange={handle('role')} className={inputCls}>
            {ROLE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </Field>
        <Field label="Password" error={errors.password?.[0]}>
          <div className="relative">
            <input
              type={showPw ? 'text' : 'password'}
              value={form.password}
              onChange={handle('password')}
              className={inputCls + ' pr-10'}
              placeholder="Min. 8 karakter"
              required
            />
            <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer">
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </Field>

        {form.role === 'client' && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 text-xs p-3 rounded-lg">
            <strong>Catatan:</strong> Akun Client dapat mereset password sendiri melalui fitur "Lupa Password" di halaman login.
          </div>
        )}

        <div className="flex gap-3 mt-2 pt-4 border-t border-slate-100">
          <button type="button" onClick={onClose} className="flex-1 border border-slate-200 text-slate-700 py-2 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors cursor-pointer">Batal</button>
          <button type="submit" disabled={submitting} className="flex-1 bg-primary text-white py-2 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2">
            {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
            {submitting ? 'Menyimpan...' : 'Buat Akun'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

// ─── Edit User Modal ────────────────────────────────────────────────────────────
const EditUserModal = ({ user, onClose, onSuccess, onError }) => {
  const [form, setForm] = useState({ name: user.name, email: user.email, role: user.role });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handle = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    try {
      await axios.put(`${API}/admin/users/${user.id}`, form, { headers: { Authorization: `Bearer ${getToken()}` } });
      onSuccess();
    } catch (err) {
      const errs = err?.response?.data?.errors || {};
      if (Object.keys(errs).length) setErrors(errs);
      else onError(err?.response?.data?.message || 'Gagal memperbarui data.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal title={`Edit Pengguna — ${user.name}`} onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field label="Nama Lengkap" error={errors.name?.[0]}>
          <input type="text" value={form.name} onChange={handle('name')} className={inputCls} required />
        </Field>
        <Field label="Email" error={errors.email?.[0]}>
          <input type="email" value={form.email} onChange={handle('email')} className={inputCls} required />
        </Field>
        <Field label="Role" error={errors.role?.[0]}>
          <select value={form.role} onChange={handle('role')} className={inputCls}>
            {ROLE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </Field>
        <div className="flex gap-3 mt-2 pt-4 border-t border-slate-100">
          <button type="button" onClick={onClose} className="flex-1 border border-slate-200 text-slate-700 py-2 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors cursor-pointer">Batal</button>
          <button type="submit" disabled={submitting} className="flex-1 bg-primary text-white py-2 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2">
            {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {submitting ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

// ─── Reset Password Modal ────────────────────────────────────────────────────────
const ResetPasswordModal = ({ user, onClose, onSuccess, onError }) => {
  const [newPassword, setNewPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await axios.post(`${API}/admin/users/${user.id}/reset-password`, { new_password: newPassword }, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      onSuccess();
    } catch (err) {
      setError(err?.response?.data?.errors?.new_password?.[0] || err?.response?.data?.message || 'Gagal mereset password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal title={`Reset Password — ${user.name}`} onClose={onClose}>
      <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs p-3 rounded-lg mb-4">
        <strong>Peringatan:</strong> Password lama akan langsung diganti. Pastikan Anda mengomunikasikan password baru ke pengguna yang bersangkutan.
      </div>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field label="Password Baru" error={error}>
          <div className="relative">
            <input
              type={showPw ? 'text' : 'password'}
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className={inputCls + ' pr-10'}
              placeholder="Min. 8 karakter"
              required
              minLength={8}
            />
            <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer">
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </Field>
        <div className="flex gap-3 mt-2 pt-4 border-t border-slate-100">
          <button type="button" onClick={onClose} className="flex-1 border border-slate-200 text-slate-700 py-2 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors cursor-pointer">Batal</button>
          <button type="submit" disabled={submitting} className="flex-1 bg-amber-500 text-white py-2 rounded-lg text-sm font-semibold hover:bg-amber-600 transition-colors disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2">
            {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
            {submitting ? 'Mereset...' : 'Reset Password'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

// ─── Confirm Toggle Modal ────────────────────────────────────────────────────────
const ConfirmToggleModal = ({ user, onClose, onConfirm }) => {
  const isActive = user.is_active;
  return (
    <Modal title={isActive ? 'Nonaktifkan Akun?' : 'Aktifkan Akun?'} onClose={onClose}>
      <p className="text-sm text-slate-600 mb-6">
        {isActive
          ? `Akun milik <strong>${user.name}</strong> akan dinonaktifkan. Pengguna tidak dapat login hingga akun diaktifkan kembali.`
          : `Akun milik <strong>${user.name}</strong> akan diaktifkan kembali dan pengguna bisa login.`
        }
      </p>
      <div className="flex gap-3">
        <button onClick={onClose} className="flex-1 border border-slate-200 text-slate-700 py-2 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors cursor-pointer">Batal</button>
        <button
          onClick={onConfirm}
          className={`flex-1 text-white py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${isActive ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-500 hover:bg-emerald-600'}`}
        >
          {isActive ? 'Ya, Nonaktifkan' : 'Ya, Aktifkan'}
        </button>
      </div>
    </Modal>
  );
};
