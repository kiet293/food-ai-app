import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  ChefHat,
  Film,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareWarning,
  Settings2,
  Tags,
  Users,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import { Avatar } from './Avatar';

const NAV_ITEMS = [
  { to: '/', label: 'Tổng quan', icon: LayoutDashboard, end: true },
  { to: '/users', label: 'Người dùng', icon: Users },
  { to: '/recipes', label: 'Công thức', icon: UtensilsCrossed },
  { to: '/reels', label: 'Video Reels', icon: Film },
  { to: '/taxonomy', label: 'Danh mục & Tag', icon: Tags },
  { to: '/comments', label: 'Kiểm duyệt bình luận', icon: MessageSquareWarning },
  { to: '/system', label: 'Công cụ hệ thống', icon: Settings2 },
];

export function Layout() {
  const { admin, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navContent = (
    <div className="flex h-full flex-col bg-slate-950 text-slate-200">
      <div className="flex items-center justify-between px-5 py-5 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
            <ChefHat className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-white tracking-tight">Food AI Admin</div>
            <div className="text-[11px] text-slate-400">Quản trị dữ liệu</div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`
            }
          >
            <Icon className="h-4.5 w-4.5 shrink-0" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-slate-800/80 p-4">
        <div className="flex items-center gap-3">
          <Avatar src={admin?.avatar} name={admin?.full_name || admin?.username} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">
              {admin?.full_name || admin?.username}
            </p>
            <p className="truncate text-xs text-slate-400">@{admin?.username}</p>
          </div>
          <button
            type="button"
            onClick={logout}
            title="Đăng xuất"
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-rose-400 transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Desktop sidebar */}
      <aside className="hidden lg:block lg:w-64 lg:shrink-0 lg:fixed lg:inset-y-0 lg:left-0">
        {navContent}
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden flex">
          <div className="fixed inset-0 bg-slate-900/50" onClick={() => setSidebarOpen(false)} />
          <div className="relative z-10 w-64 max-w-[80vw] h-full">{navContent}</div>
        </div>
      )}

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-slate-200 bg-white/90 backdrop-blur-xs px-4 sm:px-6 h-14 lg:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-sm font-bold text-slate-900">Food AI Admin</span>
          <div className="w-9" />
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
