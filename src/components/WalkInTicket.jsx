import React, { useState } from 'react';
import axios from 'axios';
import { queueOfflineAction } from '../utils/offlineSync';
import {
  UserPlus,
  Phone,
  MessageSquare,
  Mail,
  MapPin,
  MoreHorizontal,
  AlertCircle,
  CheckCircle2,
  FileText,
  Upload,
  Tag,
  ChevronDown,
  Clipboard,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';

// ── Contact method config ──────────────────────────────────────────────
const CONTACT_METHODS = [
  { value: 'whatsapp', label: 'WhatsApp',            icon: MessageSquare, color: 'text-emerald-600 bg-emerald-50' },
  { value: 'telepon',  label: 'Telepon',              icon: Phone,          color: 'text-blue-600 bg-blue-50'      },
  { value: 'email',    label: 'Email',                icon: Mail,           color: 'text-purple-600 bg-purple-50'  },
  { value: 'walk_in',  label: 'Datang Langsung',      icon: MapPin,         color: 'text-amber-600 bg-amber-50'    },
  { value: 'lainnya',  label: 'Lainnya',              icon: MoreHorizontal, color: 'text-slate-600 bg-slate-100'   },
];

const CATEGORIES = ['Jaringan', 'Hardware', 'Software', 'Akun', 'Lainnya'];

// ── ContactMethodPicker ────────────────────────────────────────────────
const ContactMethodPicker = ({ value, onChange }) => (
  <div className="grid grid-cols-5 gap-2">
    {CONTACT_METHODS.map(({ value: v, label, icon: Icon, color }) => {
      const isSelected = value === v;
      return (
        <button
          key={v}
          type="button"
          id={`contact-method-${v}`}
          onClick={() => onChange(v)}
          className={`flex flex-col items-center gap-1.5 px-2 py-3 rounded-lg border-2 text-[10px] font-bold uppercase tracking-wide transition-all duration-150 cursor-pointer ${
            isSelected
              ? 'border-primary bg-primary/5 text-primary'
              : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50'
          }`}
        >
          <span className={`p-1.5 rounded-md ${isSelected ? 'bg-primary/10 text-primary' : color}`}>
            <Icon className="w-4 h-4" />
          </span>
          <span className="text-center leading-tight">{label}</span>
        </button>
      );
    })}
  </div>
);

// ── Success Card ───────────────────────────────────────────────────────
const SuccessCard = ({ ticket, reporterName, onReset, onViewAll }) => (
  <div className="max-w-2xl mx-auto w-full text-left animate-fade-in">
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      {/* Green banner */}
      <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-8 py-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-emerald-100 text-xs font-semibold uppercase tracking-widest">Berhasil Dibuat</p>
            <h2 className="text-xl font-extrabold tracking-tight">Tiket Walk-in Terdaftar</h2>
          </div>
        </div>
        <p className="text-emerald-100 text-sm mt-2">
          Tiket sudah masuk ke antrean dan siap untuk dieskalasikan ke Project Manager.
        </p>
      </div>

      {/* Ticket info grid */}
      <div className="px-8 py-6 flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-50 border border-slate-100 rounded-lg px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">ID Tiket</p>
            <p className="text-base font-extrabold text-slate-900 font-mono tracking-wide">{ticket.ticket_id}</p>
          </div>
          <div className="bg-slate-50 border border-slate-100 rounded-lg px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Status</p>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase text-emerald-700 bg-emerald-100 px-2 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
              Open
            </span>
          </div>
          <div className="bg-slate-50 border border-slate-100 rounded-lg px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Nama Reporter</p>
            <p className="text-sm font-bold text-slate-800">{reporterName}</p>
          </div>
          <div className="bg-slate-50 border border-slate-100 rounded-lg px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Judul Masalah</p>
            <p className="text-sm font-semibold text-slate-700 truncate">{ticket.title}</p>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex gap-3 pt-2 border-t border-slate-100">
          <button
            id="btn-create-another"
            type="button"
            onClick={onReset}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-xs rounded-lg transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Buat Tiket Lain
          </button>
          <button
            id="btn-view-all-tickets"
            type="button"
            onClick={onViewAll}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary hover:bg-primary-hover text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
          >
            Lihat Semua Tiket
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  </div>
);

// ── Main Component ─────────────────────────────────────────────────────
export const WalkInTicket = () => {
  // Form state
  const [reporterName,        setReporterName]        = useState('');
  const [reporterContact,     setReporterContact]     = useState('');
  const [contactMethod,       setContactMethod]       = useState('whatsapp');
  const [contactMethodNotes,  setContactMethodNotes]  = useState('');
  const [category,            setCategory]            = useState('');
  const [title,               setTitle]               = useState('');
  const [description,         setDescription]         = useState('');
  const [attachment,          setAttachment]          = useState(null);
  const [fileName,            setFileName]            = useState('');

  // UI state
  const [submitting,  setSubmitting]  = useState(false);
  const [error,       setError]       = useState('');
  const [createdTicket, setCreatedTicket] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAttachment(file);
      setFileName(file.name);
    }
  };

  const handleReset = () => {
    setReporterName('');
    setReporterContact('');
    setContactMethod('whatsapp');
    setContactMethodNotes('');
    setCategory('');
    setTitle('');
    setDescription('');
    setAttachment(null);
    setFileName('');
    setError('');
    setCreatedTicket(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    if (!navigator.onLine) {
      const offlinePayload = {
        reporter_name: reporterName.trim(),
        contact_method: contactMethod,
        title: title.trim(),
        description: description.trim(),
        reporter_contact: reporterContact.trim() || undefined,
        contact_method_notes: contactMethodNotes.trim() || undefined,
        category: category || undefined,
      };
      queueOfflineAction('WALK_IN_TICKET', offlinePayload);
      setCreatedTicket({
        ticket_id: `OFFLINE-WALKIN-${Date.now().toString().slice(-4)}`,
        title: title.trim(),
        status: 'open (Offline Queued)',
      });
      setSubmitting(false);
      return;
    }

    const formData = new FormData();
    formData.append('reporter_name',   reporterName.trim());
    formData.append('contact_method',  contactMethod);
    formData.append('title',           title.trim());
    formData.append('description',     description.trim());
    if (reporterContact.trim())    formData.append('reporter_contact',    reporterContact.trim());
    if (contactMethodNotes.trim()) formData.append('contact_method_notes', contactMethodNotes.trim());
    if (category)                  formData.append('category',            category);
    if (attachment)                formData.append('attachment',           attachment);

    try {
      const { data } = await axios.post('/tickets/walk-in', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setCreatedTicket(data);
    } catch (err) {
      const msg = err.response?.data?.message;
      const errors = err.response?.data?.errors;
      if (errors) {
        const firstError = Object.values(errors)[0];
        setError(Array.isArray(firstError) ? firstError[0] : firstError);
      } else {
        setError(msg || 'Gagal membuat tiket. Silakan coba lagi.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ── Success view ──
  if (createdTicket) {
    return (
      <SuccessCard
        ticket={createdTicket}
        reporterName={reporterName}
        onReset={handleReset}
        onViewAll={() => window.location.href = '/tickets'}
      />
    );
  }

  // ── Form view ──
  return (
    <div className="max-w-2xl mx-auto w-full text-left flex flex-col gap-6">

      {/* Page Header */}
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
          <UserPlus className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Buat Tiket Walk-in</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Untuk client/reporter yang <span className="font-semibold text-slate-700">tidak terdaftar di sistem</span> — tiket langsung berstatus <span className="font-semibold text-emerald-700">Open</span>.
          </p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div id="walkin-error-alert" className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 text-xs p-4 rounded-lg">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      <form id="form-walkin-ticket" onSubmit={handleSubmit} className="flex flex-col gap-5" encType="multipart/form-data">

        {/* ── Section 1: Informasi Penghubung ── */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col gap-5">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
            <Phone className="w-4 h-4 text-primary" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-700">Informasi Client / Reporter</h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Nama Client */}
            <div className="col-span-2 sm:col-span-1 flex flex-col gap-1.5">
              <label htmlFor="input-reporter-name" className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Nama Client <span className="text-red-500">*</span>
              </label>
              <input
                id="input-reporter-name"
                type="text"
                required
                placeholder="Contoh: Budi Santoso"
                value={reporterName}
                onChange={(e) => setReporterName(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-lg px-3.5 py-2.5 bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all duration-150 placeholder:text-slate-400"
              />
            </div>

            {/* Nomor Kontak */}
            <div className="col-span-2 sm:col-span-1 flex flex-col gap-1.5">
              <label htmlFor="input-reporter-contact" className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Nomor Kontak <span className="text-slate-400 font-normal normal-case">(opsional)</span>
              </label>
              <input
                id="input-reporter-contact"
                type="text"
                placeholder="Contoh: 081234567890"
                value={reporterContact}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  setReporterContact(val);
                }}
                className="w-full text-sm border border-slate-300 rounded-lg px-3.5 py-2.5 bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all duration-150 placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Metode Kontak */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Metode Menghubungi Service Desk <span className="text-red-500">*</span>
            </label>
            <ContactMethodPicker value={contactMethod} onChange={setContactMethod} />
          </div>

          {/* Free-text hanya jika pilih Lainnya */}
          {contactMethod === 'lainnya' && (
            <div className="flex flex-col gap-1.5 animate-fade-in">
              <label htmlFor="input-contact-method-notes" className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Sebutkan Metode Kontak Lainnya <span className="text-red-500">*</span>
              </label>
              <input
                id="input-contact-method-notes"
                type="text"
                required
                placeholder="Contoh: Telegram, SMS, dll."
                value={contactMethodNotes}
                onChange={(e) => setContactMethodNotes(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-lg px-3.5 py-2.5 bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all duration-150 placeholder:text-slate-400"
              />
            </div>
          )}
        </div>

        {/* ── Section 2: Detail Masalah ── */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col gap-5">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
            <FileText className="w-4 h-4 text-primary" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-700">Detail Masalah</h3>
          </div>

          {/* Kategori */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="select-category" className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1">
              <Tag className="w-3 h-3" /> Kategori Masalah <span className="text-slate-400 font-normal normal-case">(opsional)</span>
            </label>
            <div className="relative">
              <select
                id="select-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-lg px-3.5 py-2.5 bg-white appearance-none focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all duration-150 cursor-pointer text-slate-700"
              >
                <option value="">-- Pilih Kategori --</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Judul Masalah */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="input-ticket-title" className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Judul Masalah <span className="text-red-500">*</span>
            </label>
            <input
              id="input-ticket-title"
              type="text"
              required
              placeholder="Contoh: Tidak bisa login ke aplikasi sejak pagi"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-sm border border-slate-300 rounded-lg px-3.5 py-2.5 bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all duration-150 placeholder:text-slate-400"
            />
          </div>

          {/* Deskripsi */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="textarea-description" className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Deskripsi Lengkap <span className="text-red-500">*</span>
            </label>
            <textarea
              id="textarea-description"
              required
              rows={5}
              placeholder="Ceritakan detail masalah yang dialami client: kapan mulai terjadi, pesan error yang muncul, langkah yang sudah dicoba, dampaknya pada pekerjaan client, dll."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-sm border border-slate-300 rounded-lg px-3.5 py-2.5 bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all duration-150 placeholder:text-slate-400 resize-y leading-relaxed"
            />
          </div>
        </div>

        {/* ── Section 3: Lampiran ── */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
            <Upload className="w-4 h-4 text-primary" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-700">
              Tangkapan Layar / Lampiran
              <span className="text-slate-400 font-normal normal-case ml-1">(opsional)</span>
            </h3>
          </div>

          <label
            htmlFor="input-attachment"
            className={`flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-xl p-6 cursor-pointer transition-all duration-150 ${
              fileName
                ? 'border-primary/40 bg-primary/5'
                : 'border-slate-300 bg-slate-50 hover:border-primary/50 hover:bg-primary/5'
            }`}
          >
            {fileName ? (
              <>
                <Clipboard className="w-6 h-6 text-primary" />
                <div className="text-center">
                  <p className="text-sm font-bold text-slate-800 truncate max-w-xs">{fileName}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Klik untuk mengganti file</p>
                </div>
              </>
            ) : (
              <>
                <Upload className="w-6 h-6 text-slate-400" />
                <div className="text-center">
                  <p className="text-sm font-semibold text-slate-700">Klik untuk unggah file</p>
                  <p className="text-xs text-slate-400 mt-0.5">JPG, PNG, PDF, ZIP — maks. 5 MB</p>
                </div>
              </>
            )}
            <input
              id="input-attachment"
              type="file"
              accept=".jpg,.jpeg,.png,.pdf,.zip"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>
        </div>

        {/* ── Submit ── */}
        <div className="flex gap-3 pb-6">
          <button
            id="btn-submit-walkin"
            type="submit"
            disabled={submitting}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary hover:bg-primary-hover text-white font-bold text-sm rounded-xl transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Membuat Tiket...
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                Buat Tiket Walk-in
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
