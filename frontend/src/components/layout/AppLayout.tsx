import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { useLoginTransition } from '../../store/login-transition.store';
import { Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MobileBottomNav } from './MobileBottomNav';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import AIChatbot from '../chatbot/AIChatbot';
import { UpgradePromptModal } from '../subscription/UpgradePromptModal';
import { NotificationListener } from '../notifications/NotificationToast';
import { TaskReminderScheduler } from '../notifications/TaskReminderScheduler';
import { DevicePermissionCenter } from '../permissions/DevicePermissionCenter';
import { LifeSyncFlowBackground } from '../ui';
import { cn } from '../../lib/utils';
import './workspace-theme.css';

export function AppLayout() {
    const entranceRef = useRef<HTMLDivElement>(null);
    useLayoutEffect(() => {
        const phase = useLoginTransition.getState().phase;
        if (phase === 'idle') return;
        if (phase === 'cover') useLoginTransition.getState().setPhase('reveal');
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        const context = gsap.context(() => {
            gsap.fromTo(entranceRef.current, { y: 26, opacity: 0 }, { y: 0, opacity: 1, duration: 0.85, delay: 0.12, ease: 'power3.out' });
        }, entranceRef);
        return () => context.revert();
    }, []);
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
        <div className="workspace-studio min-h-screen page-shell">
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
                    'relative z-10 min-h-screen pt-16 pb-28 transition-all duration-300 md:pb-0',
                    'md:pl-[60px]',
                    sidebarCollapsed ? 'lg:pl-[60px]' : 'lg:pl-56'
                )}
            >
                <div ref={entranceRef} className="page-shell p-4 md:p-6 lg:p-8">
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
            <TaskReminderScheduler />

            <DevicePermissionCenter />
        </div>
    );
}
