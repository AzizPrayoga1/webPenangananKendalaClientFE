import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  BellRing,
  Ticket,
  ArrowUpRight,
  ArrowRightCircle,
  UserCheck,
  AlertCircle,
  CheckCheck,
  Inbox,
} from 'lucide-react';
import { useNotifications } from '../NotificationContext';

const typeConfig = {
  new_ticket:       { icon: Ticket,           dotColor: 'bg-blue-500',    iconColor: 'text-blue-500'   },
  escalated:        { icon: ArrowRightCircle, dotColor: 'bg-violet-500',  iconColor: 'text-violet-500' },
  assigned:         { icon: UserCheck,        dotColor: 'bg-amber-500',   iconColor: 'text-amber-500'  },
  escalated_owner:  { icon: AlertCircle,      dotColor: 'bg-red-500',     iconColor: 'text-red-500'    },
  client_update:    { icon: ArrowUpRight,     dotColor: 'bg-emerald-500', iconColor: 'text-emerald-500'},
};

/* ─── Single notification row ─── */
const NotificationItem = ({ notif, onNavigate }) => {
  const config = typeConfig[notif.type] || typeConfig.new_ticket;
  const Icon = config.icon;

  return (
    <button
      onClick={() => onNavigate(notif)}
      className={`relative w-full text-left px-4 py-3 flex items-start gap-3
        border-b border-slate-100 last:border-0
        transition-colors duration-150 hover:bg-slate-50
        ${notif.read ? 'opacity-50' : ''}`}
    >
      {/* Left unread stripe */}
      {!notif.read && (
        <span className={`absolute left-0 inset-y-3 w-[3px] rounded-r-full ${config.dotColor}`} />
      )}

      {/* Plain icon — no wrapper card */}
      <Icon className={`shrink-0 w-4 h-4 mt-0.5 ${config.iconColor}`} />

      {/* Text content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className={`text-xs font-semibold leading-tight truncate ${notif.read ? 'text-slate-500' : 'text-slate-800'}`}>
            {notif.title}
          </p>
          {!notif.read && (
            <span className={`shrink-0 w-1.5 h-1.5 rounded-full ${config.dotColor}`} />
          )}
        </div>
        <p className="text-[11px] text-slate-500 mt-0.5 leading-snug line-clamp-2">
          {notif.body}
        </p>
        <p className="text-[10px] text-slate-400 mt-1">
          {notif.relativeTime}
        </p>
      </div>
    </button>
  );
};

import { subscribeUserToPush, sendTestPushNotification } from '../utils/pushManager';

/* ─── Main Bell Component ─── */
export const NotificationBell = () => {
  const { notifications, unreadCount, markAllRead, markOneRead, relativeTime } =
    useNotifications();
  const [open, setOpen] = useState(false);
  const [pushStatus, setPushStatus] = useState('');
  const [pushLoading, setPushLoading] = useState(false);
  const panelRef = useRef(null);
  const navigate = useNavigate();

  const handleSubscribePush = async () => {
    setPushLoading(true);
    setPushStatus('');
    try {
      await subscribeUserToPush();
      setPushStatus('✅ Web Push Notification berhasil diaktifkan!');
    } catch (err) {
      setPushStatus(`❌ ${err.message || 'Gagal mengaktifkan push notification'}`);
    } finally {
      setPushLoading(false);
    }
  };

  const handleSendTestPush = async () => {
    setPushLoading(true);
    setPushStatus('');
    try {
      const res = await sendTestPushNotification();
      setPushStatus(`🚀 ${res.message}`);
    } catch (err) {
      setPushStatus(`❌ ${err.response?.data?.message || 'Gagal mengirim push notification'}`);
    } finally {
      setPushLoading(false);
    }
  };

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleNavigate = (notif) => {
    markOneRead(notif.id);
    setOpen(false);
    navigate(notif.ticketPath);
  };

  const enriched = notifications.map((n) => ({
    ...n,
    relativeTime: relativeTime(n.timestamp),
  }));

  const hasUnread = unreadCount > 0;

  return (
    <div ref={panelRef} className="relative">

      {/* ── Bell trigger button ── */}
      <button
        id="notification-bell-btn"
        onClick={() => setOpen((v) => !v)}
        title="Notifikasi"
        aria-label={`Notifikasi, ${unreadCount} belum dibaca`}
        className={`relative flex items-center gap-2 h-9 px-3 rounded-lg border
          transition-all duration-150 cursor-pointer text-[13px] font-semibold
          ${open
            ? 'bg-white border-slate-300 text-slate-800 shadow-sm'
            : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800 hover:border-slate-300 shadow-sm hover:shadow'
          }`}
      >
        {hasUnread
          ? <BellRing className="w-4 h-4 text-amber-500" style={{ animation: 'wiggle 0.6s ease-in-out' }} />
          : <Bell className="w-4 h-4" />
        }

        {/* Count label */}
        {hasUnread && (
          <span className="text-[11px] font-bold text-red-500 leading-none tabular-nums">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}

        {/* Pulsing dot overlay — unread indicator */}
        {hasUnread && (
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse" />
        )}
      </button>

      {/* ── Dropdown panel ── */}
      {open && (
        <div
          id="notification-panel"
          className="absolute top-full right-0 mt-2 bg-white border border-slate-200 rounded-xl
            shadow-xl overflow-hidden flex flex-col"
          style={{ width: '320px', maxHeight: '460px', animation: 'slide-in-from-top 150ms ease-out both' }}
        >
          {/* Header — no nested card, just a plain border-bottom separator */}
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-slate-500" />
              <span className="text-sm font-bold text-slate-800">Notifikasi</span>
              {hasUnread && (
                <span className="px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full leading-none">
                  {unreadCount}
                </span>
              )}
            </div>
            {hasUnread && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-primary transition-colors cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Tandai dibaca
              </button>
            )}
          </div>

          {/* List */}
          <div className="overflow-y-auto flex-1">
            {enriched.length === 0 ? (
              /* Empty state — no icon-in-a-box, just plain text + icon inline */
              <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
                <Inbox className="w-8 h-8 text-slate-300" />
                <p className="text-sm font-semibold text-slate-500">Semua terkini</p>
                <p className="text-xs text-slate-400">Tidak ada notifikasi baru</p>
              </div>
            ) : (
              enriched.map((n) => (
                <NotificationItem key={n.id} notif={n} onNavigate={handleNavigate} />
              ))
            )}
          </div>

          {/* Web Push Notification Control Bar (Phase 3) */}
          <div className="px-3 py-2.5 bg-slate-50 border-t border-slate-100 flex flex-col gap-2 shrink-0">
            {pushStatus && (
              <div className="text-[10px] font-semibold text-slate-700 bg-white p-1.5 rounded border border-slate-200">
                {pushStatus}
              </div>
            )}
            <div className="flex items-center justify-between gap-1.5">
              <button
                type="button"
                onClick={handleSubscribePush}
                disabled={pushLoading}
                className="flex-1 py-1 px-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[10px] font-bold transition-all disabled:opacity-50 cursor-pointer text-center"
              >
                {pushLoading ? 'Loading...' : '🔔 Aktifkan Push'}
              </button>
              <button
                type="button"
                onClick={handleSendTestPush}
                disabled={pushLoading}
                className="flex-1 py-1 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold transition-all disabled:opacity-50 cursor-pointer text-center"
              >
                🚀 Tes Web Push
              </button>
            </div>
          </div>

          {/* Footer — single plain row */}
          <div className="px-4 py-1.5 border-t border-slate-100 flex items-center justify-between shrink-0 bg-white">
            <p className="text-[10px] text-slate-400">PWA Phase 3: Real-Time Web Push</p>
            {enriched.length > 0 && (
              <p className="text-[10px] text-slate-400">{enriched.length} notifikasi</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
