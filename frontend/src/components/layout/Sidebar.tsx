import { NavLink, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PanelLeftClose, Shield, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { BrandMark } from '../ui/BrandMark';
import { useAuthStore } from '../../store/auth.store';
import { userNavItems, adminNavItems } from './navConfig';
import { useTranslation } from '../../i18n';

interface SidebarProps {
    collapsed: boolean;
    onToggle: () => void;
    mobile?: boolean;
    onClose?: () => void;
}

export function Sidebar({ collapsed, onToggle, mobile = false, onClose }: SidebarProps) {
    const location = useLocation();
    const { user } = useAuthStore();
    const { t } = useTranslation();
    const isAdmin = user?.role === 'ADMIN';
    const navItems = location.pathname.startsWith('/admin') && isAdmin ? adminNavItems : userNavItems;
    const showDesktopLabels = !mobile && !collapsed;

    const compactNavigationClass = !mobile && (
        collapsed
            ? 'justify-center px-2 lg:group-hover/sidebar:justify-start lg:group-hover/sidebar:px-3'
            : 'justify-center px-2 lg:justify-start lg:px-3'
    );

    return (
        <aside
            id={mobile ? 'mobile-navigation' : 'desktop-navigation'}
            aria-label={mobile ? 'Điều hướng di động' : 'Điều hướng chính'}
            className={cn(
                'group/sidebar fixed left-0 top-0 z-40 flex h-dvh flex-col overflow-hidden border-r',
                'border-[var(--sidebar-border)] bg-[var(--sidebar-bg)] backdrop-blur-xl',
                'transition-[width] duration-300 ease-in-out',
                mobile
                    ? 'w-[82vw] max-w-[288px] shadow-2xl'
                    : collapsed ? 'w-[60px] lg:hover:w-56' : 'w-[60px] lg:w-56',
            )}
        >
            <div className={cn(
                'flex h-14 flex-shrink-0 items-center border-b border-[var(--sidebar-border)]',
                mobile || !collapsed ? 'justify-between px-3' : 'justify-center px-2',
                !mobile && collapsed && 'lg:group-hover/sidebar:justify-start lg:group-hover/sidebar:px-3',
            )}>
                <Link
                    to={isAdmin ? '/admin' : '/app'}
                    onClick={mobile ? onClose : undefined}
                    className={cn(
                        'flex min-w-0 items-center rounded-xl transition-all hover:opacity-80',
                        !mobile && collapsed ? 'gap-0 lg:group-hover/sidebar:gap-3' : 'gap-3',
                        showDesktopLabels && 'lg:flex-1',
                    )}
                    title="Về trang chủ"
                >
                    <BrandMark className={cn(
                        'flex-shrink-0 rounded-lg shadow-sm',
                        mobile ? 'h-9 w-9' : collapsed ? 'h-8 w-8' : 'h-8 w-8 lg:h-9 lg:w-9',
                    )} />
                    <span className={cn(
                        'whitespace-nowrap text-lg font-bold text-[var(--text)] transition-all duration-200',
                        mobile && 'block',
                        !mobile && !collapsed && 'hidden lg:block',
                        !mobile && collapsed && 'hidden max-w-0 translate-x-1 overflow-hidden opacity-0 lg:block group-hover/sidebar:max-w-36 group-hover/sidebar:translate-x-0 group-hover/sidebar:opacity-100',
                    )}>
                        LifeSync AI
                    </span>
                </Link>

                {!mobile && !collapsed && (
                    <button
                        type="button"
                        onClick={onToggle}
                        aria-label="Thu gọn thanh điều hướng"
                        title="Thu gọn thanh điều hướng"
                        className="hidden h-8 w-8 items-center justify-center rounded-lg text-[var(--text-3)] transition-colors hover:bg-[var(--sidebar-item-hover)] hover:text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] lg:flex"
                    >
                        <PanelLeftClose className="h-4 w-4" />
                    </button>
                )}

                {mobile && (
                    <motion.button
                        type="button"
                        onClick={onClose}
                        aria-label="Đóng menu"
                        whileHover={{ rotate: 90, scale: 1.1 }}
                        whileTap={{ scale: 0.85 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--sidebar-border)] bg-[var(--surface-2)] text-[var(--text-2)] shadow-sm transition-colors hover:bg-[var(--sidebar-item-hover)] hover:text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                    >
                        <X className="h-5 w-5" />
                    </motion.button>
                )}
            </div>

            <nav className="min-h-0 flex-1 overflow-y-auto px-2 py-3">
                <ul className="space-y-0.5">
                    {navItems.map((item) => (
                        <li key={item.path}>
                            <NavLink
                                to={item.path}
                                onClick={mobile ? onClose : undefined}
                                title={t(item.labelKey)}
                                className={({ isActive }) => cn(
                                    'flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
                                    !mobile && collapsed ? 'gap-0 lg:group-hover/sidebar:gap-3' : 'gap-3',
                                    isActive
                                        ? 'border border-[var(--surface-highlight-border)] bg-[var(--sidebar-item-active)] text-[var(--primary)] shadow-[var(--shadow-sm)]'
                                        : 'text-[var(--text-2)] hover:bg-[var(--sidebar-item-hover)] hover:text-[var(--text)]',
                                    compactNavigationClass,
                                )}
                                end={item.end === true}
                            >
                                <item.icon className="h-[18px] w-[18px] flex-shrink-0" />
                                <span className={cn(
                                    'whitespace-nowrap transition-all duration-200',
                                    mobile && 'block',
                                    !mobile && !collapsed && 'hidden lg:block',
                                    !mobile && collapsed && 'hidden max-w-0 translate-x-1 overflow-hidden opacity-0 lg:block group-hover/sidebar:max-w-40 group-hover/sidebar:translate-x-0 group-hover/sidebar:opacity-100',
                                )}>
                                    {t(item.labelKey)}
                                </span>
                            </NavLink>
                        </li>
                    ))}
                </ul>

                {isAdmin && !location.pathname.startsWith('/admin') && (
                    <>
                        <div className={cn('my-4 border-t border-[var(--divider)]', collapsed && 'mx-2')} />
                        {!collapsed && (
                            <div className={cn('mb-2 px-3', !mobile && 'hidden lg:block')}>
                                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-3)]">
                                    Admin
                                </span>
                            </div>
                        )}
                        <NavLink
                            to="/admin"
                            onClick={mobile ? onClose : undefined}
                            title="Admin Panel"
                            className={({ isActive }) => cn(
                                'flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
                                !mobile && collapsed ? 'gap-0 lg:group-hover/sidebar:gap-3' : 'gap-3',
                                isActive
                                    ? 'border border-[var(--surface-highlight-border)] bg-[var(--sidebar-item-active)] text-[var(--primary)] shadow-[var(--shadow-sm)]'
                                    : 'text-[var(--text-2)] hover:bg-[var(--sidebar-item-hover)] hover:text-[var(--text)]',
                                compactNavigationClass,
                            )}
                        >
                            <Shield className="h-[18px] w-[18px] flex-shrink-0" />
                            <span className={cn(
                                'whitespace-nowrap transition-all duration-200',
                                mobile && 'block',
                                !mobile && !collapsed && 'hidden lg:block',
                                !mobile && collapsed && 'hidden max-w-0 translate-x-1 overflow-hidden opacity-0 lg:block group-hover/sidebar:max-w-40 group-hover/sidebar:translate-x-0 group-hover/sidebar:opacity-100',
                            )}>
                                Admin Panel
                            </span>
                        </NavLink>
                    </>
                )}
            </nav>

            {!collapsed && user && (
                <div className={cn(
                    'flex-shrink-0 border-t border-[var(--sidebar-border)] p-4',
                    !mobile && 'hidden lg:block',
                )}>
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[var(--surface-3)]">
                            <span className="text-sm font-medium text-[var(--text)]">
                                {user.name.charAt(0).toUpperCase()}
                            </span>
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-[var(--text)]">{user.name}</p>
                            <p className="truncate text-xs text-[var(--text-2)]">{user.email}</p>
                        </div>
                    </div>
                </div>
            )}

        </aside>
    );
}
