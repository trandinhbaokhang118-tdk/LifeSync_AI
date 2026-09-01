import { useEffect, useMemo, useState } from 'react';
import type { ElementType, MouseEvent as ReactMouseEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { useReducedMotion } from 'framer-motion';
import {
    AlertTriangle,
    ArrowRight,
    Calendar,
    CheckCircle2,
    Clock3,
    Plus,
    Sparkles,
    Target,
    Timer,
    TrendingUp,
    Zap,
} from 'lucide-react';
import { AIScheduleModal } from '../components/ai-schedule/AIScheduleModal';
import { ErrorState } from '../components/ui';
import { cn, formatDate, isOverdue } from '../lib/utils';
import { dashboardService } from '../services/dashboard.service';
import { tasksService } from '../services/tasks.service';
import { useAuthStore } from '../store/auth.store';
import type { Task } from '../types';
import './dashboard-enterprise.css';

const numberFormatter = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 });

export function Dashboard() {
    const { user } = useAuthStore();
    const [showAISchedule, setShowAISchedule] = useState(false);

    const { data: stats, isLoading: statsLoading, error: statsError, refetch: refetchStats } = useQuery({
        queryKey: ['dashboard', 'stats'],
        queryFn: dashboardService.getStats,
    });

    const { data: tasksData, isLoading: tasksLoading } = useQuery({
        queryKey: ['tasks', { limit: 10, sortBy: 'dueAt', sortOrder: 'asc', status: 'TODO' }],
        queryFn: () =>
            tasksService.getAll({
                limit: 10,
                sortBy: 'dueAt',
                sortOrder: 'asc',
                status: 'TODO',
            }),
    });

    const { data: focusStats, isLoading: focusLoading } = useQuery({
        queryKey: ['dashboard', 'focus'],
        queryFn: dashboardService.getFocusTime,
    });

    const upcomingTasks = tasksData?.data ?? [];
    const nextTask = upcomingTasks[0];
    const firstName = user?.name?.trim().split(/\s+/).at(-1) || 'bạn';
    const todayLabel = useMemo(
        () => formatDate(new Date(), { weekday: 'long', day: 'numeric', month: 'long' }),
        [],
    );

    if (statsError) {
        return <ErrorState onRetry={refetchStats} />;
    }

    return (
        <div className="dashboard-workbench pb-20 md:pb-0">
            <section className="dashboard-hero dash-enter" aria-labelledby="dashboard-heading">
                <figure className="dashboard-hero__media" aria-hidden="true">
                    <img
                        src="/dashboard/performance-dawn-v1.webp"
                        alt=""
                        width="1600"
                        height="855"
                        fetchPriority="high"
                    />
                </figure>
                <div className="dashboard-hero__scrim" aria-hidden="true" />

                <div className="dashboard-hero__content">
                    <div className="dashboard-hero__copy">
                        <p className="dashboard-kicker">
                            <span aria-hidden="true" />
                            Nhịp hôm nay
                        </p>
                        <h1 id="dashboard-heading">
                            {getGreeting()},
                            <br />
                            {firstName}.
                        </h1>
                        <p className="dashboard-date">{todayLabel}</p>
                    </div>

                    <div className="dashboard-hero__next" aria-live="polite">
                        <span className="dashboard-hero__next-label">Ưu tiên kế tiếp</span>
                        {tasksLoading ? (
                            <div className="dashboard-hero__loading" aria-label="Đang tải công việc" />
                        ) : nextTask ? (
                            <>
                                <strong>{nextTask.title}</strong>
                                <span>{formatTaskTime(nextTask.dueAt)}</span>
                            </>
                        ) : (
                            <>
                                <strong>Chưa có việc cần xử lý</strong>
                                <span>Bắt đầu bằng một kế hoạch ngắn, rõ ràng.</span>
                            </>
                        )}
                    </div>

                    <div className="dashboard-hero__actions">
                        <Link className="dashboard-action dashboard-action--primary" to="/app/focus">
                            <Zap size={20} aria-hidden="true" />
                            Bắt đầu tập trung
                        </Link>
                        <button
                            type="button"
                            className="dashboard-action dashboard-action--secondary"
                            onClick={() => setShowAISchedule(true)}
                        >
                            <Sparkles size={20} aria-hidden="true" />
                            Sắp xếp bằng AI
                        </button>
                    </div>
                </div>

                <figcaption className="dashboard-hero__caption">
                    Performance mode <span aria-hidden="true">·</span> LifeSync AI
                </figcaption>
            </section>

            <section className="dashboard-metrics dash-enter" aria-label="Tổng quan hiệu suất">
                {statsLoading || focusLoading ? (
                    Array.from({ length: 4 }, (_, index) => <MetricSkeleton key={index} />)
                ) : (
                    <>
                        <Metric
                            label="Việc hôm nay"
                            value={stats?.tasksDueToday ?? 0}
                            icon={Target}
                            tone="accent"
                        />
                        <Metric
                            label="Đang quá hạn"
                            value={stats?.tasksOverdue ?? 0}
                            icon={AlertTriangle}
                            tone={stats?.tasksOverdue ? 'danger' : 'neutral'}
                        />
                        <Metric
                            label="Xong trong tuần"
                            value={stats?.tasksCompletedThisWeek ?? 0}
                            icon={CheckCircle2}
                            tone="success"
                        />
                        <Metric
                            label="Focus tuần này"
                            value={focusStats?.totalHours ?? 0}
                            suffix=" giờ"
                            icon={TrendingUp}
                            tone="neutral"
                        />
                    </>
                )}
            </section>

            <div className="dashboard-grid dash-enter">
                <section className="dashboard-taskboard" aria-labelledby="upcoming-heading">
                    <div className="dashboard-section-head">
                        <div>
                            <h2 id="upcoming-heading">Việc ưu tiên tiếp theo</h2>
                            <p>Tối đa 10 công việc chưa hoàn thành, sắp theo hạn gần nhất.</p>
                        </div>
                        <Link className="dashboard-text-link" to="/app/tasks">
                            Xem tất cả
                            <ArrowRight size={16} aria-hidden="true" />
                        </Link>
                    </div>

                    <div className="dashboard-task-list">
                        {tasksLoading ? (
                            Array.from({ length: 4 }, (_, index) => <TaskSkeleton key={index} />)
                        ) : upcomingTasks.length > 0 ? (
                            upcomingTasks.map((task, index) => (
                                <TaskItem key={task.id} task={task} order={index + 1} />
                            ))
                        ) : (
                            <div className="dashboard-empty">
                                <CheckCircle2 size={32} aria-hidden="true" />
                                <div>
                                    <h3>Danh sách đang trống.</h3>
                                    <p>Tạo một công việc để định hình nhịp tiếp theo.</p>
                                </div>
                                <Link className="dashboard-action dashboard-action--secondary" to="/app/tasks?new=true">
                                    <Plus size={20} aria-hidden="true" />
                                    Tạo công việc
                                </Link>
                            </div>
                        )}
                    </div>
                </section>

                <aside className="dashboard-rail" aria-label="Thao tác và gợi ý">
                    <section className="dashboard-quick" aria-labelledby="quick-heading">
                        <div className="dashboard-section-head dashboard-section-head--compact">
                            <div>
                                <h2 id="quick-heading">Chuyển nhịp nhanh</h2>
                                <p>Một chạm đến hành động thường dùng.</p>
                            </div>
                        </div>
                        <nav aria-label="Thao tác nhanh">
                            <QuickAction icon={Plus} label="Tạo công việc" detail="Ghi lại việc mới" to="/app/tasks?new=true" />
                            <QuickAction icon={Calendar} label="Mở lịch" detail="Xem khung thời gian" to="/app/calendar" />
                            <QuickAction
                                icon={Timer}
                                label="Bắt đầu Pomodoro"
                                detail="25 phút · toàn màn hình"
                                to="/app/focus?start=true"
                                startFullscreen
                            />
                        </nav>
                    </section>

                    <section className="dashboard-coach" aria-labelledby="coach-heading">
                        <div className="dashboard-coach__mark" aria-hidden="true">
                            <Sparkles size={20} />
                        </div>
                        <div>
                            <h2 id="coach-heading">Giữ một nhịp rõ ràng.</h2>
                            <p>Chọn việc khó nhất, dành cho nó một phiên tập trung, rồi mới mở rộng lịch.</p>
                        </div>
                        <button type="button" className="dashboard-text-link" onClick={() => setShowAISchedule(true)}>
                            Để AI sắp lịch
                            <ArrowRight size={16} aria-hidden="true" />
                        </button>
                    </section>
                </aside>
            </div>

            <AIScheduleModal open={showAISchedule} onOpenChange={setShowAISchedule} />
        </div>
    );
}

