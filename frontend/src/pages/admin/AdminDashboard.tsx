import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { Activity, AlertCircle, CheckSquare, Clock, TrendingUp, UserCheck, Users, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Line,
    LineChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { Button } from '../../components/ui';
import { showToast } from '../../components/ui/toast';
import api from '../../services/api';
import '../../admin-theme.css';

interface Stats {
    totalUsers: number;
    activeUsers: number;
    totalTasks: number;
    completedTasks: number;
    avgTasksPerUser: number;
    newUsersToday: number;
}

interface ActivityLog {
    id: string;
    userId: string;
    userName: string;
    action: string;
    details: string;
    timestamp: string;
    ipAddress: string;
}

const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const staggerContainer = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.08 } },
};

const tooltipStyle = {
    background: 'rgba(10,20,40,0.9)',
    border: '1px solid rgba(0,229,255,0.3)',
    borderRadius: 8,
    color: '#fff',
};

export function AdminDashboard() {
    const [stats, setStats] = useState<Stats>({
        totalUsers: 0,
        activeUsers: 0,
        totalTasks: 0,
        completedTasks: 0,
        avgTasksPerUser: 0,
        newUsersToday: 0,
    });
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        const fetchDashboard = async () => {
            try {
                const [statsResponse, logsResponse] = await Promise.all([
                    api.get('/admin/stats'),
                    api.get('/admin/activity-logs'),
                ]);

                if (!mounted) {
                    return;
                }

                setStats(statsResponse.data.data);
                setLogs(logsResponse.data.data);
            } catch {
                showToast.error('Load failed', 'Could not load admin dashboard data.');
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        void fetchDashboard();

        return () => {
            mounted = false;
        };
    }, []);

    const userGrowthData = useMemo(() => buildRegistrationSeries(logs), [logs]);
    const activityByHour = useMemo(() => buildActivityByHour(logs), [logs]);
    const recentActivity = useMemo(() => logs.slice(0, 6), [logs]);
    const taskBreakdown = useMemo(() => {
        const openTasks = Math.max(stats.totalTasks - stats.completedTasks, 0);

        return [
            { name: 'Done', value: stats.completedTasks, color: '#22C55E' },
            { name: 'Open', value: openTasks, color: '#3B82F6' },
        ];
    }, [stats.completedTasks, stats.totalTasks]);

    const statCards = [
        {
            title: 'Total users',
            value: stats.totalUsers,
            icon: Users,
            iconColor1: '#00E5FF',
            iconColor2: '#3B82F6',
            iconShadow: '#00E5FF',
            change: `+${stats.newUsersToday} today`,
        },
        {
            title: 'Active users',
            value: stats.activeUsers,
            icon: UserCheck,
            iconColor1: '#22C55E',
            iconColor2: '#10B981',
            iconShadow: '#22C55E',
            change: `${getPercent(stats.activeUsers, stats.totalUsers)}% of total`,
        },
        {
            title: 'Total tasks',
            value: stats.totalTasks,
            icon: CheckSquare,
            iconColor1: '#8B5CF6',
            iconColor2: '#EC4899',
            iconShadow: '#8B5CF6',
            change: `${stats.completedTasks} completed`,
        },
        {
            title: 'Avg tasks per user',
            value: stats.avgTasksPerUser.toFixed(1),
            icon: TrendingUp,
            iconColor1: '#F59E0B',
            iconColor2: '#EF4444',
            iconShadow: '#F59E0B',
            change: `${getPercent(stats.completedTasks, stats.totalTasks)}% completion`,
        },
    ];

    if (loading) {
        return (
            <div className="admin-theme admin-container flex items-center justify-center">
                <div className="admin-spinner" />
            </div>
        );
    }

    return (
        <div className="admin-theme admin-container p-6 transition-colors duration-300 md:p-8">
            <motion.div className="mb-8" initial="hidden" animate="visible" variants={fadeInUp}>
                <h1 className="admin-title mb-1">Admin Dashboard</h1>
                <p className="admin-title-sub">Live operational view for users, tasks and activity.</p>
            </motion.div>

            <motion.div
                className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-4"
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
            >
                {statCards.map((stat) => (
                    <motion.div
                        key={stat.title}
                        variants={fadeInUp}
                        className="admin-stat-card"
                        style={
                            {
                                '--icon-color-1': stat.iconColor1,
                                '--icon-color-2': stat.iconColor2,
                                '--icon-shadow': stat.iconShadow,
                            } as CSSProperties
                        }
                    >
                        <div className="mb-4 flex items-center justify-between">
                            <div className="stat-icon">
                                <stat.icon className="h-5 w-5 text-white" />
                            </div>
                            <div
                                className="admin-pulse h-2 w-2 rounded-full"
                                style={{ background: stat.iconColor1 }}
                            />
                        </div>
                        <p className="stat-title">{stat.title}</p>
                        <p className="stat-value">{stat.value}</p>
                        <p className="stat-change" style={{ color: stat.iconColor1 }}>
                            {stat.change}
                        </p>
                    </motion.div>
                ))}
            </motion.div>

            <motion.div
                className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2"
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
            >
                <motion.div variants={fadeInUp} className="admin-glass-card p-6">
                    <h3 className="mb-1 text-base font-semibold" style={{ color: 'var(--admin-text)' }}>
                        User registrations
                    </h3>
                    <p className="mb-6 text-xs" style={{ color: 'var(--admin-text-muted)' }}>
                        Real registrations from the last 7 days.
                    </p>
                    <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={userGrowthData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,229,255,0.1)" />
                            <XAxis
                                dataKey="day"
                                tick={{ fill: 'rgba(248,250,252,0.5)', fontSize: 12 }}
                                axisLine={{ stroke: 'rgba(0,229,255,0.2)' }}
                            />
                            <YAxis
                                allowDecimals={false}
                                tick={{ fill: 'rgba(248,250,252,0.5)', fontSize: 12 }}
                                axisLine={{ stroke: 'rgba(0,229,255,0.2)' }}
                            />
                            <Tooltip contentStyle={tooltipStyle} />
                            <Line
                                type="monotone"
                                dataKey="users"
                                stroke="#00E5FF"
                                strokeWidth={3}
                                dot={{ fill: '#00E5FF', r: 4 }}
                                activeDot={{ r: 6, fill: '#00E5FF' }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </motion.div>

                <motion.div variants={fadeInUp} className="admin-glass-card p-6">
                    <h3 className="mb-1 text-base font-semibold" style={{ color: 'var(--admin-text)' }}>
                        Task completion
                    </h3>
                    <p className="mb-6 text-xs" style={{ color: 'var(--admin-text-muted)' }}>
                        Live split between completed and open tasks.
                    </p>
                    <div className="flex items-center gap-6">
                        <ResponsiveContainer width="50%" height={220}>
                            <PieChart>
                                <Pie
                                    data={taskBreakdown}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={55}
                                    outerRadius={85}
                                    paddingAngle={3}
                                    dataKey="value"
                                >
                                    {taskBreakdown.map((entry) => (
                                        <Cell key={entry.name} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={tooltipStyle} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="flex-1 space-y-3">
                            {taskBreakdown.map((item) => (
                                <div key={item.name} className="flex items-center gap-3">
                                    <div
                                        className="h-3 w-3 flex-shrink-0 rounded-full"
                                        style={{ background: item.color }}
                                    />
                                    <span className="text-sm" style={{ color: 'var(--admin-text-secondary)' }}>
                                        {item.name}
                                    </span>
                                    <span
                                        className="ml-auto text-sm font-semibold"
                                        style={{ color: 'var(--admin-text)' }}
                                    >
                                        {item.value}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </motion.div>

            <motion.div
                variants={fadeInUp}
                initial="hidden"
                animate="visible"
                className="admin-glass-card mb-8 p-6"
            >
                <h3 className="mb-1 text-base font-semibold" style={{ color: 'var(--admin-text)' }}>
                    Activity by hour
                </h3>
                <p className="mb-6 text-xs" style={{ color: 'var(--admin-text-muted)' }}>
                    Distribution of recent activity log events by hour of day.
                </p>
                <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={activityByHour} barCategoryGap="30%">
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,229,255,0.1)" />
                        <XAxis
                            dataKey="hour"
                            tick={{ fill: 'rgba(248,250,252,0.5)', fontSize: 12 }}
                            axisLine={{ stroke: 'rgba(0,229,255,0.2)' }}
                        />
                        <YAxis
                            allowDecimals={false}
                            tick={{ fill: 'rgba(248,250,252,0.5)', fontSize: 12 }}
                            axisLine={{ stroke: 'rgba(0,229,255,0.2)' }}
                        />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Bar dataKey="activities" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </motion.div>

            <motion.div
                variants={fadeInUp}
                initial="hidden"
                animate="visible"
                className="admin-glass-card mb-8 p-6"
            >
                <h2
                    className="mb-5 flex items-center gap-2 text-lg font-semibold"
                    style={{ color: 'var(--admin-text)' }}
                >
                    <Zap className="h-5 w-5" style={{ color: '#00E5FF' }} />
                    Quick actions
                </h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <Link to="/admin/users">
                        <Button variant="outline" className="h-auto w-full justify-start py-4">
                            <Users className="mr-3 h-5 w-5" style={{ color: '#00E5FF' }} />
                            <div className="text-left">
                                <p className="font-medium" style={{ color: 'var(--admin-text)' }}>
                                    User management
                                </p>
                                <p className="text-xs" style={{ color: 'var(--admin-text-muted)' }}>
                                    Review and update accounts
                                </p>
                            </div>
                        </Button>
                    </Link>
                    <Link to="/admin/activity">
                        <Button variant="outline" className="h-auto w-full justify-start py-4">
                            <Activity className="mr-3 h-5 w-5" style={{ color: '#8B5CF6' }} />
                            <div className="text-left">
                                <p className="font-medium" style={{ color: 'var(--admin-text)' }}>
                                    Activity logs
                                </p>
                                <p className="text-xs" style={{ color: 'var(--admin-text-muted)' }}>
                                    Export and review recent events
                                </p>
                            </div>
                        </Button>
                    </Link>
                    <Link to="/admin/settings">
                        <Button variant="outline" className="h-auto w-full justify-start py-4">
                            <AlertCircle className="mr-3 h-5 w-5" style={{ color: '#F59E0B' }} />
                            <div className="text-left">
                                <p className="font-medium" style={{ color: 'var(--admin-text)' }}>
                                    Deployment settings
                                </p>
                                <p className="text-xs" style={{ color: 'var(--admin-text-muted)' }}>
                                    Review runtime configuration
                                </p>
                            </div>
                        </Button>
                    </Link>
                </div>
            </motion.div>

            <motion.div
                variants={fadeInUp}
                initial="hidden"
                animate="visible"
                className="admin-glass-card p-6"
            >
                <h2
                    className="mb-5 flex items-center gap-2 text-lg font-semibold"
                    style={{ color: 'var(--admin-text)' }}
                >
                    <Activity className="h-5 w-5" style={{ color: '#00E5FF' }} />
                    Recent activity
                </h2>
                <div className="space-y-3">
                    {recentActivity.length === 0 && (
                        <div className="rounded-xl p-4 text-sm" style={{ background: 'rgba(0,229,255,0.03)' }}>
                            No recent activity has been recorded yet.
                        </div>
                    )}

                    {recentActivity.map((log) => (
                        <div
                            key={log.id}
                            className="group flex items-center gap-4 rounded-xl p-3 transition-all duration-300"
                            style={{ background: 'rgba(0,229,255,0.03)' }}
                        >
                            <div
                                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg"
                                style={{ background: 'rgba(0,229,255,0.1)' }}
                            >
                                {getActivityIcon(log.action)}
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium" style={{ color: 'var(--admin-text)' }}>
                                    {log.details}
                                </p>
                                <p className="text-xs" style={{ color: 'var(--admin-text-muted)' }}>
                                    {log.userName} · {formatRelativeTime(log.timestamp)}
                                </p>
                            </div>
                            <div
                                className="h-2 w-2 flex-shrink-0 rounded-full"
                                style={{ background: getActivityColor(log.action) }}
                            />
                        </div>
                    ))}
                </div>
            </motion.div>
        </div>
    );
}

function buildRegistrationSeries(logs: ActivityLog[]) {
    const days = Array.from({ length: 7 }, (_, index) => {
        const date = new Date();
        date.setHours(0, 0, 0, 0);
        date.setDate(date.getDate() - (6 - index));

        return {
            key: date.toISOString().slice(0, 10),
            day: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            users: 0,
        };
    });

    const dayIndex = new Map(days.map((day) => [day.key, day]));

    logs.forEach((log) => {
        if (log.action !== 'REGISTER') {
            return;
        }

        const key = new Date(log.timestamp).toISOString().slice(0, 10);
        const bucket = dayIndex.get(key);
        if (bucket) {
            bucket.users += 1;
        }
    });

    return days;
}

function buildActivityByHour(logs: ActivityLog[]) {
    const hours = Array.from({ length: 24 }, (_, hour) => ({
        hour: `${hour.toString().padStart(2, '0')}:00`,
        activities: 0,
    }));

    logs.forEach((log) => {
        const timestamp = new Date(log.timestamp);
        const bucket = hours[timestamp.getHours()];
        if (bucket) {
            bucket.activities += 1;
        }
    });

    return hours;
}

function getPercent(part: number, total: number) {
    if (total === 0) {
        return 0;
    }

    return Math.round((part / total) * 100);
}

function getActivityIcon(action: string) {
    if (action.includes('TASK')) {
        return <CheckSquare className="h-5 w-5" style={{ color: '#8B5CF6' }} />;
    }

    if (action.includes('PROFILE')) {
        return <Clock className="h-5 w-5" style={{ color: '#F59E0B' }} />;
    }

    if (action === 'REGISTER') {
        return <Users className="h-5 w-5" style={{ color: '#00E5FF' }} />;
    }

    return <Activity className="h-5 w-5" style={{ color: '#22C55E' }} />;
}

function getActivityColor(action: string) {
    if (action.includes('TASK')) {
        return '#8B5CF6';
    }

    if (action.includes('PROFILE')) {
        return '#F59E0B';
    }

    if (action === 'REGISTER') {
        return '#00E5FF';
    }

    return '#22C55E';
}

function formatRelativeTime(timestamp: string) {
    const diffMs = Date.now() - new Date(timestamp).getTime();
    const diffMinutes = Math.max(Math.round(diffMs / 60000), 0);

    if (diffMinutes < 1) {
        return 'just now';
    }

    if (diffMinutes < 60) {
        return `${diffMinutes}m ago`;
    }

    const diffHours = Math.round(diffMinutes / 60);
    if (diffHours < 24) {
        return `${diffHours}h ago`;
    }

    const diffDays = Math.round(diffHours / 24);
    return `${diffDays}d ago`;
}
