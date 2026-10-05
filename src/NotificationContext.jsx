import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

const POLL_INTERVAL_MS = 15000; // 15 seconds

// localStorage keys
const getSeenKey = (userId) => `ticketing_seen_${userId}`;

/**
 * Generate a stable unique key for a notification item.
 * For non-client: "ticket_<id>_<status>"
 * For client:     "ticket_<id>_log_<logId>" or "ticket_<id>_status_<status>"
 */
const makeKey = (type, ticketId, extra) => `${type}_${ticketId}_${extra}`;

/**
 * Returns human-readable label for a status string.
 */
const statusLabel = (status) => {
  const map = {
    pending_confirmation: 'Menunggu Konfirmasi SD',
    open: 'Tiket Dikonfirmasi (Open)',
    escalated_to_pm: 'Dieskalasikan ke PM',
    waiting_programmer: 'Tersedia untuk Claim Programmer',
    waiting_pm_approval: 'Menunggu Persetujuan Claim PM',
    assigned: 'Ditugaskan ke Developer',
    in_progress: 'Sedang Dikerjakan',
    pending_review: 'Menunggu Review PM',
    resolved: 'Selesai Dikerjakan',
    closed: 'Ditutup',
    rejected: 'Ditolak',
    escalated_to_owner: 'Dieskalasikan ke Owner',
  };
  return map[status] || status.replace(/_/g, ' ');
};

/**
 * Returns relative time string, e.g. "3 menit lalu", "1 jam lalu"
 */
