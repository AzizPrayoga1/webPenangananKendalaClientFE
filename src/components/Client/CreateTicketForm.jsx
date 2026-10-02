import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AlertCircle, CheckCircle, ArrowLeft, WifiOff } from 'lucide-react';
import { queueOfflineAction } from '../../utils/offlineSync';

export const CreateTicketForm = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [attachment, setAttachment] = useState(null);
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleFileChange = (e) => {
    setAttachment(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    // Check Offline status first
    if (!navigator.onLine) {
      queueOfflineAction('CREATE_TICKET', { title, description });
      setSuccess('Mode Offline: Tiket berhasil disimpan di antrean perangkat! Akkan ter-sync otomatis begitu internet kembali terhubung.');
      setSubmitting(false);
      setTimeout(() => {
        navigate('/client');
      }, 2500);
      return;
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    if (attachment) {
      formData.append('attachment', attachment);
    }

    try {
      const response = await axios.post('/client/tickets', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setSuccess('Tiket bantuan berhasil dikirim!');
      const createdTicket = response.data;
      setTimeout(() => {
        navigate(`/client/tickets/${createdTicket.ticket_id}`);
      }, 1500);
    } catch (err) {
      if (!err.response) {
        // Network error / server offline
        queueOfflineAction('CREATE_TICKET', { title, description });
        setSuccess('Koneksi terputus: Tiket disimpan di antrean offline lokal dan akan ter-sync saat terhubung kembali.');
      } else {
        setError(err.response?.data?.message || 'Gagal mengirimkan tiket bantuan.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6 w-full text-left">
      <div>
        <button
          onClick={() => navigate(-1)}
          className="text-primary hover:text-primary-hover text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali</span>
        </button>
      </div>

      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Buat Tiket Baru</h2>
        <p className="text-sm text-slate-500">Laporkan kendala sistem Anda dan tim teknisi kami akan segera menanganinya.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-sm text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-sm text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-lg p-8 shadow-sm">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
              Judul Masalah
            </label>
            <input
              type="text"
              className="w-full text-sm border border-slate-300 rounded-sm px-3.5 py-2.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-150"
              placeholder="Contoh: Tidak dapat masuk ke portal database"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
              Deskripsi Masalah Lengkap
            </label>
            <textarea
              className="w-full text-sm border border-slate-300 rounded-sm px-3.5 py-2.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-150"
              rows="5"
              placeholder="Jelaskan kendala yang terjadi, langkah-langkah untuk mereproduksi, atau konteks lainnya..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
              Unggah Tangkapan Layar / Berkas Log (Opsional)
            </label>
            <input
              type="file"
              className="w-full text-sm border border-slate-300 rounded-sm px-3.5 py-2 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-150 file:mr-4 file:py-1 file:px-2 file:rounded-sm file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
              onChange={handleFileChange}
            />
          </div>

          <div className="flex gap-4 border-t border-slate-100 pt-6 mt-2">
            <button
              type="submit"
              className="flex-1 py-2.5 bg-primary hover:bg-primary-hover text-white font-bold text-sm rounded-sm transition-colors cursor-pointer"
              disabled={submitting}
            >
              {submitting ? 'Mengirim...' : 'Kirim Tiket'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex-1 py-2.5 border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-sm rounded-sm transition-colors cursor-pointer"
            >
              Batal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
