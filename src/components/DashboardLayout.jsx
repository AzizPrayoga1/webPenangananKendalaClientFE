import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { NotificationBell } from './NotificationBell';
import {
  LayoutDashboard,
  ClipboardList,
  FilePlus,
  UserCheck,
  CheckSquare,
  BarChart3,
  LogOut,
  UserPlus,
  Crown,
  Hand,
  UserCheck2,
  Shield,
  Users,
  ActivitySquare,
} from 'lucide-react';

export const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const getRoleDisplay = (role) => {
    switch (role) {
      case 'service_desk':    return 'Service Desk';
      case 'project_manager': return 'Project Manager';
      case 'programmer':      return 'Programmer';
      case 'owner':           return 'Company Owner';
      case 'client':          return 'Client / Reporter';
      case 'admin':           return 'System Administrator';
      default:                return role;
    }
  };

  const getNavigationMenu = (role) => {
    // end:true forces exact-path matching so parent paths
    // don't show as active when on a child route (e.g. /tickets/tasks)
    const defaultMenu = [
      { name: 'Dashboard Overview', path: '/',        icon: LayoutDashboard, end: true },
      { name: 'All Tickets',        path: '/tickets', icon: ClipboardList,   end: true },
    ];

    switch (role) {
      case 'service_desk':
        return [
          ...defaultMenu,
          { name: 'Eskalasi Tiket',  path: '/tickets/create',  icon: FilePlus  },
          { name: 'Tiket Walk-in',   path: '/tickets/walk-in', icon: UserPlus  },
        ];
      case 'project_manager':
        return [
          ...defaultMenu,
          { name: 'Assign Ticket', path: '/tickets/assign', icon: UserCheck },
          { name: 'Ticket Claim Approval', path: '/tickets/claim-approval', icon: UserCheck2 },
        ];
      case 'programmer':
        return [
          ...defaultMenu,
          { name: 'Available Tickets', path: '/tickets/available', icon: Hand },
          { name: 'My Tasks', path: '/tickets/tasks', icon: CheckSquare },
        ];
      case 'owner':
        return [
          ...defaultMenu,
          { name: 'Laporan Issues (PM)', path: '/owner/issues', icon: Crown },
          { name: 'System Reports',       path: '/reports',      icon: BarChart3 },
        ];
      case 'client':
        return [
          { name: 'Dashboard Overview', path: '/',              icon: LayoutDashboard, end: true },
          { name: 'Buat Tiket',         path: '/client/create', icon: FilePlus },
          { name: 'Riwayat Tiket',      path: '/tickets',       icon: ClipboardList,   end: true },
        ];
      case 'admin':
        return [
          { name: 'Admin Dashboard',   path: '/admin',              icon: Shield,          end: true },
          { name: 'Manajemen Pengguna', path: '/admin/users',        icon: Users },
          { name: 'Log Aktivitas',      path: '/admin/activity-logs', icon: ActivitySquare },
        ];
      default:
        return defaultMenu;
    }
  };

  const menuItems = getNavigationMenu(user?.role);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-canvas font-sans text-slate-800">

      {/* Sidebar Navigation */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 shadow-sm text-left">
        <div>
          {/* Sidebar Header */}
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <span className="text-lg font-extrabold tracking-tight text-slate-900 font-display">
              <span className="text-primary">Ticketing</span>Flow
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 flex flex-col gap-1">
            {menuItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <NavLink
                  key={item.name}
                  to={item.path}
                  end={item.end ?? false}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-2.5 rounded-sm font-bold text-[11px] uppercase tracking-wider transition-all duration-150 border-l-4 outline-none group ${
                      isActive
                        ? 'bg-primary/5 text-primary [border-left-color:var(--color-primary)]'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 [border-left-color:transparent]'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <IconComponent
                        className={`w-5 h-5 shrink-0 transition-colors ${
                          isActive
                            ? 'text-primary'
                            : 'text-slate-400 group-hover:text-slate-600'
                        }`}
                      />
                      <span className="truncate">{item.name}</span>
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer - User info & Logout */}
        <div className="p-4 border-t border-slate-200/70 flex items-center justify-between gap-3">
          <div
            onClick={() => navigate('/profile')}
            title="Pengaturan Profil & Keamanan"
            className="flex items-center gap-2.5 min-w-0 flex-1 p-1.5 -ml-1.5 rounded-lg hover:bg-slate-100/80 transition-colors cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-extrabold text-xs font-display shrink-0 border border-primary/20 group-hover:scale-105 transition-transform">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <span className="block text-xs font-bold text-slate-900 truncate leading-tight font-display group-hover:text-primary transition-colors">{user?.name}</span>
              <span className="block text-[10px] font-medium text-slate-400 truncate mt-0.5">
                {getRoleDisplay(user?.role)}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Log Out"
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50/80 rounded-md transition-colors cursor-pointer shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 h-screen overflow-y-auto bg-canvas p-8 flex flex-col items-stretch">
        <Outlet />
      </main>

      {/* ── Notification Bell — Fixed top-right ── */}
      <div className="fixed top-5 right-8 z-50">
        <NotificationBell />
      </div>
    </div>
  );
};
