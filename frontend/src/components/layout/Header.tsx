import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    Plus,
    Bell,
    Menu,
    LogOut,
    User,
    Settings,
    Moon,
    Sun,
} from 'lucide-react';
import { Button, UserAvatar } from '../ui';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { useAuthStore } from '../../store/auth.store';
import { useNotificationStore } from '../../store/notification.store';
import { notificationsService } from '../../services/notifications.service';
import { useDarkMode } from '../../hooks/useDarkMode';
import { cn } from '../../lib/utils';
import { CommandPalette } from './CommandPalette';
import { QuickAddModal } from './QuickAddModal';
import { getActiveNavItem } from './navConfig';
import { useTranslation } from '../../i18n';

interface HeaderProps {
    sidebarCollapsed: boolean;
    mobileMenuOpen: boolean;
    onMenuClick: () => void;
}

export function Header({ sidebarCollapsed, mobileMenuOpen, onMenuClick }: HeaderProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuthStore();
    const { unreadCount, setNotifications } = useNotificationStore();
    const { darkMode, toggleDarkMode } = useDarkMode();
    const { t } = useTranslation();
    const [commandOpen, setCommandOpen] = useState(false);
    const [quickAddOpen, setQuickAddOpen] = useState(false);

    const activeItem = getActiveNavItem(location.pathname);
    const activeLabel = activeItem ? t(activeItem.labelKey) : 'LifeSync AI';

    // Fetch notifications
    const { data: notificationsData } = useQuery({
        queryKey: ['notifications'],
        queryFn: () => notificationsService.getAll(1, 10),
        refetchInterval: 30000, // Refetch every 30 seconds
    });

    // Update store when data changes
    useEffect(() => {
        if (notificationsData?.data) {
            setNotifications(notificationsData.data);
        }
    }, [notificationsData, setNotifications]);

    // Keyboard shortcut for command palette
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setCommandOpen(true);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <>
            <header
                className={cn(
                    'fixed top-0 right-0 z-30 h-16 bg-[var(--panel-glass)] backdrop-blur-2xl',
                    'border-b border-[var(--border)]',
                    'transition-all duration-300',
                    'left-0 md:left-[60px]',
                    sidebarCollapsed ? 'lg:left-[60px]' : 'lg:left-56'
                )}
            >
                <div className="h-full px-4 flex items-center justify-between gap-4">
                    {/* Left side */}
                    <div className="flex items-center gap-4">
                        {/* Mobile menu button */}
                        <button
                            type="button"
                            onClick={onMenuClick}
                            aria-label="Mở menu điều hướng"
                            aria-controls="mobile-navigation"
                            aria-expanded={mobileMenuOpen}
                            className="flex h-10 w-10 items-center justify-center rounded-xl text-[var(--text-2)] transition-colors hover:bg-[var(--surface-3)] hover:text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] md:hidden"
                        >
                            <Menu className="w-5 h-5" />
                        </button>

                        {/* Current section title */}
                        <h1 className="text-lg font-semibold text-[var(--text)] md:text-xl">
                            {activeLabel}
                        </h1>
                    </div>

                    {/* Right side */}
                    <div className="flex items-center gap-2">
                        {/* Quick Add button (desktop only - mobile uses FAB) */}
                        <Button
                            size="sm"
                            onClick={() => setQuickAddOpen(true)}
                            className="gap-1.5 max-md:hidden"
                        >
                            <Plus className="w-4 h-4" />
                            <span className="max-sm:hidden">{t('header.quickAdd')}</span>
                        </Button>

                        {/* Notifications */}
                        <button
                            onClick={() => navigate('/app/notifications')}
                            className="relative rounded-lg p-2 text-[var(--text-2)] transition-colors hover:bg-[var(--surface-3)] hover:text-[var(--text)]"
                        >
                            <Bell className="w-5 h-5" />
                            {unreadCount > 0 && (
                                <span className="absolute top-1 right-1 w-4 h-4 bg-[var(--danger)] text-white text-xs font-medium rounded-full flex items-center justify-center">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}
                        </button>

                        {/* Dark mode toggle */}
                        <button
                            onClick={toggleDarkMode}
                            className="rounded-lg p-2 text-[var(--text-2)] transition-colors hover:bg-[var(--surface-3)] hover:text-[var(--text)]"
                            title={darkMode ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
                        >
                            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                        </button>

                        {/* User menu */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="flex items-center gap-2 rounded-lg p-1 text-[var(--text)] transition-colors hover:bg-[var(--surface-3)]">
                                    <UserAvatar name={user?.name || 'User'} size="sm" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel>
                                    <div className="flex flex-col">
                                        <span className="font-medium text-[var(--text)]">
                                            {user?.name || "User"}
                                        </span>

                                        <span className="text-xs text-[var(--text-2)]">
                                            {user?.email}
                                        </span>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => navigate('/app/settings')}>
                                    <User className="w-4 h-4 mr-2" />
                                    Hồ sơ
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => navigate('/app/settings')}>
                                    <Settings className="w-4 h-4 mr-2" />
                                    Cài đặt
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleLogout} className="text-red-600 dark:text-red-400">
                                    <LogOut className="w-4 h-4 mr-2" />
                                    Đăng xuất
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </header>

            {/* Mobile Quick Add FAB (bottom-left, mirrors the chat bubble) */}
            <button
                onClick={() => setQuickAddOpen(true)}
                aria-label={t('header.quickAdd')}
                title={t('header.quickAdd')}
                className={cn(
                    'fixed bottom-20 left-4 z-50 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-2xl md:hidden',
                    'transition-transform duration-300 hover:scale-110 active:scale-95'
                )}
                style={{
                    background: 'var(--primary-gradient)',
                    boxShadow: '0 8px 32px rgba(18, 194, 255, 0.4)',
                }}
            >
                <Plus className="h-7 w-7" />
            </button>

            {/* Command Palette */}
            <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />

            {/* Quick Add Modal */}
            <QuickAddModal open={quickAddOpen} onOpenChange={setQuickAddOpen} />
        </>
    );
}
