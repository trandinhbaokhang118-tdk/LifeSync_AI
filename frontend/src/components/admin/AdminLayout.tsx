import { Outlet, NavLink, useNavigate } from "react-router-dom";
import "../../admin-theme.css";
import {
  LayoutDashboard,
  Users,
  Settings,
  Activity,
  Database,
  Shield,
  LogOut,
  Zap,
} from "lucide-react";
import { useAuthStore } from "../../store/auth.store";
import { Button } from "../ui";

export function AdminLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    navigate("/admin/login", { replace: true });
  };

  const navItems = [
    { to: "/admin", icon: LayoutDashboard, label: "Dashboard", end: true },
    { to: "/admin/users", icon: Users, label: "Người dùng" },
    { to: "/admin/activity", icon: Activity, label: "Hoạt động" },
    { to: "/admin/database", icon: Database, label: "Database" },
    { to: "/admin/settings", icon: Settings, label: "Cài đặt" },
  ];

  return (
    <div className="admin-theme min-h-screen bg-gray-50 dark:bg-gradient-to-br dark:from-[#0C1929] dark:via-[#0F2744] dark:to-[#0C1929]">
      {/* Sidebar */}
      <aside className="admin-sidebar fixed left-0 top-0 h-full w-72 z-40">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-white/20">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 flex items-center justify-center shadow-xl shadow-cyan-500/30">
                <Shield className="w-7 h-7 text-white drop-shadow-lg" />
              </div>
              <div>
                <h1 className="font-bold text-lg text-white">Admin Panel</h1>
                <p className="text-xs text-cyan-400 font-medium">LifeSync AI</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `admin-sidebar-item flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group ${
                    isActive
                      ? "bg-cyan-500/15 text-cyan-300 border-2 border-cyan-400/40 font-semibold shadow-lg shadow-cyan-500/20"
                      : "text-gray-300 hover:bg-white/8 hover:text-white border-2 border-transparent"
                  }`
                }
              >
                <item.icon className="w-5 h-5 transition-transform group-hover:scale-110" />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Stats Badge */}
          <div className="admin-glass-card mx-4 mb-4 p-4 rounded-xl bg-white/5 border-2 border-white/15">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-semibold text-cyan-300">
                Hệ thống hoạt động
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-lg shadow-green-400/50"></div>
              <span className="text-xs text-gray-300 font-medium">
                Tất cả dịch vụ online
              </span>
            </div>
          </div>

          {/* User Info */}
          <div className="admin-glass-card p-4 border-t-2 border-white/15">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400/30 to-purple-500/30 border-2 border-cyan-400/40 flex items-center justify-center shadow-lg">
                <span className="text-sm font-bold text-cyan-300">
                  {user?.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {user?.name}
                </p>
                <p className="text-xs text-gray-300 truncate">{user?.email}</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full border-2 border-white/15 hover:border-red-400/50 hover:bg-red-500/15 hover:text-red-300 text-gray-300 font-semibold"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Đăng xuất
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-72 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}
