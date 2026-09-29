import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    Plus,
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
import { NotificationPopover } from '../notifications/NotificationPopover';

interface HeaderProps {
    sidebarCollapsed: boolean;
    mobileMenuOpen: boolean;
    onMenuClick: () => void;
}

export function Header({ sidebarCollapsed, mobileMenuOpen, onMenuClick }: HeaderProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuthStore();
    const { setNotifications } = useNotificationStore();
    const { darkMode, toggleDarkMode } = useDarkMode();
    const { t } = useTranslation();
    const [commandOpen, setCommandOpen] = useState(false);
    const [quickAddOpen, setQuickAddOpen] = useState(false);

    const activeItem = getActiveNavItem(location.pathname);
    const activeLabel = activeItem ? t(activeItem.labelKey) : 'LifeSync AI';

    // Fetch notifications
    const { data: notificationsData } = useQuery({
        queryKey: ['notifications'],
        queryFn: () => notificationsService.getAll(1, 50),
        refetchInterval: 30000, // Refetch every 30 seconds
    });

    const { data: unreadCount = 0 } = useQuery({
        queryKey: ['notifications', 'unread-count'],
        queryFn: notificationsService.getUnreadCount,
        refetchInterval: 30000,
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
                    <div className="flex min-w-0 items-center gap-4">
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
                        <h1 className="truncate !text-lg font-semibold text-[var(--text)] md:!text-xl">
                            {activeLabel}
                        </h1>
                    </div>

                    {/* Right side */}
                    <div className="flex shrink-0 items-center gap-2">
                        {/* Quick Add button (desktop only - mobile uses FAB) */}
                        <Button
                            size="sm"
                            onClick={() => setQuickAddOpen(true)}
                            className="gap-1.5 max-md:hidden"
                        >
                            <Plus className="w-4 h-4" />
                            <span className="max-sm:hidden">{t('header.quickAdd')}</span>
                        </Button>

                        {/* Dark mode toggle */}
                        <button
                            onClick={toggleDarkMode}
                            aria-label={darkMode ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
                            aria-pressed={darkMode}
                            className="header-circle-control grid h-11 w-11 shrink-0 place-items-center rounded-full p-0 text-[var(--text-2)] transition-colors hover:bg-[var(--surface-3)] hover:text-[var(--text)]"
                            title={darkMode ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
                        >
                            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                        </button>

                        <NotificationPopover unreadCount={unreadCount} />

                        {/* User menu */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button aria-label="Mở menu người dùng" className="header-circle-control grid h-11 w-11 shrink-0 place-items-center rounded-full p-0 text-[var(--text)] transition-colors hover:bg-[var(--surface-3)]">
                                    <UserAvatar name={user?.name || 'User'} size="sm" className="h-full w-full" />
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

            {/* Command Palette */}
            <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />

            {/* Quick Add Modal */}
            <QuickAddModal open={quickAddOpen} onOpenChange={setQuickAddOpen} />
        </>
    );
}
