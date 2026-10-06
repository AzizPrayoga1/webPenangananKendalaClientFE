import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import axios from 'axios';
import {
  ArrowLeft,
  User,
  Clock,
  Calendar,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  FileDown,
  Copy,
  Check,
  Lock,
  Crown,
  XCircle,
  MessageSquare,
  RotateCcw,
  AlertTriangle,
  Phone,
  MapPin,
  Smartphone,
  Mail,
  UserCircle,
  CheckCircle2,
  CheckCheck,
  X,
} from 'lucide-react';
import { SkeletonTicketDetail } from './SkeletonLoader';

export const TicketDetail = () => {
  const { ticketId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState('');

  // PM States
  const [programmers, setProgrammers] = useState([]);
  const [selectedProgrammerId, setSelectedProgrammerId] = useState('');
  const [estimatedHours, setEstimatedHours] = useState('');
  const [estimatedUnit, setEstimatedUnit] = useState('hours'); // 'hours' | 'days'
  const [assignPriority, setAssignPriority] = useState('');

  // PM Priority Update States (can be done anytime while not closed)
  const [priorityUpdateValue, setPriorityUpdateValue] = useState('');
  const [priorityUpdateNotes, setPriorityUpdateNotes] = useState('');

  // SD Confirmation States
  const [confirmNotes, setConfirmNotes] = useState('');

  // Form action status states
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Escalation Modal States
  const [isEscalateModalOpen, setIsEscalateModalOpen] = useState(false);
  const [escalateNotes, setEscalateNotes] = useState('');
  const [escalatePriority, setEscalatePriority] = useState('belum_ditentukan');
  const [escalateCategory, setEscalateCategory] = useState('Software');

  // PM Review & Owner Escalation States
  const [pmReviewNotes, setPmReviewNotes] = useState('');
  const [isOwnerModalOpen, setIsOwnerModalOpen] = useState(false);
  const [ownerEscalationNotes, setOwnerEscalationNotes] = useState('');
  const [ownerDecisionNotes, setOwnerDecisionNotes] = useState('');
  const [isOwnerDecisionModalOpen, setIsOwnerDecisionModalOpen] = useState(false);
  const [ownerDecisionType, setOwnerDecisionType] = useState('approved'); // 'approved' | 'resolved' | 'returned_to_pm' | 'rejected'

  // Action note states (For Programmer or Service Desk updates)
  const [actionNote, setActionNote] = useState('');
  const [newLogNotes, setNewLogNotes] = useState('');

  // SD Self-Resolve / Close states
  const [sdCloseNote, setSdCloseNote] = useState('');
  const [showSdCloseForm, setShowSdCloseForm] = useState(false);

  const handlePmReviewSubmit = async (decision) => {
    setActionError('');
    setActionSuccess('');

    if (!pmReviewNotes.trim()) {
      setActionError('Harap berikan catatan evaluasi untuk keputusan review.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await axios.post(`/tickets/${ticket.ticket_id || ticket.id}/pm-review`, {
        decision,
        notes: pmReviewNotes
      });
      setPmReviewNotes('');
      setActionSuccess(res.data.message);
      await fetchTicket();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Gagal menyimpan review PM.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEscalateOwnerSubmit = async (e) => {
    if (e) e.preventDefault();
    setActionError('');
    setActionSuccess('');

    if (!ownerEscalationNotes.trim()) {
      setActionError('Harap isi catatan eskalasi untuk Owner.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await axios.post(`/tickets/${ticket.ticket_id || ticket.id}/escalate-owner`, {
        notes: ownerEscalationNotes
      });
      setIsOwnerModalOpen(false);
      setOwnerEscalationNotes('');
      setActionSuccess(res.data.message);
      await fetchTicket();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Gagal menyerahkan tiket ke Owner.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmTicket = async (action) => {
    setActionError('');
    setActionSuccess('');
    if (!confirmNotes.trim()) {
      setActionError('Harap berikan catatan untuk ' + (action === 'confirm' ? 'konfirmasi' : 'penolakan') + ' tiket.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await axios.post(`/tickets/${ticket.ticket_id}/confirm`, {
        action,
        notes: confirmNotes,
      });
      setConfirmNotes('');
      setActionSuccess(res.data.message);
      await fetchTicket();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Gagal memproses konfirmasi tiket.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePriorityUpdate = async () => {
    setActionError('');
    setActionSuccess('');
    if (!priorityUpdateValue) {
      setActionError('Pilih prioritas yang akan diset.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await axios.post(`/tickets/${ticket.ticket_id}/priority`, {
        priority: priorityUpdateValue,
        notes: priorityUpdateNotes,
      });
      setPriorityUpdateNotes('');
      setActionSuccess(res.data.message);
      await fetchTicket();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Gagal memperbarui prioritas.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOwnerDecisionSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setActionError('');
    setActionSuccess('');

    if (!ownerDecisionNotes.trim()) {
      setActionError('Harap berikan catatan instruksi/keputusan Owner.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await axios.post(`/tickets/${ticket.ticket_id || ticket.id}/owner-decision`, {
        decision: ownerDecisionType,
        notes: ownerDecisionNotes
      });
      setOwnerDecisionNotes('');
      setActionSuccess(res.data.message);
      setIsOwnerDecisionModalOpen(false);
      await fetchTicket();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Gagal menyimpan keputusan Owner.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopy = (idStr) => {
    navigator.clipboard.writeText(idStr);
    setCopiedId(idStr);
    setTimeout(() => setCopiedId(''), 2000);
  };

  const fetchTicket = useCallback(async () => {
    try {
      const response = await axios.get(`/tickets/${ticketId}`);
      setTicket(response.data);
      setEscalatePriority(response.data.priority || 'belum_ditentukan');
      setEscalateCategory(response.data.category || 'Software');
    } catch (err) {
      console.error("Failed to load ticket details", err);
      setError(err.response?.data?.message || 'Gagal memuat detail tiket.');
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  const fetchProgrammers = useCallback(async () => {
    if (user?.role === 'project_manager') {
      try {
        const response = await axios.get('/programmers');
        setProgrammers(response.data);
      } catch (err) {
        console.error('Failed to load developers list', err);
      }
    }
  }, [user?.role]);

  useEffect(() => {
    if (user?.role === 'client') return;
    fetchTicket();
  }, [fetchTicket, user?.role]);

  useEffect(() => {
    if (user?.role === 'client') return;
    if (ticket && user) {
      fetchProgrammers();
    }
  }, [ticket, user, fetchProgrammers]);

  const handleAssign = async (e) => {
    e.preventDefault();
    setActionError('');
    setActionSuccess('');

    if (!selectedProgrammerId || !estimatedHours) {
      setActionError('Pilih programmer dan isi estimasi pengerjaan terlebih dahulu.');
      return;
    }
    setSubmitting(true);
    try {
      await axios.post(`/tickets/${ticket.ticket_id}/assign`, {
        programmer_id: selectedProgrammerId,
        estimated_hours: parseFloat(estimatedHours),
        estimated_unit: estimatedUnit,
        ...(assignPriority ? { priority: assignPriority } : {}),
      });
      setSelectedProgrammerId('');
      setEstimatedHours('');
      setEstimatedUnit('hours');
      setAssignPriority('');
      setActionSuccess('Berhasil menugaskan programmer.');
      await fetchTicket();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Gagal menugaskan programmer.');
    } finally {
      setSubmitting(false);
    }
  };


  const handleStatusUpdate = async (newStatus) => {
    setActionError('');
    setActionSuccess('');

    if (!actionNote.trim()) {
      setActionError('Harap berikan catatan penjelasan untuk pembaruan status.');
      return;
    }
    setSubmitting(true);
    try {
      await axios.post(`/tickets/${ticket.ticket_id}/status`, {
        status: newStatus,
        notes: actionNote
      });
      setActionNote('');
      setActionSuccess('Status tiket berhasil diperbarui.');
      await fetchTicket();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Gagal memperbarui status.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddLogSubmit = async (isInternalTarget) => {
    setActionError('');
    setActionSuccess('');

    if (!newLogNotes.trim()) {
      setActionError('Harap tuliskan isi pesan atau catatan.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await axios.post(`/tickets/${ticket.ticket_id || ticket.id}/logs`, {
        notes: newLogNotes,
        is_internal: isInternalTarget
      });
      setNewLogNotes('');
      setActionSuccess(res.data.message || 'Catatan berhasil ditambahkan.');
      await fetchTicket();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Gagal menambahkan catatan.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEscalate = async (e) => {
    e.preventDefault();
    setActionError('');
    setActionSuccess('');

    if (!escalateNotes.trim()) {
      setActionError('Harap berikan catatan penjelasan untuk eskalasi.');
      return;
    }
    setSubmitting(true);
    try {
      await axios.patch(`/tickets/${ticket.ticket_id}/escalate`, {
        internal_notes: escalateNotes,
        priority: escalatePriority,
        category: escalateCategory
      });
      setIsEscalateModalOpen(false);
      setEscalateNotes('');
      setActionSuccess('Tiket berhasil dieskalasikan ke PM.');
      await fetchTicket();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Gagal melakukan eskalasi tiket.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSdSelfClose = async (e) => {
    e.preventDefault();
    if (!sdCloseNote.trim()) return;
    setSubmitting(true);
    setActionError('');
    setActionSuccess('');
    try {
      await axios.post(`/tickets/${ticket.ticket_id || ticket.id}/status`, {
        status: 'closed',
        notes: '[SELF_RESOLVED] Tiket ditutup oleh Service Desk — masalah terselesaikan tanpa eskalasi. Alasan: ' + sdCloseNote.trim(),
        is_internal: true,
      });
      setSdCloseNote('');
      setShowSdCloseForm(false);
      setActionSuccess('Tiket berhasil ditutup.');
      await fetchTicket();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Gagal menutup tiket.');
    } finally {
      setSubmitting(false);
    }
  };

  const getPriorityBadge = (priority) => {
    const p = priority?.toLowerCase();
    switch (p) {
      case 'low': return 'bg-blue-50 text-blue-700 border border-blue-100';
      case 'medium': return 'bg-amber-50 text-amber-700 border border-amber-100';
      case 'high': return 'bg-red-50 text-red-700 border border-red-100';
      case 'belum_ditentukan': default:
        return 'bg-slate-100 text-slate-600 border border-slate-200';
    }
  };

  const formatPriorityText = (priority) => {
    if (!priority || priority === 'belum_ditentukan') return 'Belum Ditentukan';
    return `${priority.toUpperCase()} PRIORITY`;
  };

  const getStatusBadge = (status) => {
    const s = status?.toLowerCase();
    switch (s) {
      case 'open': return 'bg-sky-50 text-sky-700 border border-sky-100';
      case 'escalated_to_pm': return 'bg-indigo-50 text-indigo-700 border border-indigo-100';
      case 'waiting_programmer': return 'bg-cyan-50 text-cyan-700 border border-cyan-100';
      case 'waiting_pm_approval': return 'bg-amber-50 text-amber-700 border border-amber-100';
      case 'escalated_to_owner': return 'bg-rose-50 text-rose-700 border border-rose-100';
      case 'assigned': return 'bg-purple-50 text-purple-700 border border-purple-100';
      case 'in_progress': case 'in progress': return 'bg-amber-50 text-amber-700 border border-amber-100';
      case 'pending_confirmation': return 'bg-slate-100 text-slate-600 border border-slate-200';
      case 'pending_review': return 'bg-orange-50 text-orange-700 border border-orange-200';
      case 'resolved': return 'bg-emerald-50 text-emerald-700 border border-emerald-100';
      case 'closed': return 'bg-slate-100 text-slate-600 border border-slate-200';
      case 'rejected': return 'bg-red-50 text-red-700 border border-red-100';
      default: return 'bg-slate-50 text-slate-700 border border-slate-100';
    }
  };

  // Security Redirect: If user is Client, redirect to public Client view
  if (user?.role === 'client') {
    return <Navigate to={`/client/tickets/${ticketId}`} replace />;
  }

  if (loading) {
    return <SkeletonTicketDetail />;
  }

  // Graceful 404 UI State Screen
  if (error && (error.toLowerCase().includes('tidak ditemukan') || error.toLowerCase().includes('not found') || error.toLowerCase().includes('query results'))) {
    return (
      <div className="max-w-md mx-auto mt-20 text-center flex flex-col items-center gap-4 bg-white p-8 border border-slate-200 rounded-lg">
        <AlertCircle className="w-12 h-12 text-red-500 shrink-0" />
        <h2 className="text-xl font-bold text-slate-900">Tiket Tidak Ditemukan</h2>
        <p className="text-sm text-slate-500">Tiket dengan ID "{ticketId}" tidak terdaftar di sistem kami.</p>
        <button
          onClick={() => navigate(-1)}
          className="w-full py-2 bg-primary hover:bg-primary-hover text-white font-bold text-xs rounded-sm transition-colors cursor-pointer"
        >
          Kembali ke Halaman Sebelumnya
        </button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto mt-20 text-center flex flex-col items-center gap-4 bg-white p-8 border border-slate-200 rounded-lg">
        <AlertCircle className="w-12 h-12 text-red-500 shrink-0" />
        <h2 className="text-xl font-bold text-slate-900">Terjadi Kesalahan</h2>
        <p className="text-sm text-slate-500">{error}</p>
        <button
          onClick={() => navigate(-1)}
          className="w-full py-2 bg-primary hover:bg-primary-hover text-white font-bold text-xs rounded-sm transition-colors cursor-pointer"
        >
          Kembali
        </button>
      </div>
    );
  }

  if (!ticket) return <div className="text-slate-500 text-sm text-left">Tiket tidak ditemukan.</div>;

  const currentAssignment = ticket.assignments?.[0];
  const isAssignedProgrammer = user?.role === 'programmer' && currentAssignment?.programmer_id === user.id;

  const fullTicketId = ticket.ticket_id || `TCK-OLD-${ticket.id}`;
  const isHeaderCopied = copiedId === fullTicketId;

  return (
    <div className="max-w-4xl mx-auto w-full text-left flex flex-col gap-6">

      {/* Back link */}
      <div>
        <button
          onClick={() => navigate(-1)}
          className="text-primary hover:text-primary-hover text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke halaman sebelumnya</span>
        </button>
      </div>

      {/* Header Container */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 flex justify-between items-start shadow-sm">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center gap-1 font-mono text-xs font-bold text-primary bg-primary-tint py-0.5 px-2 rounded-sm border border-primary/10">
              <span>{fullTicketId}</span>
              <button
                type="button"
                onClick={() => handleCopy(fullTicketId)}
                title="Salin ID Tiket"
                className="p-0.5 hover:bg-primary/10 rounded transition-colors cursor-pointer"
              >
                {isHeaderCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-primary/70" />}
              </button>
            </div>
            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${getPriorityBadge(ticket.priority)}`}>
              {formatPriorityText(ticket.priority)}
            </span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 mb-1 font-display flex items-center gap-2 flex-wrap">
            {ticket.title}
            {ticket.reporter_name && (
              <span className="text-[10px] font-bold uppercase tracking-widest bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full">
                🚶 Walk-in
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-500 flex items-center gap-2 mt-1.5 font-mono">
            <User className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-sans text-slate-700">
              {ticket.reporter_name
                ? <>Dilaporkan: <strong>{ticket.reporter_name}</strong> (via SD: {ticket.creator?.name})</>
                : <>Dilaporkan oleh {ticket.creator?.name}</>
              }
            </span>
            <span className="text-slate-300">|</span>
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{new Date(ticket.created_at).toLocaleString('id-ID')}</span>
          </p>
        </div>
        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-mono font-bold ${getStatusBadge(ticket.status)}`}>
          {ticket.status.replace('_', ' ')}
        </span>
      </div>

      {/* Inline Forms Status Notifications */}
      {actionError && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-4 rounded-md flex items-center gap-2 font-sans">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {actionSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-xs p-4 rounded-md flex items-center gap-2 font-sans">
          <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Left Columns */}
        <div className="md:col-span-2 flex flex-col gap-6">

          {/* Description - Clean Unboxed Layout */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-xs flex flex-col gap-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider font-display">Deskripsi Masalah</h3>
            <div className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed border-l-2 border-slate-300 pl-4 py-1 font-sans">
              {ticket.description}
            </div>

            {ticket.internal_notes && (
              <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col gap-2">
                <h3 className="text-xs font-bold text-primary uppercase tracking-wider font-display">Catatan Internal Service Desk</h3>
                <div className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed border-l-2 border-primary/40 pl-4 py-1 font-sans">
                  {ticket.internal_notes}
                </div>
              </div>
            )}

            {ticket.attachment_path && (
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center">
                <a
                  href={`http://127.0.0.1:8000/storage/${ticket.attachment_path}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-1.5 px-4 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-semibold text-xs rounded-md transition-colors inline-flex items-center gap-2 cursor-pointer shadow-2xs font-sans"
                >
                  <FileDown className="w-4 h-4 text-primary" />
                  <span>Unduh Lampiran Berkas</span>
                </a>
              </div>
            )}
          </div>

          {/* Timeline Logs & Audit Trail - Clean Unboxed Activity Feed */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-xs flex flex-col gap-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider font-display">Proses Log & Riwayat Audit</h3>
              <div className="flex items-center gap-2">
                <span className="bg-amber-50 text-amber-900 border border-amber-200/80 px-2.5 py-0.5 rounded-full font-mono text-xs font-semibold flex items-center gap-1">
                  <Lock className="w-3 h-3 text-amber-600" /> Internal Only
                </span>
                <span className="bg-sky-50 text-sky-900 border border-sky-200/80 px-2.5 py-0.5 rounded-full font-mono text-xs font-semibold flex items-center gap-1">
                  <MessageSquare className="w-3 h-3 text-sky-600" /> Balasan Publik
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-5">
              {ticket.progress_logs?.map((log, idx) => {
                const isInternal = log.is_internal !== false && log.is_internal !== 0;
                return (
                  <div key={log.id} className="flex gap-4 text-xs text-left group">
                    <div className="flex flex-col items-center">
                      <div className={`w-2.5 h-2.5 rounded-full ${isInternal ? 'bg-amber-500 ring-4 ring-amber-500/10' : 'bg-sky-500 ring-4 ring-sky-500/10'} mt-1 shrink-0`} />
                      {idx !== ticket.progress_logs.length - 1 && (
                        <div className="w-px flex-1 bg-slate-200 my-1" />
                      )}
                    </div>
                    <div className="flex-1 pb-4 border-b border-slate-100 group-last:border-none">
                      <div className="flex flex-wrap justify-between items-start gap-2 mb-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <strong className="text-slate-900 font-bold text-xs font-display">{log.user?.name}</strong>
                          {isInternal ? (
                            <span className="bg-amber-100 text-amber-900 border border-amber-300/80 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold">
                              🔒 Catatan Internal / Staff Only
                            </span>
                          ) : (
                            <span className="bg-sky-100 text-sky-900 border border-sky-300/80 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold">
                              💬 Balasan ke Klien (Publik)
                            </span>
                          )}
                        </div>
                        <span className="text-xs font-mono text-slate-500 shrink-0">
                          {new Date(log.created_at).toLocaleString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <div className="text-slate-500 text-xs font-mono">
                        Role: <span className="font-semibold text-slate-700">{log.user?.role?.replace('_', ' ')}</span>
                      </div>
                      <div className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500">
                        <span>Status:</span>
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-mono font-bold ${getStatusBadge(log.new_status)}`}>
                          {log.new_status}
                        </span>
                      </div>
                      {/* Clean Notes Render (Unboxed Text with Accent Left Line, NO Inner Background Card Slop) */}
                      {log.notes && (
                        <p className={`mt-2.5 text-xs leading-relaxed ${
                          isInternal 
                            ? 'border-l-2 border-amber-400 pl-3.5 py-1 text-slate-800 font-mono' 
                            : 'border-l-2 border-sky-400 pl-3.5 py-1 text-slate-800 font-sans'
                        }`}>
                          "{log.notes}"
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Staff New Note / Reply Box (Locked if Closed or Rejected) */}
            {['closed', 'rejected'].includes(ticket.status?.toLowerCase()) ? (
              <div className="border-t border-slate-100 pt-4">
                <div className="bg-slate-100 border border-slate-200 text-slate-600 p-3.5 rounded-md text-xs flex items-center gap-2">
                  <Lock className="w-4 h-4 text-slate-500 shrink-0" />
                  <span>Tiket ini telah {ticket.status?.toLowerCase() === 'closed' ? 'ditutup' : 'ditolak'} secara permanen. Fitur penambahan catatan internal maupun pesan publik telah dikunci.</span>
                </div>
              </div>
            ) : (
              <div className="border-t border-slate-100 pt-5 flex flex-col gap-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Tambah Catatan atau Pesan</h4>
                <textarea
                  className="w-full text-xs border border-slate-300 rounded-sm p-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white"
                  rows="3"
                  placeholder="Tulis catatan analisis internal atau balasan pesan resmi untuk klien..."
                  value={newLogNotes}
                  onChange={(e) => setNewLogNotes(e.target.value)}
                />
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => handleAddLogSubmit(true)}
                    disabled={submitting}
                    className="flex-1 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-sm transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Simpan Catatan Internal</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddLogSubmit(false)}
                    disabled={submitting}
                    className="flex-1 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-sm transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Kirim Balasan ke Klien</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-6">

          {/* Walk-in Reporter Info Card — only shown when ticket has reporter_name */}
          {ticket.reporter_name && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-amber-200">
                <UserCircle className="w-4 h-4 text-amber-600" />
                <h3 className="text-xs font-bold text-amber-800 uppercase tracking-wider">Info Reporter Walk-in</h3>
                <span className="ml-auto text-[10px] font-bold uppercase tracking-wide bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full">Non-Sistem</span>
              </div>
              <div className="flex flex-col gap-3 text-xs">

                {/* Nama Reporter */}
                <div>
                  <span className="text-amber-600 block mb-0.5 flex items-center gap-1 font-semibold">
                    <User className="w-3 h-3" /> Nama Client
                  </span>
                  <span className="font-bold text-slate-900 text-sm">{ticket.reporter_name}</span>
                </div>

                {/* Nomor Kontak */}
                {ticket.reporter_contact && (
                  <div>
                    <span className="text-amber-600 block mb-0.5 flex items-center gap-1 font-semibold">
                      <Phone className="w-3 h-3" /> Nomor Kontak
                    </span>
                    <a
                      href={`tel:${ticket.reporter_contact}`}
                      className="font-bold text-primary hover:underline flex items-center gap-1"
                    >
                      <Smartphone className="w-3 h-3" />
                      {ticket.reporter_contact}
                    </a>
                  </div>
                )}

                {/* Metode Kontak */}
                {ticket.contact_method && (
                  <div>
                    <span className="text-amber-600 block mb-0.5 flex items-center gap-1 font-semibold">
                      <MapPin className="w-3 h-3" /> Metode Menghubungi SD
                    </span>
                    <span className="inline-flex items-center gap-1.5 font-semibold text-slate-800 bg-white border border-amber-200 px-2.5 py-1 rounded-md">
                      {ticket.contact_method === 'whatsapp'  && <><MessageSquare className="w-3 h-3 text-emerald-600" /> WhatsApp</>}
                      {ticket.contact_method === 'telepon'   && <><Phone className="w-3 h-3 text-blue-600" /> Telepon</>}
                      {ticket.contact_method === 'email'     && <><Mail className="w-3 h-3 text-purple-600" /> Email</>}
                      {ticket.contact_method === 'walk_in'   && <><MapPin className="w-3 h-3 text-amber-600" /> Datang Langsung</>}
                      {ticket.contact_method === 'lainnya'   && <><UserCircle className="w-3 h-3 text-slate-500" /> {ticket.contact_method_notes || 'Lainnya'}</>}
                    </span>
                  </div>
                )}

                {/* Quick Contact Button */}
                {ticket.reporter_contact && ticket.contact_method === 'whatsapp' && (
                  <a
                    href={`https://wa.me/${ticket.reporter_contact.replace(/[^0-9]/g, '').replace(/^0/, '62')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 w-full flex items-center justify-center gap-2 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-md transition-colors cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    Hubungi via WhatsApp
                  </a>
                )}

                {ticket.reporter_contact && ticket.contact_method === 'telepon' && (
                  <a
                    href={`tel:${ticket.reporter_contact}`}
                    className="mt-1 w-full flex items-center justify-center gap-2 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-md transition-colors cursor-pointer"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    Telepon Client
                  </a>
                )}

                {ticket.reporter_contact && ticket.contact_method === 'email' && (
                  <a
                    href={`mailto:${ticket.reporter_contact}`}
                    className="mt-1 w-full flex items-center justify-center gap-2 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-md transition-colors cursor-pointer"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    Kirim Email ke Client
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Assignment Info */}
          {currentAssignment && (
            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Resource Allocation</h3>
              <div className="flex flex-col gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5 flex items-center gap-1">
                    <User className="w-3 h-3 text-slate-400" /> Project Manager
                  </span>
                  <span className="font-bold text-slate-800">{currentAssignment.pm?.name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5 flex items-center gap-1">
                    <User className="w-3 h-3 text-slate-400" /> Assigned Developer
                  </span>
                  <span className="font-bold text-slate-800">{currentAssignment.programmer?.name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" /> Estimated Effort
                  </span>
                  <span className="font-bold text-slate-800">
                    {currentAssignment.estimated_hours} {currentAssignment.estimated_unit === 'days' ? 'Hari' : 'Jam'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Action Sections */}

          {/* ── SD: Tutup Langsung (Self-Resolve) ── walk-in only, any active status ── */}
          {user?.role === 'service_desk'
            && ticket.reporter_name
            && !['closed', 'rejected'].includes(ticket.status) && (
            <div className="bg-white border border-red-200 rounded-lg p-5 flex flex-col gap-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-red-700 uppercase tracking-wider flex items-center gap-1.5">
                    <XCircle className="w-4 h-4" /> Tutup Tiket Walk-in (Self-Resolved)
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                    Gunakan kapanpun jika client walk-in mengonfirmasi masalahnya bukan kendala teknis
                    (human error, belum konek internet, dll). Tiket langsung <strong className="text-red-600">ditutup</strong> meski sudah
                    dieskalasi ke PM atau dikerjakan Programmer.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSdCloseForm(v => !v)}
                  className={`shrink-0 px-3 py-1.5 text-xs font-bold rounded-md border transition-colors cursor-pointer ${
                    showSdCloseForm
                      ? 'bg-slate-100 border-slate-300 text-slate-600'
                      : 'bg-red-600 hover:bg-red-700 border-transparent text-white'
                  }`}
                >
                  {showSdCloseForm ? 'Batal' : 'Tutup Tiket'}
                </button>
              </div>

              {showSdCloseForm && (
                <form onSubmit={handleSdSelfClose} className="flex flex-col gap-3 border-t border-red-100 pt-3 animate-fade-in">
                  {/* Warn if ticket is already escalated / in-progress */}
                  {!['open'].includes(ticket.status) && (
                    <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 text-xs text-amber-800">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600" />
                      <span>
                        Tiket ini sudah berstatus <strong>{ticket.status.replace(/_/g, ' ')}</strong>.
                        Menutupnya sekarang akan membatalkan pengerjaan PM / Programmer secara otomatis.
                      </span>
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                      Alasan Penutupan <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="sd-self-close-note"
                      required
                      rows={3}
                      className="w-full text-xs border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-200 bg-white resize-none"
                      placeholder="Contoh: Client mengonfirmasi perangkat belum terhubung ke internet. Setelah dihubungkan, masalah teratasi sendiri tanpa perlu eskalasi."
                      value={sdCloseNote}
                      onChange={(e) => setSdCloseNote(e.target.value)}
                    />
                  </div>
                  <button
                    id="btn-sd-self-close-confirm"
                    type="submit"
                    disabled={submitting || !sdCloseNote.trim()}
                    className="w-full py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-md transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    {submitting ? 'Menutup Tiket...' : 'Konfirmasi Tutup Tiket'}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* PM Resource Assignment & Direct Owner Escalation */}
          {user?.role === 'project_manager' && ticket.status === 'escalated_to_pm' && (
            <div className="bg-white border border-primary/20 bg-primary-tint/10 rounded-lg p-5 flex flex-col gap-4">
              <h3 className="text-xs font-bold text-primary uppercase tracking-wider">Allocate Resource (PM)</h3>

              <form onSubmit={handleAssign} className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">
                    Developer
                  </label>
                  <select
                    className="w-full text-xs border border-slate-300 rounded-sm px-3 py-2 bg-white focus:outline-none focus:border-primary"
                    value={selectedProgrammerId}
                    onChange={(e) => setSelectedProgrammerId(e.target.value)}
                    required
                  >
                    <option value="">-- Select Programmer --</option>
                    {programmers.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                {/* Priority Override */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">
                    Priority <span className="text-slate-400 font-normal normal-case">(opsional, override dari SD)</span>
                  </label>
                  <select
                    className="w-full text-xs border border-slate-300 rounded-sm px-3 py-2 bg-white focus:outline-none focus:border-primary"
                    value={assignPriority}
                    onChange={(e) => setAssignPriority(e.target.value)}
                  >
                    <option value="">-- Tidak Diubah --</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                {/* Estimated time with unit toggle */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">
                    Estimasi Pengerjaan
                  </label>
                  {/* Unit Toggle */}
                  <div className="flex gap-1 mb-2">
                    <button
                      type="button"
                      onClick={() => { setEstimatedUnit('hours'); setEstimatedHours(''); }}
                      className={`flex-1 py-1 text-xs font-bold rounded-sm border transition-colors cursor-pointer ${
                        estimatedUnit === 'hours'
                          ? 'bg-primary text-white border-primary'
                          : 'bg-white text-slate-600 border-slate-300 hover:border-primary'
                      }`}
                    >
                      Jam
                    </button>
                    <button
                      type="button"
                      onClick={() => { setEstimatedUnit('days'); setEstimatedHours(''); }}
                      className={`flex-1 py-1 text-xs font-bold rounded-sm border transition-colors cursor-pointer ${
                        estimatedUnit === 'days'
                          ? 'bg-primary text-white border-primary'
                          : 'bg-white text-slate-600 border-slate-300 hover:border-primary'
                      }`}
                    >
                      Hari
                    </button>
                  </div>
                  {estimatedUnit === 'hours' ? (
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      className="w-full text-xs border border-slate-300 rounded-sm px-3 py-2 focus:outline-none focus:border-primary"
                      placeholder="contoh: 8.0 jam"
                      value={estimatedHours}
                      onChange={(e) => setEstimatedHours(e.target.value)}
                      required
                    />
                  ) : (
                    <select
                      className="w-full text-xs border border-slate-300 rounded-sm px-3 py-2 bg-white focus:outline-none focus:border-primary"
                      value={estimatedHours}
                      onChange={(e) => setEstimatedHours(e.target.value)}
                      required
                    >
                      <option value="">-- Pilih estimasi hari --</option>
                      {[1,2,3,5,7,14,21,30].map(d => (
                        <option key={d} value={d}>{d} Hari</option>
                      ))}
                    </select>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-primary hover:bg-primary-hover text-white font-bold text-xs rounded-sm transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  disabled={submitting}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>{submitting ? 'Assigning...' : 'Assign Programmer'}</span>
                </button>
              </form>


              {/* Direct PM to Owner Escalation without assigning Programmer */}
              <div className="border-t border-primary/10 pt-3">
                <button
                  type="button"
                  onClick={() => setIsOwnerModalOpen(true)}
                  className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-sm transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Crown className="w-3.5 h-3.5" />
                  <span>Eskalasikan Langsung ke Owner</span>
                </button>
              </div>
            </div>
          )}

          {/* PM Update Priority — available anytime while not closed/rejected */}
          {user?.role === 'project_manager' && !['closed','rejected','pending_confirmation'].includes(ticket.status) && (
            <div className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col gap-3">
              <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Update Prioritas (PM)</h3>
              <div className="flex gap-2">
                <select
                  className="flex-1 text-xs border border-slate-300 rounded-sm px-3 py-2 bg-white focus:outline-none focus:border-primary"
                  value={priorityUpdateValue}
                  onChange={(e) => setPriorityUpdateValue(e.target.value)}
                >
                  <option value="">-- Pilih Prioritas --</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="belum_ditentukan">Belum Ditentukan</option>
                </select>
                <button
                  type="button"
                  onClick={handlePriorityUpdate}
                  disabled={submitting || !priorityUpdateValue}
                  className="px-4 py-2 bg-primary hover:bg-primary-hover text-white font-bold text-xs rounded-sm transition-colors cursor-pointer disabled:opacity-40"
                >
                  Update
                </button>
              </div>
              <input
                type="text"
                className="w-full text-xs border border-slate-300 rounded-sm px-3 py-2 focus:outline-none focus:border-primary"
                placeholder="Catatan alasan perubahan prioritas (opsional)..."
                value={priorityUpdateNotes}
                onChange={(e) => setPriorityUpdateNotes(e.target.value)}
              />
            </div>
          )}

          {/* PM Work Review Action (OK vs TIDAK OK) — Only shown when status is pending_review */}
          {user?.role === 'project_manager' && ticket.status === 'pending_review' && (
            <div className="bg-white border border-indigo-200 bg-indigo-50/20 rounded-lg p-5 flex flex-col gap-4 shadow-sm">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold text-indigo-900 uppercase tracking-wider">Review Hasil Pengerjaan PM</h3>
                <span className="text-[10px] font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded">
                  Status: {ticket.status.replace('_', ' ')}
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-normal">
                Tinjau pengerjaan Programmer. Pilih <strong className="text-emerald-700">OK</strong> untuk menyetujui, atau <strong className="text-red-700">TIDAK OK</strong> untuk mengembalikan ke Programmer.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Catatan Evaluasi / Instruksi Perbaikan <span className="text-red-500">*</span>
                </label>
                <textarea
                  className="w-full text-xs border border-slate-300 rounded-sm p-3 focus:outline-none focus:border-indigo-600 bg-white"
                  rows="3"
                  placeholder="Tuliskan catatan evaluasi hasil pengerjaan atau rincian perbaikan jika TIDAK OK..."
                  value={pmReviewNotes}
                  onChange={(e) => setPmReviewNotes(e.target.value)}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={() => handlePmReviewSubmit('ok')}
                  disabled={submitting}
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-sm transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Review OK (Setujui)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handlePmReviewSubmit('not_ok')}
                  disabled={submitting}
                  className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-sm transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Review TIDAK OK (Kembalikan)</span>
                </button>
              </div>

              {/* Escalate Issue to Owner Option */}
              <div className="border-t border-indigo-100 pt-3 mt-1">
                <button
                  type="button"
                  onClick={() => setIsOwnerModalOpen(true)}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-sm transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Crown className="w-3.5 h-3.5" />
                  <span>Serahkan Issue ke Owner</span>
                </button>
              </div>
            </div>
          )}

          {/* Owner Decision Action Box */}
          {user?.role === 'owner' && ticket.status === 'escalated_to_owner' && (
            <div className="bg-amber-50/80 border border-amber-300 rounded-lg p-5 flex flex-col gap-3 shadow-xs">
              <div className="flex items-center gap-2 text-amber-900">
                <div className="p-1.5 bg-amber-500/20 rounded-md">
                  <Crown className="w-4 h-4 text-amber-700" />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider">Keputusan Executive Owner</h3>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                    Tiket ini dieskalasikan oleh PM untuk mendapatkan persetujuan dan keputusan resmi dari Anda.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setOwnerDecisionType('approved');
                  setOwnerDecisionNotes('');
                  setIsOwnerDecisionModalOpen(true);
                }}
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs"
              >
                <Crown className="w-4 h-4" />
                <span>Beri Keputusan Owner</span>
              </button>
            </div>
          )}

          {/* Service Desk — Konfirmasi Tiket Baru dari Client */}
          {user?.role === 'service_desk' && ticket.status === 'pending_confirmation' && (
            <div className="bg-sky-50 border border-sky-200 rounded-lg p-5 flex flex-col gap-4">
              <div>
                <h3 className="text-xs font-bold text-sky-800 uppercase tracking-wider">Konfirmasi Tiket Client</h3>
                <p className="text-xs text-sky-700 leading-normal mt-1">
                  Tiket baru dari client menunggu konfirmasi. Tinjau detail dan putuskan apakah tiket ini valid untuk diproses.
                </p>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                  Catatan Konfirmasi / Alasan Penolakan <span className="text-red-500">*</span>
                </label>
                <textarea
                  className="w-full text-xs border border-slate-300 rounded-sm p-3 focus:outline-none focus:border-sky-500 bg-white"
                  rows="3"
                  placeholder="Tuliskan catatan atau alasan keputusan kamu..."
                  value={confirmNotes}
                  onChange={(e) => setConfirmNotes(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleConfirmTicket('confirm')}
                  disabled={submitting}
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-sm transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Konfirmasi Tiket (Valid)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleConfirmTicket('reject')}
                  disabled={submitting}
                  className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-sm transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Tolak Tiket</span>
                </button>
              </div>
            </div>
          )}

          {/* Service Desk Triage Action — eskalasi ke PM (hanya saat open) */}
          {user?.role === 'service_desk' && ticket.status === 'open' && (
            <div className="bg-white border border-primary/20 bg-primary-tint/10 rounded-lg p-5 flex flex-col gap-4">
              <h3 className="text-xs font-bold text-primary uppercase tracking-wider">Tindakan Service Desk</h3>
              <p className="text-xs text-slate-600 leading-normal">
                Tiket baru dilaporkan oleh klien. Tinjau keluhan dan eskalasikan ke Project Manager.
              </p>
              <button
                onClick={() => {
                  setEscalatePriority(ticket.priority || 'medium');
                  setIsEscalateModalOpen(true);
                }}
                className="w-full py-2 bg-primary hover:bg-primary-hover text-white font-bold text-xs rounded-sm transition-colors cursor-pointer"
              >
                Eskalasikan ke PM
              </button>
            </div>
          )}

          {/* Programmer Task Updates */}
          {user?.role === 'programmer' && isAssignedProgrammer && (ticket.status === 'assigned' || ticket.status === 'in_progress') && (
            <div className="bg-white border border-primary/10 bg-primary-tint/20 rounded-lg p-5 flex flex-col gap-4">
              <h3 className="text-xs font-bold text-primary uppercase tracking-wider">Update Sprint Task</h3>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                  Task Logs / Notes
                </label>
                <textarea
                  className="w-full text-xs border border-slate-300 rounded-sm px-3 py-2 focus:outline-none focus:border-primary"
                  rows="3"
                  placeholder={ticket.status === 'assigned' ? "Tulis analisis awal..." : "Tulis progres pengerjaan kode & testing..."}
                  value={actionNote}
                  onChange={(e) => setActionNote(e.target.value)}
                  required
                />
              </div>

              {ticket.status === 'assigned' ? (
                <button
                  onClick={() => handleStatusUpdate('in_progress')}
                  className="w-full py-2 bg-[#48626e] hover:bg-[#304a55] text-white font-bold text-xs rounded-sm transition-colors cursor-pointer"
                  disabled={submitting}
                >
                  {submitting ? 'Updating...' : 'Mulai Kerjakan (In Progress)'}
                </button>
              ) : (
                <button
                  onClick={() => handleStatusUpdate('pending_review')}
                  className="w-full py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-sm transition-colors cursor-pointer"
                  disabled={submitting}
                >
                  {submitting ? 'Submitting...' : '✓ Selesai — Ajukan ke PM untuk Review'}
                </button>
              )}
            </div>
          )}

          {/* Programmer — Pending Review Info Banner (ticket is awaiting PM) */}
          {user?.role === 'programmer' && isAssignedProgrammer && ticket.status === 'pending_review' && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-5 flex flex-col gap-2">
              <h3 className="text-xs font-bold text-orange-800 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Menunggu Review PM
              </h3>
              <p className="text-xs text-orange-700 leading-normal">
                Pengerjaan kamu sudah diajukan. PM sedang mereview hasilnya. Kamu akan mendapat notifikasi jika disetujui atau perlu diperbaiki.
              </p>
            </div>
          )}

          {/* Service Desk Close / Reject Actions */}
          {user?.role === 'service_desk' && ticket.status === 'resolved' && (
            <div className="bg-emerald-50/50 border border-emerald-200 rounded-lg p-5 flex flex-col gap-4">
              <h3 className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Client Verification</h3>
              <p className="text-xs text-slate-600 leading-normal">
                Programmer telah menyelesaikan tiket. Lakukan verifikasi ke klien dan perbarui status.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                  Verification Logs
                </label>
                <textarea
                  className="w-full text-xs border border-slate-300 rounded-sm px-3 py-2 focus:outline-none focus:border-primary"
                  rows="3"
                  placeholder="Catatan konfirmasi atau komplain penolakan dari client..."
                  value={actionNote}
                  onChange={(e) => setActionNote(e.target.value)}
                  required
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleStatusUpdate('closed')}
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-sm transition-colors cursor-pointer"
                  disabled={submitting}
                >
                  Close Ticket
                </button>
                <button
                  onClick={() => handleStatusUpdate('rejected')}
                  className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-sm transition-colors cursor-pointer"
                  disabled={submitting}
                >
                  Reject
                </button>
              </div>
            </div>
          )}

          {/* Empty Actions Block */}
          {(!user ||
            (user.role === 'programmer' && (!isAssignedProgrammer || !['assigned','in_progress','pending_review'].includes(ticket.status))) ||
            (user.role === 'service_desk' && !['resolved','open','pending_confirmation'].includes(ticket.status)) ||
            (user.role === 'project_manager' && !['escalated_to_pm','pending_review'].includes(ticket.status) && ['closed','rejected'].includes(ticket.status)) ||
            (user.role === 'owner' && ticket.status !== 'escalated_to_owner') ||
            (ticket.status === 'closed' || ticket.status === 'rejected')
          ) && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-center text-slate-400 text-xs flex items-center justify-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-slate-300" />
              <span>Tidak ada tindakan tersedia.</span>
            </div>
          )}

        </div>

      </div>

      {/* Escalation Modal */}
      {isEscalateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-lg max-w-lg w-full p-6 shadow-xl flex flex-col gap-4 text-left">
            <div>
              <h3 className="text-base font-bold text-slate-900">Eskalasi Tiket ke Project Manager</h3>
              <p className="text-xs text-slate-500 mt-1">Tentukan skala prioritas dan tambahkan analisis teknis sebelum meneruskan tiket ke PM.</p>
            </div>

            <div className="flex flex-col gap-3 text-xs max-h-80 overflow-y-auto pr-1">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">ID Tiket</label>
                <input
                  type="text"
                  className="w-full text-xs border border-slate-200 bg-slate-50 rounded px-3 py-2 text-slate-600 font-mono font-bold"
                  value={ticket.ticket_id}
                  disabled
                  readOnly
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Nama Klien</label>
                <input
                  type="text"
                  className="w-full text-xs border border-slate-200 bg-slate-50 rounded px-3 py-2 text-slate-600 font-semibold"
                  value={ticket.creator?.name || ''}
                  disabled
                  readOnly
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Judul Tiket</label>
                <input
                  type="text"
                  className="w-full text-xs border border-slate-200 bg-slate-50 rounded px-3 py-2 text-slate-600 font-semibold"
                  value={ticket.title}
                  disabled
                  readOnly
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Kategori Masalah <span className="text-primary">*</span>
                  </label>
                  <select
                    className="w-full text-xs border border-slate-300 bg-white rounded px-3 py-2 text-slate-800 font-semibold focus:outline-none focus:border-primary cursor-pointer"
                    value={escalateCategory}
                    onChange={(e) => setEscalateCategory(e.target.value)}
                  >
                    <option value="Jaringan">Jaringan</option>
                    <option value="Hardware">Hardware</option>
                    <option value="Software">Software</option>
                    <option value="Akun">Akun</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-primary uppercase tracking-wider mb-1">
                    Skala Prioritas <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full text-xs border border-slate-300 bg-white rounded px-3 py-2 text-slate-900 font-bold uppercase focus:outline-none focus:border-primary cursor-pointer"
                    value={escalatePriority}
                    onChange={(e) => setEscalatePriority(e.target.value)}
                  >
                    <option value="belum_ditentukan">Belum Ditentukan</option>
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-bold">Deskripsi Masalah Klien</label>
                <textarea
                  className="w-full text-xs border border-slate-200 bg-slate-50 rounded px-3 py-2 text-slate-600 leading-normal"
                  rows="3"
                  value={ticket.description}
                  disabled
                  readOnly
                />
              </div>
            </div>

            <form onSubmit={handleEscalate} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  Catatan Internal Service Desk <span className="text-red-500">*</span>
                </label>
                <textarea
                  className="w-full text-xs border border-slate-300 rounded-sm px-3.5 py-2.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-150 bg-white"
                  rows="4"
                  placeholder="Tuliskan analisis awal teknis atau kronologi sebelum diteruskan ke PM..."
                  value={escalateNotes}
                  onChange={(e) => setEscalateNotes(e.target.value)}
                  required
                />
              </div>

              <div className="flex gap-3 border-t border-slate-100 pt-4">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-primary hover:bg-primary-hover text-white font-bold text-xs rounded-sm transition-colors cursor-pointer"
                  disabled={submitting}
                >
                  {submitting ? 'Mengirim...' : 'Kirim Eskalasi'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEscalateModalOpen(false);
                    setEscalateNotes('');
                  }}
                  className="flex-1 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-xs rounded-sm transition-colors cursor-pointer"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PM Escalate to Owner Modal Overlay */}
      {isOwnerModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-lg max-w-lg w-full p-6 shadow-xl flex flex-col gap-4 text-left">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-600" />
                <span>Eskalasikan Issue ke Owner</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">Serahkan tiket ini ke Owner untuk mendapatkan keputusan atau persetujuan tingkat eksekutif.</p>
            </div>

            <div className="flex flex-col gap-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">ID Tiket</label>
                <input
                  type="text"
                  className="w-full text-xs border border-slate-200 bg-slate-50 rounded px-3 py-2 text-slate-600 font-mono font-bold"
                  value={ticket.ticket_id || `TCK-OLD-${ticket.id}`}
                  disabled
                  readOnly
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Judul Tiket</label>
                <input
                  type="text"
                  className="w-full text-xs border border-slate-200 bg-slate-50 rounded px-3 py-2 text-slate-600 font-semibold"
                  value={ticket.title}
                  disabled
                  readOnly
                />
              </div>
            </div>

            <form onSubmit={handleEscalateOwnerSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  Alasan & Catatan Eskalasi ke Owner <span className="text-red-500">*</span>
                </label>
                <textarea
                  className="w-full text-xs border border-slate-300 rounded-sm px-3.5 py-2.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white"
                  rows="4"
                  placeholder="Jelaskan alasan mengapa isu ini memerlukan persetujuan/keputusan Owner (misal: penambahan anggaran, perubahan ruang lingkup, atau kebijakan khusus)..."
                  value={ownerEscalationNotes}
                  onChange={(e) => setOwnerEscalationNotes(e.target.value)}
                  required
                />
              </div>

              <div className="flex gap-3 border-t border-slate-100 pt-4">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-sm transition-colors cursor-pointer"
                  disabled={submitting}
                >
                  {submitting ? 'Mengirim...' : 'Kirim Eskalasi ke Owner'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsOwnerModalOpen(false);
                    setOwnerEscalationNotes('');
                  }}
                  className="flex-1 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-xs rounded-sm transition-colors cursor-pointer"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Owner Decision Modal Overlay */}
      {isOwnerDecisionModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in text-left">
          <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-6 shadow-2xl flex flex-col gap-4 relative">
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-amber-100 text-amber-700">
                  <Crown className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Keputusan Owner Tiket</h3>
                  <p className="text-xs text-slate-500 font-mono">
                    {ticket.ticket_id || `TCK-OLD-${ticket.id}`} — {ticket.title}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOwnerDecisionModalOpen(false)}
                disabled={submitting}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleOwnerDecisionSubmit} className="flex flex-col gap-4">
              {/* Decision Type Radio Picker */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Pilih Keputusan Strategis <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-col gap-2">
                  {/* Option 1: Approved to PM */}
                  <label
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      ownerDecisionType === 'approved'
                        ? 'border-emerald-500 bg-emerald-50/40 text-emerald-900 font-semibold'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="ownerDecisionType"
                      value="approved"
                      checked={ownerDecisionType === 'approved'}
                      onChange={(e) => setOwnerDecisionType(e.target.value)}
                      className="mt-1 accent-emerald-600 cursor-pointer"
                    />
                    <div>
                      <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Disetujui — Diteruskan ke PM (Eksekusi)
                      </span>
                      <p className="text-[11px] text-slate-500 font-normal mt-0.5">
                        Menyetujui eskalasi. Tiket dikembalikan ke PM untuk ditugaskan ke Programmer.
                      </p>
                    </div>
                  </label>

                  {/* Option 2: Approved & Self-Resolved */}
                  <label
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      ownerDecisionType === 'resolved'
                        ? 'border-teal-500 bg-teal-50/40 text-teal-900 font-semibold'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="ownerDecisionType"
                      value="resolved"
                      checked={ownerDecisionType === 'resolved'}
                      onChange={(e) => setOwnerDecisionType(e.target.value)}
                      className="mt-1 accent-teal-600 cursor-pointer"
                    />
                    <div>
                      <span className="text-xs font-bold text-teal-700 flex items-center gap-1">
                        <CheckCheck className="w-3.5 h-3.5" /> Disetujui & Selesaikan Langsung (Resolved)
                      </span>
                      <p className="text-[11px] text-slate-500 font-normal mt-0.5">
                        Masalah disetujui & selesai di tingkat Owner tanpa perlu Programmer. Tiket siap diverifikasi Service Desk.
                      </p>
                    </div>
                  </label>

                  {/* Option 3: Returned to PM */}
                  <label
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      ownerDecisionType === 'returned_to_pm'
                        ? 'border-indigo-500 bg-indigo-50/40 text-indigo-900 font-semibold'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="ownerDecisionType"
                      value="returned_to_pm"
                      checked={ownerDecisionType === 'returned_to_pm'}
                      onChange={(e) => setOwnerDecisionType(e.target.value)}
                      className="mt-1 accent-indigo-600 cursor-pointer"
                    />
                    <div>
                      <span className="text-xs font-bold text-indigo-700 flex items-center gap-1">
                        <RotateCcw className="w-3.5 h-3.5" /> Dikembalikan ke PM (Kajian Ulang)
                      </span>
                      <p className="text-[11px] text-slate-500 font-normal mt-0.5">
                        Mengembalikan tiket ke PM dengan arahan khusus untuk dikaji ulang.
                      </p>
                    </div>
                  </label>

                  {/* Option 4: Rejected */}
                  <label
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      ownerDecisionType === 'rejected'
                        ? 'border-rose-500 bg-rose-50/40 text-rose-900 font-semibold'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="ownerDecisionType"
                      value="rejected"
                      checked={ownerDecisionType === 'rejected'}
                      onChange={(e) => setOwnerDecisionType(e.target.value)}
                      className="mt-1 accent-rose-600 cursor-pointer"
                    />
                    <div>
                      <span className="text-xs font-bold text-rose-700 flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" /> Ditolak Permanen (Rejected)
                      </span>
                      <p className="text-[11px] text-slate-500 font-normal mt-0.5">
                        Menolak eskalasi secara permanen. Tiket akan ditutup dari antrean.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Decision Notes */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Catatan & Arahan Owner <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows="3"
                  required
                  placeholder="Tuliskan arahan, pertimbangan, atau catatan khusus untuk PM..."
                  value={ownerDecisionNotes}
                  onChange={(e) => setOwnerDecisionNotes(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-3 bg-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsOwnerDecisionModalOpen(false)}
                  disabled={submitting}
                  className="flex-1 py-2.5 border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Keputusan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
