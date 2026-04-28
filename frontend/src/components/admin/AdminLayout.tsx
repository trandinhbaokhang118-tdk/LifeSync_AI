import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import '../../admin-theme.css';
import { LayoutDashboard, Users, Settings, Activity, Database, Shield, LogOut, Zap } from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';
import { Button } from '../ui';

export function AdminLayout() {
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();

    const handleLogout = () => {
        logout();
        navigate('/admin/login', { replace: true });
    };

    const navItems = [
        { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
        { to: '/admin/users', icon: Users, label: 'Người dùng' },
        { to: '/admin/activity', icon: Activity, label: 'Hoạt động' },
        { to: '/admin/database', icon: Database, label: 'Database' },
        { to: '/admin/settings', icon: Settings, label: 'Cài đặt' },
    ];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gradient-to-br dark:from-[#0C1929] dark:via-[#0F2744] dark:to-[#0C1929]">
            {/* Sidebar */}
            <aside className="admin-sidebar fixed left-0 top-0 h-full w-72 z-40">
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="p-6 border-b border-gray-200 dark:border-white/10">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 via-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                                <Shield className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <h1 className="font-bold text-lg text-gray-900 dark:text-white">Admin Panel</h1>
                                <p className="text-xs text-cyan-500 dark:text-cyan-400">TimeManager</p>
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
                                            ? 'bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-500/30'
                                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white border border-transparent'
                                    }`
                                }
                            >
                                <item.icon className="w-5 h-5 transition-transform group-hover:scale-110" />
                                <span className="font-medium">{item.label}</span>
                            </NavLink>
                        ))}
                    </nav>

                    {/* Stats Badge */}
                    <div className="admin-glass-card mx-4 mb-4 p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                        <div className="flex items-center gap-2 mb-2">
                            <Zap className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
                            <span className="text-xs font-medium text-cyan-600 dark:text-cyan-400">Hệ thống hoạt động</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                            <span className="text-xs text-gray-500 dark:text-gray-400">Tất cả dịch vụ online</span>
                        </div>
                    </div>

                    {/* User Info */}
                    <div className="admin-glass-card p-4 border-t border-gray-200 dark:border-white/10">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center">
                                <span className="text-sm font-bold text-cyan-600 dark:text-cyan-400">
                                    {user?.name.charAt(0).toUpperCase()}
                                </span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user?.name}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            className="w-full border-gray-300 dark:border-white/10 hover:border-red-500/50 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 text-gray-600 dark:text-gray-400"
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
