import { useState, useEffect } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    CheckSquare,
    Calendar,
    Timer,
    MoreHorizontal,
} from 'lucide-react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import AIChatbot from '../chatbot/AIChatbot';
import { cn } from '../../lib/utils';

export function AppLayout() {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
        if (typeof window === 'undefined') {
            return false;
        }

        return localStorage.getItem('sidebarCollapsed') === 'true';
    });
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Close mobile menu on resize
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768) {
                setMobileMenuOpen(false);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const toggleSidebar = () => {
        const newValue = !sidebarCollapsed;
        setSidebarCollapsed(newValue);
        localStorage.setItem('sidebarCollapsed', String(newValue));
    };

    return (
        <div className="min-h-screen page-shell">
            {/* Desktop Sidebar */}
            <div className="hidden md:block">
                <Sidebar
                    collapsed={sidebarCollapsed}
                    onToggle={toggleSidebar}
                />
            </div>

            {/* Mobile Sidebar Overlay */}
            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 z-30 bg-[var(--bg-overlay)] md:hidden"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            {/* Mobile Sidebar */}
            <div
                className={cn(
                    'fixed inset-y-0 left-0 z-40 md:hidden transform transition-transform duration-300',
                    mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
                )}
            >
                <Sidebar
                    collapsed={false}
                    onToggle={() => { }}
                    mobile
                    onClose={() => setMobileMenuOpen(false)}
                />
            </div>

            {/* Header */}
            <Header
                sidebarCollapsed={sidebarCollapsed}
                onMenuClick={() => setMobileMenuOpen(true)}
            />

            {/* Main Content */}
            <main
                className={cn(
                    'min-h-screen pt-16 pb-20 transition-all duration-300 md:pb-0',
                    sidebarCollapsed ? 'md:pl-[72px]' : 'md:pl-64'
                )}
            >
                <div className="page-shell p-4 md:p-6 lg:p-8">
                    <Outlet />
                </div>
            </main>

            {/* Mobile Bottom Navigation */}
            <MobileBottomNav />

            {/* AI Chatbot */}
            <AIChatbot />
        </div>
    );
}

function MobileBottomNav() {
    const navItems = [
        { path: '/app', icon: LayoutDashboard, label: 'Home', end: true },
        { path: '/app/tasks', icon: CheckSquare, label: 'Tasks' },
        { path: '/app/calendar', icon: Calendar, label: 'Calendar' },
        { path: '/app/focus', icon: Timer, label: 'Focus' },
        { path: '/app/settings', icon: MoreHorizontal, label: 'More' },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-[var(--border)] bg-[var(--panel-glass)]/95 backdrop-blur-2xl safe-area-pb md:hidden">
            <div className="flex items-center justify-around h-16">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            cn(
                                'flex h-full w-full flex-col items-center justify-center gap-1 text-xs transition-colors',
                                isActive
                                    ? 'text-[var(--primary)]'
                                    : 'text-[var(--text-3)] hover:text-[var(--text)]'
                            )
                        }
                        end={item.end === true}
                    >
                        <item.icon className="w-5 h-5" />
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </div>
        </nav>
    );
}
