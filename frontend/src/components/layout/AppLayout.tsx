import { useState, useEffect } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
import { UpgradePromptModal } from '../subscription/UpgradePromptModal';
import { NotificationListener } from '../notifications/NotificationToast';
import { DevicePermissionCenter } from '../permissions/DevicePermissionCenter';
import { LifeSyncFlowBackground } from '../ui';
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

    useEffect(() => {
        if (!mobileMenuOpen) {
            return;
        }

        const previousOverflow = document.body.style.overflow;
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setMobileMenuOpen(false);
            }
        };

        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [mobileMenuOpen]);

    const toggleSidebar = () => {
        const newValue = !sidebarCollapsed;
        setSidebarCollapsed(newValue);
        localStorage.setItem('sidebarCollapsed', String(newValue));
    };

    return (
        <div className="min-h-screen page-shell">
            {/* Quiet time-flow backdrop shared by authenticated pages */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <LifeSyncFlowBackground variant="soft" />
            </div>
            {/* Desktop Sidebar */}
            <div className="hidden md:block">
                <Sidebar
                    collapsed={sidebarCollapsed}
                    onToggle={toggleSidebar}
                />
            </div>

            {/* Mobile Sidebar Overlay + Drawer */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <>
                        <motion.button
                            type="button"
                            aria-label="Đóng menu điều hướng"
                            key="mobile-overlay"
                            className="fixed inset-0 z-30 cursor-default bg-[var(--bg-overlay)] md:hidden"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.25, ease: 'easeOut' }}
                            onClick={() => setMobileMenuOpen(false)}
                        />
                        <motion.div
                            key="mobile-drawer"
                            className="fixed inset-y-0 left-0 z-40 md:hidden"
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
                        >
                            <Sidebar
                                collapsed={false}
                                onToggle={() => { }}
                                mobile
                                onClose={() => setMobileMenuOpen(false)}
                            />
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Header */}
            <Header
                sidebarCollapsed={sidebarCollapsed}
                mobileMenuOpen={mobileMenuOpen}
                onMenuClick={() => setMobileMenuOpen(true)}
            />

            {/* Main Content */}
            <main
                className={cn(
                    'relative z-10 min-h-screen pt-16 pb-20 transition-all duration-300 md:pb-0',
                    'md:pl-[60px]',
                    sidebarCollapsed ? 'lg:pl-[60px]' : 'lg:pl-56'
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

            {/* Upgrade / trial prompt on app entry */}
            <UpgradePromptModal />

            {/* Only listen for user notifications inside authenticated routes. */}
            <NotificationListener />

            <DevicePermissionCenter />
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
