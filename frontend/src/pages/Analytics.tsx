import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line,
} from 'recharts';
import { TrendingUp, Clock, CheckCircle2, AlertTriangle, Calendar } from 'lucide-react';
import { Badge, SkeletonStats, ErrorState } from '../components/ui';
import { dashboardService } from '../services/dashboard.service';
import { tasksService } from '../services/tasks.service';
import { cn } from '../lib/utils';

export function Analytics() {
    const { data: stats, isLoading: statsLoading, error: statsError, refetch: refetchStats } = useQuery({
        queryKey: ['dashboard', 'stats'],
        queryFn: dashboardService.getStats,
    });

    const { data: focusStats } = useQuery({
        queryKey: ['dashboard', 'focus'],
        queryFn: dashboardService.getFocusTime,
    });

    const { data: allTasksData } = useQuery({
        queryKey: ['tasks', 'all'],
        queryFn: () => tasksService.getAll({ limit: 1000 }),
    });

    // Calculate real statistics from tasks
    const taskStats = useMemo(() => {
        if (!allTasksData?.data) return null;

        const tasks = allTasksData.data;
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        // Weekly data
        const weeklyData = Array.from({ length: 7 }, (_, i) => {
            const date = new Date(weekAgo.getTime() + i * 24 * 60 * 60 * 1000);
            const dayTasks = tasks.filter(t => {
                const createdAt = new Date(t.createdAt);
                return createdAt.toDateString() === date.toDateString();
            });
            const completed = dayTasks.filter(t => t.status === 'DONE').length;

            return {
                day: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][date.getDay()],
                completed,
                focus: completed * 0.5, // Estimate focus hours
            };
        });

        // Status distribution
        const statusCounts = {
            TODO: tasks.filter(t => t.status === 'TODO').length,
            IN_PROGRESS: tasks.filter(t => t.status === 'IN_PROGRESS').length,
            DONE: tasks.filter(t => t.status === 'DONE').length,
            OVERDUE: tasks.filter(t => {
                if (t.status === 'DONE' || !t.dueAt) return false;
                return new Date(t.dueAt) < now;
            }).length,
        };

        const statusData = [
            { name: 'Hoàn thành', value: statusCounts.DONE, color: '#10b981' },
            { name: 'Đang làm', value: statusCounts.IN_PROGRESS, color: '#3b82f6' },
            { name: 'Chưa làm', value: statusCounts.TODO, color: '#6b7280' },
            { name: 'Quá hạn', value: statusCounts.OVERDUE, color: '#ef4444' },
        ];

        // Productivity by hour (based on task creation time)
        const hourCounts = new Array(24).fill(0);
        tasks.forEach(task => {
            const hour = new Date(task.createdAt).getHours();
            hourCounts[hour]++;
        });

        const peakHour = hourCounts.indexOf(Math.max(...hourCounts));
        const productivityData = [
            { hour: '6h', tasks: hourCounts[6] },
            { hour: '8h', tasks: hourCounts[8] },
            { hour: '10h', tasks: hourCounts[10] },
            { hour: '12h', tasks: hourCounts[12] },
            { hour: '14h', tasks: hourCounts[14] },
            { hour: '16h', tasks: hourCounts[16] },
            { hour: '18h', tasks: hourCounts[18] },
            { hour: '20h', tasks: hourCounts[20] },
        ];

        // Completion rate
        const totalTasks = tasks.length;
        const completedTasks = statusCounts.DONE;
        const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        return {
            weeklyData,
            statusData,
            productivityData,
            peakHour,
            completionRate,
            totalTasks,
            completedTasks,
        };
    }, [allTasksData]);

    if (statsError) {
        return <ErrorState onRetry={refetchStats} />;
    }

    return (
        <div className="space-y-6 pb-20 md:pb-0">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text)]">Thống kê</h1>
                    <p className="text-[var(--text-2)]">Phân tích năng suất của bạn</p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="gap-1">
                        <Calendar className="w-3 h-3" />
                        7 ngày qua
                    </Badge>
                </div>
            </div>

            {/* Stats Cards */}
            {statsLoading || !taskStats ? (
                <SkeletonStats count={4} />
            ) : (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        title="Tổng hoàn thành"
                        value={taskStats.completedTasks}
                        change={`${taskStats.completionRate}%`}
                        positive
                        icon={CheckCircle2}
                    />
                    <StatCard
                        title="Giờ Focus"
                        value={focusStats?.totalHours || 0}
                        suffix="h"
                        change="+8%"
                        positive
                        icon={Clock}
                    />
                    <StatCard
                        title="Tỷ lệ hoàn thành"
                        value={taskStats.completionRate}
                        suffix="%"
                        change={taskStats.completionRate > 50 ? '+5%' : '-5%'}
                        positive={taskStats.completionRate > 50}
                        icon={TrendingUp}
                    />
                    <StatCard
                        title="Quá hạn"
                        value={stats?.tasksOverdue || 0}
                        change={stats?.tasksOverdue === 0 ? '✓' : '-2'}
                        positive={stats?.tasksOverdue === 0}
                        icon={AlertTriangle}
                    />
                </div>
            )}

            {/* Charts Grid */}
            {taskStats && (
                <div className="grid lg:grid-cols-2 gap-6">
                    {/* Weekly Progress */}
                    <div className="card p-6">
                        <h3 className="font-semibold text-[var(--text)] mb-4">
                            Tiến độ tuần này
                        </h3>
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={taskStats.weeklyData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                <XAxis dataKey="day" stroke="var(--text-3)" fontSize={12} />
                                <YAxis stroke="var(--text-3)" fontSize={12} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'var(--surface-2)',
                                        border: '1px solid var(--border)',
                                        borderRadius: '8px',
                                        color: 'var(--text)',
                                    }}
                                    labelStyle={{ color: 'var(--text)' }}
                                />
                                <Bar dataKey="completed" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Hoàn thành" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Task Status Distribution */}
                    <div className="card p-6">
                        <h3 className="font-semibold text-[var(--text)] mb-4">
                            Phân bố trạng thái
                        </h3>
                        <div className="flex items-center">
                            <ResponsiveContainer width="50%" height={200}>
                                <PieChart>
                                    <Pie
                                        data={taskStats.statusData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={80}
                                        paddingAngle={2}
                                        dataKey="value"
                                    >
                                        {taskStats.statusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="flex-1 space-y-2">
                                {taskStats.statusData.map((item) => (
                                    <div key={item.name} className="flex items-center gap-2">
                                        <div
                                            className="w-3 h-3 rounded-full"
                                            style={{ backgroundColor: item.color }}
                                        />
                                        <span className="text-sm text-[var(--text-2)]">
                                            {item.name}
                                        </span>
                                        <span className="ml-auto text-sm font-medium text-[var(--text)]">
                                            {item.value}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Focus Time */}
                    <div className="card p-6">
                        <h3 className="font-semibold text-[var(--text)] mb-4">
                            Thời gian Focus
                        </h3>
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={taskStats.weeklyData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                <XAxis dataKey="day" stroke="var(--text-3)" fontSize={12} />
                                <YAxis stroke="var(--text-3)" fontSize={12} unit="h" />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'var(--surface-2)',
                                        border: '1px solid var(--border)',
                                        borderRadius: '8px',
                                        color: 'var(--text)',
                                    }}
                                />
                                <Bar dataKey="focus" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Giờ Focus" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Peak Productivity Hours */}
                    <div className="card p-6">
                        <h3 className="font-semibold text-[var(--text)] mb-4">
                            Giờ năng suất cao nhất
                        </h3>
                        <ResponsiveContainer width="100%" height={250}>
                            <LineChart data={taskStats.productivityData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                <XAxis dataKey="hour" stroke="var(--text-3)" fontSize={12} />
                                <YAxis stroke="var(--text-3)" fontSize={12} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'var(--surface-2)',
                                        border: '1px solid var(--border)',
                                        borderRadius: '8px',
                                        color: 'var(--text)',
                                    }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="tasks"
                                    stroke="#10b981"
                                    strokeWidth={2}
                                    dot={{ fill: '#10b981', strokeWidth: 2 }}
                                    name="Công việc"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                        <p className="text-sm text-[var(--text-2)] mt-2 text-center">
                            🎯 Bạn năng suất nhất vào lúc <strong>{taskStats.peakHour}h</strong>
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

// Stat Card Component
interface StatCardProps {
    title: string;
    value: number;
    suffix?: string;
    change: string;
    positive: boolean;
    icon: React.ElementType;
}

function StatCard({ title, value, suffix, change, positive, icon: Icon }: StatCardProps) {
    return (
        <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-[var(--surface-2)]">
                    <Icon className="w-5 h-5 text-[var(--text-2)]" />
                </div>
                <span
                    className={cn(
                        'text-xs font-medium px-2 py-0.5 rounded-full',
                        positive
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    )}
                >
                    {change}
                </span>
            </div>
            <p className="text-2xl font-bold text-[var(--text)]">
                {value}{suffix}
            </p>
            <p className="text-sm text-[var(--text-2)]">{title}</p>
        </div>
    );
}