const relativeTime = (dateStr) => {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff} detik lalu`;
  if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
  return `${Math.floor(diff / 86400)} hari lalu`;
};

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const seenKeysRef = useRef(new Set());
  const intervalRef = useRef(null);

  // Load seen keys from localStorage on mount / user change
  useEffect(() => {
    if (!user?.id) {
      seenKeysRef.current = new Set();
      setNotifications([]);
      return;
    }
    const stored = localStorage.getItem(getSeenKey(user.id));
    seenKeysRef.current = stored ? new Set(JSON.parse(stored)) : new Set();
  }, [user?.id]);

  const persistSeen = useCallback(() => {
    if (!user?.id) return;
    localStorage.setItem(
      getSeenKey(user.id),
      JSON.stringify([...seenKeysRef.current])
    );
  }, [user?.id]);

  /**
   * Core polling function — fetches tickets and computes new notifications.
   */
  const poll = useCallback(async () => {
    if (!user?.id) return;

    try {
      const endpoint = user.role === 'client' ? '/client/tickets' : '/tickets';
      const { data: tickets } = await axios.get(endpoint);

      const newNotifs = [];

      if (user.role === 'project_manager') {
        // Notify 1: tickets newly escalated_to_pm
        tickets.forEach((t) => {
          const key = makeKey('pm_new', t.id, 'escalated_to_pm');
          if (t.status === 'escalated_to_pm' && !seenKeysRef.current.has(key)) {
            newNotifs.push({
              id: key,
              type: 'escalated',
              title: 'Tiket Masuk ke Antrean PM',
              body: `${t.ticket_id} — ${t.title}`,
              ticketPath: `/tickets/${t.ticket_id}`,
              timestamp: t.created_at,
              read: false,
            });
          }
        });

        // Notify 2: programmer submitted for review (pending_review)
        // Key uses the latest pending_review log ID so each re-submission
        // (after PM rejection) generates a NEW unique key → fresh notification.
        tickets.forEach((t) => {
          const isPmOfTicket = t.assignments?.some(
            (a) => a.pm_id === user.id || a.pm?.id === user.id
          );
          if (!isPmOfTicket) return;
          if (t.status !== 'pending_review') return;

          // Find the latest log entry where programmer submitted to pending_review
          const pendingLogs = (t.progress_logs || []).filter(
            (l) => l.new_status === 'pending_review'
          );
          const latestLog = pendingLogs[pendingLogs.length - 1];
          if (!latestLog) return;

          // Use log.id so each new submission = new key
          const key = makeKey('pm_pending_review', t.id, latestLog.id);
          if (!seenKeysRef.current.has(key)) {
            newNotifs.push({
              id: key,
              type: 'assigned',
              title: 'Programmer Siap Direview',
              body: `${t.ticket_id} — ${t.title}`,
              ticketPath: `/tickets/${t.ticket_id}`,
              timestamp: latestLog.created_at || t.updated_at,
              read: false,
            });
          }
        });

        // Notify 3: Owner decision on escalated ticket (Approved / Returned / Resolved / Rejected)
        tickets.forEach((t) => {
          const isPmOfTicket = t.assignments?.some(
            (a) => a.pm_id === user.id || a.pm?.id === user.id
          );

          // Find owner decision logs
          const ownerLogs = (t.progress_logs || []).filter(
            (l) => l.notes && (
              l.notes.includes('[OWNER_DECISION') ||
              l.notes.includes('Keputusan Owner')
            )
          );

          ownerLogs.forEach((log) => {
            const key = makeKey('pm_owner_decision', t.id, log.id);
            if (!seenKeysRef.current.has(key)) {
              let title = 'Keputusan Owner Diterima';
              if (log.notes.includes('APPROVED') || log.notes.includes('Disetujui')) {
                title = 'Keputusan Owner: Disetujui (PM Eksekusi)';
              } else if (log.notes.includes('RETURNED') || log.notes.includes('Dikembalikan')) {
                title = 'Keputusan Owner: Dikembalikan ke PM';
              } else if (log.notes.includes('RESOLVED')) {
                title = 'Keputusan Owner: Disetujui & Selesai';
              } else if (log.notes.includes('REJECTED') || log.notes.includes('Ditolak')) {
                title = 'Keputusan Owner: Tiket Ditolak';
              }

              newNotifs.push({
                id: key,
                type: 'escalated',
                title: title,
                body: `${t.ticket_id} — ${t.title}`,
                ticketPath: `/tickets/${t.ticket_id}`,
                timestamp: log.created_at,
                read: false,
              });
            }
          });
        });
      } else if (user.role === 'programmer') {
        // Notify 1: tickets assigned to this programmer (via claim approve or direct assign)
        tickets.forEach((t) => {
          const isAssigned = t.assignments?.some(
            (a) => a.programmer_id === user.id || a.programmer?.id === user.id
          );
          if (!isAssigned) return;

          // Check if there is a CLAIM_APPROVED log
          const claimApproveLogs = (t.progress_logs || []).filter(
            (l) => l.notes && l.notes.includes('[CLAIM_APPROVED]')
          );

          if (claimApproveLogs.length > 0) {
            claimApproveLogs.forEach((log) => {
              const key = makeKey('prog_claim_approved', t.id, log.id);
              if (!seenKeysRef.current.has(key)) {
                const match = log.notes.match(/Catatan PM:\s*(.*)/i);
                const pmNote = match ? match[1].trim() : '';
                newNotifs.push({
                  id: key,
                  type: 'client_update',
                  title: 'Claim Tiket Disetujui PM',
                  body: `${t.ticket_id} — ${t.title}${pmNote ? ` | Catatan PM: "${pmNote}"` : ''}`,
                  ticketPath: `/tickets/tasks`,
                  timestamp: log.created_at,
                  read: false,
                });
              }
            });
          } else {
            // General direct assignment notification
            const key = makeKey('prog_assign', t.id, t.status);
            if (
              (t.status === 'assigned' || t.status === 'in_progress') &&
              !seenKeysRef.current.has(key)
            ) {
              newNotifs.push({
                id: key,
                type: 'assigned',
                title: 'Tiket Ditugaskan ke Kamu',
                body: `${t.ticket_id} — ${t.title}`,
                ticketPath: `/tickets/${t.ticket_id}`,
                timestamp: t.updated_at || t.created_at,
                read: false,
              });
            }
          }
        });

        // Notify 2: PM rejected this programmer's claim [CLAIM_REJECTED]
        tickets.forEach((t) => {
          const claimRejectLogs = (t.progress_logs || []).filter(
            (l) => l.notes && l.notes.includes('[CLAIM_REJECTED]')
          );
          claimRejectLogs.forEach((log) => {
            // Check if this rejection was for this programmer
            const isForMe =
              log.notes.includes(user.name) ||
              log.notes.includes(`ID: ${user.id}`) ||
              (t.progress_logs || []).some(
                (pl) => pl.user_id === user.id && pl.notes?.includes('[CLAIM_TICKET]')
              );
            if (!isForMe) return;

            const key = makeKey('prog_claim_rejected', t.id, log.id);
            if (!seenKeysRef.current.has(key)) {
              const match = log.notes.match(/Catatan PM:\s*(.*)/i);
              const pmNote = match ? match[1].trim() : '';
              newNotifs.push({
                id: key,
                type: 'escalated_owner', // Red alert icon
                title: 'Claim Tiket Ditolak PM',
                body: `${t.ticket_id} — ${t.title}${pmNote ? ` | Catatan PM: "${pmNote}"` : ''}`,
                ticketPath: `/tickets/available`,
                timestamp: log.created_at,
                read: false,
              });
            }
          });
        });

        // Notify 3: PM rejected this programmer's work [PM_REVIEW_TIDAK_OK] marker in logs
        tickets.forEach((t) => {
          const isAssigned = t.assignments?.some(
            (a) => a.programmer_id === user.id || a.programmer?.id === user.id
          );
          if (!isAssigned) return;
          // Find latest log with rejection marker
          const rejectionLogs = (t.progress_logs || []).filter(
            (l) => l.notes && l.notes.includes('[PM_REVIEW_TIDAK_OK]')
          );
          rejectionLogs.forEach((log) => {
            const key = makeKey('prog_rejected', t.id, log.id);
            if (!seenKeysRef.current.has(key)) {
              const match = log.notes.match(/Catatan PM:\s*(.*)/i);
              const pmNote = match ? match[1].trim() : '';
              newNotifs.push({
                id: key,
                type: 'escalated_owner', // red icon for rejection
                title: 'Pengerjaan Dikembalikan PM',
                body: `${t.ticket_id} — Perlu diperbaiki.${pmNote ? ` Catatan PM: "${pmNote}"` : ''}`,
                ticketPath: `/tickets/${t.ticket_id}`,
                timestamp: log.created_at,
                read: false,
              });
            }
          });
        });
      } else if (user.role === 'owner') {
        // Notify: tickets escalated_to_owner
        tickets.forEach((t) => {
          const key = makeKey('owner_esc', t.id, 'escalated_to_owner');
          if (t.status === 'escalated_to_owner' && !seenKeysRef.current.has(key)) {
            newNotifs.push({
              id: key,
              type: 'escalated_owner',
              title: 'Tiket Dieskalasikan ke Owner',
              body: `${t.ticket_id} — ${t.title}`,
              ticketPath: `/tickets/${t.ticket_id}`,
              timestamp: t.updated_at || t.created_at,
              read: false,
            });
          }
        });
      } else if (user.role === 'service_desk') {
        // SD Notify 1: new ticket from client (pending_confirmation)
        tickets.forEach((t) => {
          const key = makeKey('sd_new', t.id, 'pending_confirmation');
          if (t.status === 'pending_confirmation' && !seenKeysRef.current.has(key)) {
            newNotifs.push({
              id: key,
              type: 'new_ticket',
              title: 'Tiket Baru — Perlu Konfirmasi',
              body: `${t.ticket_id} — ${t.title}`,
              ticketPath: `/tickets/${t.ticket_id}`,
              timestamp: t.created_at,
              read: false,
            });
          }
        });

        // SD Notify 2: ticket resolved (PM approved, awaiting SD close)
        tickets.forEach((t) => {
          const key = makeKey('sd_resolved', t.id, 'resolved');
          if (t.status === 'resolved' && !seenKeysRef.current.has(key)) {
            newNotifs.push({
              id: key,
              type: 'client_update',
              title: 'Tiket Siap Diverifikasi',
              body: `${t.ticket_id} — PM telah menyetujui pengerjaan programmer.`,
              ticketPath: `/tickets/${t.ticket_id}`,
              timestamp: t.updated_at || t.created_at,
              read: false,
            });
          }
        });
      } else if (user.role === 'client') {
        // Notify: any status change on own tickets
        const statusesToNotify = [
          'open',           // SD confirmed ticket
          'escalated_to_pm',
          'assigned',
          'in_progress',
          'resolved',
          'closed',
          'rejected',       // SD rejected ticket
        ];
        tickets.forEach((t) => {
          if (!statusesToNotify.includes(t.status)) return;
          const key = makeKey('client_status', t.id, t.status);
          if (!seenKeysRef.current.has(key)) {
            newNotifs.push({
              id: key,
              type: 'client_update',
              title: 'Update Status Tiket',
              body: `${t.ticket_id} — ${statusLabel(t.status)}`,
              ticketPath: `/client/tickets/${t.ticket_id}`,
              timestamp: t.updated_at || t.created_at,
              read: false,
            });
          }
        });
      }

      if (newNotifs.length > 0) {
        setNotifications((prev) => {
          // Merge: new on top, avoid duplicates by id
          const existingIds = new Set(prev.map((n) => n.id));
          const truly_new = newNotifs.filter((n) => !existingIds.has(n.id));
          return [...truly_new, ...prev];
        });
      }
    } catch (err) {
      // Silent fail: notifications are non-critical, avoid noisy console errors
    }
  }, [user]);

  // Start / stop polling based on user session
  useEffect(() => {
    if (!user?.id) {
      clearInterval(intervalRef.current);
      return;
    }
    // Initial poll immediately on login
    poll();
    intervalRef.current = setInterval(poll, POLL_INTERVAL_MS);
    return () => clearInterval(intervalRef.current);
  }, [user?.id, poll]);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }));
      // Mark all IDs as seen in localStorage
      updated.forEach((n) => seenKeysRef.current.add(n.id));
      persistSeen();
      return updated;
    });
  }, [persistSeen]);

  const markOneRead = useCallback(
    (notifId) => {
      setNotifications((prev) => {
        const updated = prev.map((n) =>
          n.id === notifId ? { ...n, read: true } : n
        );
        seenKeysRef.current.add(notifId);
        persistSeen();
        return updated;
      });
    },
    [persistSeen]
  );

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Phase 4: App Badge API Integration
  useEffect(() => {
    if ('setAppBadge' in navigator) {
      if (unreadCount > 0) {
        navigator.setAppBadge(unreadCount).catch(() => {});
      } else {
        navigator.clearAppBadge().catch(() => {});
      }
    }
  }, [unreadCount]);

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, markAllRead, markOneRead, relativeTime }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
};