function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Chào buổi sáng';
    if (hour < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
}

function formatTaskTime(value?: string) {
    if (!value) return 'Chưa đặt thời hạn';
    return formatDate(value, { weekday: 'short', hour: '2-digit', minute: '2-digit' });
}

interface MetricProps {
    label: string;
    value: number;
    suffix?: string;
    icon: ElementType;
    tone: 'accent' | 'danger' | 'success' | 'neutral';
}

function Metric({ label, value, suffix = '', icon: Icon, tone }: MetricProps) {
    return (
        <div className={cn('dashboard-metric', `dashboard-metric--${tone}`)}>
            <div className="dashboard-metric__label">
                <Icon size={20} aria-hidden="true" />
                <span>{label}</span>
            </div>
            <p className="dashboard-metric__value">
                <AnimatedNumber value={value} />
                <span>{suffix}</span>
            </p>
        </div>
    );
}

function AnimatedNumber({ value }: { value: number }) {
    const reduceMotion = useReducedMotion();
    const [displayValue, setDisplayValue] = useState(reduceMotion ? value : 0);

    useEffect(() => {
        if (reduceMotion) {
            setDisplayValue(value);
            return;
        }

        const startedAt = performance.now();
        let frame = 0;
        const duration = 400;
        const tick = (now: number) => {
            const progress = Math.min((now - startedAt) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplayValue(value * eased);
            if (progress < 1) frame = requestAnimationFrame(tick);
        };

        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
    }, [reduceMotion, value]);

    return <span aria-label={numberFormatter.format(value)}>{numberFormatter.format(displayValue)}</span>;
}

function MetricSkeleton() {
    return (
        <div className="dashboard-metric dashboard-skeleton" aria-hidden="true">
            <span />
            <strong />
        </div>
    );
}

function TaskSkeleton() {
    return (
        <div className="dashboard-task dashboard-task--loading" aria-hidden="true">
            <span />
            <div><strong /><small /></div>
        </div>
    );
}

function TaskItem({ task, order }: { task: Task; order: number }) {
    const overdue = task.status !== 'DONE' && isOverdue(task.dueAt);

    return (
        <Link to={`/app/tasks?id=${task.id}`} className="dashboard-task">
            <span className="dashboard-task__index" aria-hidden="true">{String(order).padStart(2, '0')}</span>
            <div className="dashboard-task__body">
                <div className="dashboard-task__title-row">
                    <h3>{task.title}</h3>
                    {task.priority === 'HIGH' && <span className="dashboard-priority">Ưu tiên cao</span>}
                </div>
                <p className={cn(overdue && 'is-overdue')}>
                    <Clock3 size={16} aria-hidden="true" />
                    {formatTaskTime(task.dueAt)}
                    {overdue && <span>Quá hạn</span>}
                </p>
            </div>
            <ArrowRight className="dashboard-task__arrow" size={20} aria-hidden="true" />
        </Link>
    );
}

interface QuickActionProps {
    icon: ElementType;
    label: string;
    detail: string;
    to: string;
    startFullscreen?: boolean;
}

function QuickAction({ icon: Icon, label, detail, to, startFullscreen = false }: QuickActionProps) {
    const navigate = useNavigate();

    const handleClick = (event: ReactMouseEvent<HTMLAnchorElement>) => {
        if (
            !startFullscreen
            || event.button !== 0
            || event.metaKey
            || event.ctrlKey
            || event.shiftKey
            || event.altKey
        ) {
            return;
        }

        event.preventDefault();

        if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
            void document.documentElement.requestFullscreen().catch(() => undefined);
        }

        navigate(to);
    };

    return (
        <Link className="dashboard-quick-action" to={to} onClick={handleClick}>
            <Icon size={20} aria-hidden="true" />
            <span>
                <strong>{label}</strong>
                <small>{detail}</small>
            </span>
            <ArrowRight size={16} aria-hidden="true" />
        </Link>
    );
}
