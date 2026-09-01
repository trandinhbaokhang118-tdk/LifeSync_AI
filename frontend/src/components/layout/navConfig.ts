import {
    LayoutDashboard,
    CheckSquare,
    Calendar,
    CalendarRange,
    Timer,
    BarChart3,
    Bell,
    Settings,
    Users,
    Activity,
    Database,
    Cog,
    Zap,
    Footprints,
    type LucideIcon,
} from 'lucide-react';

export interface NavItem {
    path: string;
    icon: LucideIcon;
    /** Fallback label (Vietnamese) when no translation is wired. */
    label: string;
    /** i18n key for the label, resolved via useTranslation. */
    labelKey: string;
    end?: boolean;
}

export const userNavItems: NavItem[] = [
    { path: '/app', icon: LayoutDashboard, label: 'Dashboard', labelKey: 'nav.dashboard', end: true },
    { path: '/app/tasks', icon: CheckSquare, label: 'Công việc', labelKey: 'nav.tasks' },
    { path: '/app/calendar', icon: Calendar, label: 'Lịch', labelKey: 'nav.calendar' },
    { path: '/app/planner', icon: CalendarRange, label: 'Lập kế hoạch', labelKey: 'nav.planner' },
    { path: '/app/focus', icon: Timer, label: 'Focus', labelKey: 'nav.focus' },
    { path: '/app/analytics', icon: BarChart3, label: 'Thống kê', labelKey: 'nav.analytics' },
    { path: '/app/fitness', icon: Activity, label: 'Fitness', labelKey: 'nav.fitness' },
    { path: '/app/gps-tracking', icon: Footprints, label: 'Track Lab', labelKey: 'nav.trackLab' },
    { path: '/app/pricing', icon: Zap, label: 'Nâng cấp Pro', labelKey: 'nav.pricing' },
    { path: '/app/notifications', icon: Bell, label: 'Thông báo', labelKey: 'nav.notifications' },
    { path: '/app/settings', icon: Settings, label: 'Cài đặt', labelKey: 'nav.settings' },
];

export const adminNavItems: NavItem[] = [
    { path: '/admin', icon: LayoutDashboard, label: 'Admin Dashboard', labelKey: 'nav.dashboard', end: true },
    { path: '/admin/users', icon: Users, label: 'Người dùng', labelKey: 'nav.users' },
    { path: '/admin/activity', icon: Activity, label: 'Hoạt động', labelKey: 'nav.activity' },
    { path: '/admin/database', icon: Database, label: 'Database', labelKey: 'nav.database' },
    { path: '/admin/settings', icon: Cog, label: 'Hệ thống', labelKey: 'nav.system' },
];

/**
 * Resolve the nav item that best matches the current pathname.
 * Picks the longest matching path so nested routes still resolve correctly.
 */
export function getActiveNavItem(pathname: string): NavItem | undefined {
    const items = pathname.startsWith('/admin') ? adminNavItems : userNavItems;

    let best: NavItem | undefined;
    for (const item of items) {
        const matches = item.end ? pathname === item.path : pathname === item.path || pathname.startsWith(`${item.path}/`);
        if (matches && (!best || item.path.length > best.path.length)) {
            best = item;
        }
    }

    return best;
}
