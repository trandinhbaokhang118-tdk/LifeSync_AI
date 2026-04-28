import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock3, Flame, Footprints, MapPin, Play, Settings, Target } from 'lucide-react';
import type { ReactNode } from 'react';
import { showToast } from '../components/ui';
import { healthDevicesService } from '../services/health-devices.service';
import { fitnessService } from '../services/fitness.service';
import type { DailyActivity, Exercise, FitnessProfile, HealthProvider, WeeklyStats } from '../types';

type QuickStartMode = 'running' | 'walking' | 'cycling' | 'hiking';

const ActivityIcon = ({ category, size = 20 }: { category: string; size?: number }) => {
    const icons: Record<string, string> = {
        cardio: '🏃',
        running: '🏃',
        cycling: '🚴',
        swimming: '🏊',
        walking: '🚶',
        hiking: '🥾',
        strength: '🏋️',
        flexibility: '🧘',
    };

    return <span style={{ fontSize: size }}>{icons[category] || '💪'}</span>;
};

const workoutQuickStarts: Array<{ mode: QuickStartMode; label: string; note: string }> = [
    { mode: 'running', label: 'Run', note: 'Tempo or easy distance' },
    { mode: 'walking', label: 'Walk', note: 'Reset energy gently' },
    { mode: 'cycling', label: 'Ride', note: 'Aerobic outdoor block' },
    { mode: 'hiking', label: 'Hike', note: 'Longer endurance climb' },
];

export function Fitness() {
    const [profile, setProfile] = useState<FitnessProfile | null>(null);
    const [todayActivity, setTodayActivity] = useState<DailyActivity | null>(null);
    const [weeklyStats, setWeeklyStats] = useState<WeeklyStats | null>(null);
    const [allExercises, setAllExercises] = useState<Exercise[]>([]);
    const [recentExercises, setRecentExercises] = useState<Exercise[]>([]);
    const [loading, setLoading] = useState(true);
    const [connectingProvider, setConnectingProvider] = useState<HealthProvider | null>(null);

    useEffect(() => {
        void loadData();
    }, []);

    async function loadData() {
        try {
            const [profileData, activityData, statsData, exercisesData] = await Promise.all([
                fitnessService.getProfile(),
                fitnessService.getDailyActivity(),
                fitnessService.getWeeklyStats(),
                fitnessService.getExercises(),
            ]);
            setProfile(profileData);
            setTodayActivity(activityData);
            setWeeklyStats(statsData);
            setAllExercises(exercisesData);
            setRecentExercises(exercisesData.slice(0, 5));
        } catch (error) {
            console.error('Failed to load fitness data:', error);
            showToast.error('Could not load Fitness', 'The page is still here, but its activity data did not arrive cleanly.');
        } finally {
            setLoading(false);
        }
    }

    async function handleConnectHealth(provider: HealthProvider) {
        if (connectingProvider || profile?.healthConnect) {
            return;
        }

        setConnectingProvider(provider);
        try {
            const updatedProfile = await fitnessService.connectHealthDevice(provider);
            setProfile(updatedProfile);
            healthDevicesService.connect(provider);
            showToast.success(
                'Health sync connected',
                provider === 'apple_health'
                    ? 'Apple Health is now linked. You can open Device Connections to sync activity data.'
                    : 'Google Fit is now linked. You can open Device Connections to sync activity data.'
            );
        } catch (error) {
            console.error('Failed to connect health provider:', error);
            showToast.error('Could not connect health sync', 'Try again after the backend is available.');
        } finally {
            setConnectingProvider(null);
        }
    }

    if (loading) {
        return (
            <div className="page-shell flex items-center justify-center">
                <div className="relative">
                    <div className="h-12 w-12 rounded-full border-4 border-[var(--surface-highlight-border)]" />
                    <div className="absolute left-0 top-0 h-12 w-12 animate-spin rounded-full border-4 border-[var(--primary)] border-t-transparent" />
                </div>
            </div>
        );
    }

    const stepGoal = profile?.stepGoal ?? 0;
    const steps = todayActivity?.steps ?? 0;
    const stepsProgress = stepGoal > 0 ? Math.min((steps / stepGoal) * 100, 100) : 0;
    const challenge = buildMonthlyChallenge(allExercises);
    const weeklyDistance = weeklyStats?.totalDistance ?? 0;
    const todaySessions = allExercises.filter((exercise) => isSameCalendarDay(exercise.performedAt, new Date())).length;

    return (
        <div className="page-shell pb-24">
            <div className="mx-auto max-w-5xl space-y-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold md:text-3xl">
                            <span className="bg-[image:var(--primary-gradient)] bg-clip-text text-transparent">
                                Fitness
                            </span>
                        </h1>
                        <p className="text-[var(--text-2)]">Track movement, start the next workout fast, and keep your month moving forward.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Link
                            to="/app/fitness/history"
                            className="surface-soft inline-flex h-11 items-center gap-2 px-4 text-sm font-medium transition-colors hover:border-[var(--surface-highlight-border)] hover:text-[var(--primary)]"
                        >
                            Workout history
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                        <Link
                            to="/app/fitness/devices"
                            className="surface-soft inline-flex h-11 items-center gap-2 px-4 text-sm font-medium transition-colors hover:border-[var(--surface-highlight-border)] hover:text-[var(--primary)]"
                        >
                            Device sync
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                        <Link
                            to="/app/fitness/profile"
                            className="surface-soft flex h-11 w-11 items-center justify-center transition-colors hover:border-[var(--surface-highlight-border)] hover:text-[var(--primary)]"
                            aria-label="Open fitness profile"
                        >
                            <Settings className="h-5 w-5" />
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    <SummaryCard
                        icon={<MapPin className="h-4 w-4" />}
                        label="Distance"
                        value={(todayActivity?.distance || 0).toFixed(1)}
                        unit="km"
                    />
                    <SummaryCard
                        icon={<Flame className="h-4 w-4" />}
                        label="Calories"
                        value={String(todayActivity?.calories || 0)}
                        unit="cal"
                    />
                    <SummaryCard
                        icon={<Clock3 className="h-4 w-4" />}
                        label="Active"
                        value={String(todayActivity?.activeMinutes || 0)}
                        unit="min"
                    />
                    <SummaryCard
                        icon={<Footprints className="h-4 w-4" />}
                        label="Steps"
                        value={steps.toLocaleString()}
                    />
                </div>

                <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
                    <div className="fitness-card p-5">
                        <div className="mb-3 flex items-center justify-between">
                            <span className="text-sm font-medium text-[var(--text)]">Daily steps goal</span>
                            <span className="text-sm font-semibold text-[var(--primary)]">{Math.round(stepsProgress)}%</span>
                        </div>
                        <div className="h-3 overflow-hidden rounded-full bg-[var(--panel-soft)]">
                            <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                    width: `${stepsProgress}%`,
                                    background: 'var(--primary-gradient)',
                                    boxShadow: 'var(--primary-glow)',
                                }}
                            />
                        </div>
                        <div className="mt-3 flex items-center justify-between text-xs text-[var(--text-2)]">
                            <span>
                                {steps.toLocaleString()} / {stepGoal.toLocaleString()} steps
                            </span>
                            <span>{todaySessions} workout{todaySessions === 1 ? '' : 's'} today</span>
                        </div>
                    </div>

                    <div className="fitness-card p-5">
                        <div className="mb-3 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-[var(--text)]">Weekly momentum</p>
                                <p className="text-xs text-[var(--text-2)]">Live view from synced days and recorded workouts.</p>
                            </div>
                            <span className="rounded-full border border-[var(--surface-highlight-border)] px-3 py-1 text-xs font-semibold text-[var(--primary)]">
                                {weeklyDistance.toFixed(1)} km
                            </span>
                        </div>
                        <div className="grid grid-cols-3 gap-3 text-sm">
                            <MiniMetric label="Sessions" value={String(allExercises.slice(0, 7).length)} />
                            <MiniMetric label="Avg HR" value={String(weeklyStats?.avgHeartRate || 0)} />
                            <MiniMetric label="Active" value={`${weeklyStats?.totalActiveMinutes || 0}m`} />
                        </div>
                    </div>
                </div>

                <div className="fitness-card p-5">
                    <div className="mb-4 flex items-center justify-between">
                        <div>
                            <h3 className="font-semibold text-[var(--text)]">Start a workout</h3>
                            <p className="text-sm text-[var(--text-2)]">Jump straight into Track Lab with the session type already selected.</p>
                        </div>
                        <span className="rounded-full border border-[var(--surface-highlight-border)] px-3 py-1 text-xs font-semibold text-[var(--primary)]">
                            Quick launch
                        </span>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        {workoutQuickStarts.map((item) => (
                            <Link
                                key={item.mode}
                                to="/app/gps-tracking"
                                state={{ preferredMode: item.mode, autoStart: true }}
                                className="surface-soft group rounded-2xl p-4 transition-colors hover:border-[var(--surface-highlight-border)]"
                            >
                                <div className="mb-3 flex items-center justify-between">
                                    <span className="text-2xl">
                                        <ActivityIcon category={item.mode} size={24} />
                                    </span>
                                    <Play className="h-4 w-4 text-[var(--primary)] transition-transform group-hover:translate-x-0.5" />
                                </div>
                                <p className="font-medium text-[var(--text)]">{item.label}</p>
                                <p className="mt-1 text-xs leading-5 text-[var(--text-2)]">{item.note}</p>
                            </Link>
                        ))}
                    </div>
                </div>

                <div className="challenge-banner p-5">
                    <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div>
                            <div className="mb-2 flex items-center gap-2 text-[var(--primary)]">
                                <Target className="h-4 w-4" />
                                <span className="text-xs font-semibold uppercase tracking-[0.2em]">Monthly challenge</span>
                            </div>
                            <h3 className="font-semibold text-[var(--text)]">{challenge.title}</h3>
                            <p className="mt-1 text-sm text-[var(--text-2)]">{challenge.note}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xl font-bold text-[var(--primary)]">{challenge.progressLabel}</p>
                            <p className="text-xs text-[var(--text-2)]">{challenge.remainingLabel}</p>
                        </div>
                    </div>
                    <div className="relative z-10 mt-4 h-2 overflow-hidden rounded-full bg-[var(--panel-soft)]">
                        <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${challenge.progressPercent}%`, background: 'var(--primary-gradient)' }}
                        />
                    </div>
                    <div className="relative z-10 mt-4 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap gap-2 text-xs text-[var(--text-2)]">
                            <span className="rounded-full border border-white/10 px-3 py-1">{challenge.sessions} sessions this month</span>
                            <span className="rounded-full border border-white/10 px-3 py-1">{challenge.avgDistanceLabel}</span>
                        </div>
                        <Link
                            to="/app/gps-tracking"
                            state={{ preferredMode: challenge.preferredMode }}
                            className="inline-flex items-center gap-2 text-sm font-medium text-[var(--primary)] transition-colors hover:text-[var(--text)]"
                        >
                            Keep challenge moving
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>
                </div>

                <div className="fitness-card p-5">
                    <h3 className="mb-4 font-semibold text-[var(--text)]">This week</h3>
                    <div className="flex h-24 items-end justify-between gap-2">
                        {weeklyStats?.days.map((day, index) => {
                            const maxSteps = Math.max(...(weeklyStats?.days.map((item) => item.steps) || [1]), 1);
                            const height = (day.steps / maxSteps) * 100;
                            const dayName = new Date(day.date)
                                .toLocaleDateString('en', { weekday: 'short' })
                                .slice(0, 1);

                            return (
                                <div key={index} className="flex flex-1 flex-col items-center">
                                    <div className="flex w-6 justify-center">
                                        <div
                                            className="w-5 rounded-t-md transition-all duration-300"
                                            style={{
                                                height: `${Math.max(height, 4)}%`,
                                                background: 'var(--primary-gradient)',
                                                boxShadow: height > 50 ? 'var(--primary-glow)' : 'none',
                                            }}
                                        />
                                    </div>
                                    <span className="mt-2 text-xs text-[var(--text-2)]">{dayName}</span>
                                </div>
                            );
                        })}
                    </div>
                    <div className="mt-4 flex justify-around border-t border-[var(--divider)] pt-4">
                        <WeeklyStat label="Total steps" value={(weeklyStats?.totalSteps || 0).toLocaleString()} />
                        <WeeklyStat label="Calories" value={String(weeklyStats?.totalCalories || 0)} tone="warning" />
                        <WeeklyStat label="Minutes" value={String(weeklyStats?.totalActiveMinutes || 0)} tone="success" />
                    </div>
                </div>

                <div className="fitness-card p-5">
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="font-semibold text-[var(--text)]">Recent activities</h3>
                        <Link
                            to="/app/fitness/history"
                            className="flex items-center gap-1 text-sm text-[var(--primary)] transition-colors hover:text-[var(--text)]"
                        >
                            View all
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>

                    {recentExercises.length === 0 ? (
                        <div className="py-8 text-center">
                            <span className="mb-3 block text-4xl">🏃</span>
                            <p className="text-[var(--text-2)]">No activities yet</p>
                            <Link
                                to="/app/gps-tracking"
                                state={{ autoStart: true, preferredMode: 'running' }}
                                className="btn-neon mt-4 inline-flex items-center gap-2"
                            >
                                <Play className="h-4 w-4" />
                                Start your first workout
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {recentExercises.map((exercise) => (
                                <Link
                                    key={exercise.id}
                                    to={`/app/fitness/workouts/${exercise.id}`}
                                    className="surface-soft flex items-center justify-between p-3 transition-colors hover:border-[var(--surface-highlight-border)]"
                                >
                                    <div className="flex items-center gap-3">
                                        <ActivityIcon category={exercise.category} size={24} />
                                        <div>
                                            <p className="font-medium text-[var(--text)]">{exercise.name}</p>
                                            <p className="text-xs text-[var(--text-2)]">
                                                {new Date(exercise.performedAt).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold text-[var(--primary)]">{exercise.duration} min</p>
                                        {exercise.distance && <p className="text-xs text-[var(--text-2)]">{exercise.distance.toFixed(1)} km</p>}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                <div className="fitness-card p-5">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <div className="mb-2 flex items-center gap-2">
                                <h3 className="font-semibold text-[var(--text)]">Health Connect</h3>
                                {profile?.healthConnect && (
                                    <span className="rounded-full border border-[var(--surface-highlight-border)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--primary)]">
                                        Connected
                                    </span>
                                )}
                            </div>
                            <p className="text-sm text-[var(--text-2)]">
                                Sync with Apple Health or Google Fit so daily movement and recovery signals land here faster.
                            </p>
                            <Link
                                to="/app/fitness/devices"
                                className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-[var(--primary)] transition-colors hover:text-[var(--text)]"
                            >
                                Manage device connections
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() => void handleConnectHealth('apple_health')}
                                disabled={Boolean(connectingProvider) || profile?.healthConnect}
                                className="rounded-lg border border-[var(--border)] bg-[var(--surface-3)] px-3 py-2 text-sm text-[var(--text)] transition-colors hover:border-[var(--surface-highlight-border)] hover:text-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {connectingProvider === 'apple_health' ? 'Connecting...' : 'Apple Health'}
                            </button>
                            <button
                                type="button"
                                onClick={() => void handleConnectHealth('google_fit')}
                                disabled={Boolean(connectingProvider) || profile?.healthConnect}
                                className="rounded-lg border border-[var(--border)] bg-[var(--surface-3)] px-3 py-2 text-sm text-[var(--text)] transition-colors hover:border-[var(--surface-highlight-border)] hover:text-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {connectingProvider === 'google_fit' ? 'Connecting...' : 'Google Fit'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function SummaryCard({
    icon,
    label,
    value,
    unit,
}: {
    icon: ReactNode;
    label: string;
    value: string;
    unit?: string;
}) {
    return (
        <div className="fitness-card p-4">
            <div className="mb-2 flex items-center gap-2 text-[var(--text-2)]">
                <span className="text-[var(--primary)]">{icon}</span>
                <span className="text-sm">{label}</span>
            </div>
            <p className="text-2xl font-bold text-[var(--text)]">
                {value}
                {unit && <span className="ml-1 text-sm font-normal text-[var(--text-2)]">{unit}</span>}
            </p>
        </div>
    );
}

function WeeklyStat({
    label,
    value,
    tone = 'primary',
}: {
    label: string;
    value: string;
    tone?: 'primary' | 'warning' | 'success';
}) {
    const toneClass = {
        primary: 'text-[var(--primary)]',
        warning: 'text-[var(--warning)]',
        success: 'text-[var(--success)]',
    };

    return (
        <div className="text-center">
            <p className={`text-lg font-bold ${toneClass[tone]}`}>{value}</p>
            <p className="text-xs text-[var(--text-2)]">{label}</p>
        </div>
    );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-3)] px-4 py-3">
            <p className="text-lg font-semibold text-[var(--text)]">{value}</p>
            <p className="text-xs text-[var(--text-2)]">{label}</p>
        </div>
    );
}

function buildMonthlyChallenge(exercises: Exercise[]) {
    const monthExercises = exercises.filter((exercise) => isSameCalendarMonth(exercise.performedAt, new Date()));
    const runningDistance = sumDistance(monthExercises, ['running']);
    const cyclingDistance = sumDistance(monthExercises, ['cycling']);
    const walkingDistance = sumDistance(monthExercises, ['walking']);
    const hikingDistance = sumDistance(monthExercises, ['hiking']);
    const movementDistance = walkingDistance + hikingDistance;

    let title = 'Run 50 km this month';
    let target = 50;
    let progress = runningDistance;
    let preferredMode: QuickStartMode = 'running';

    if (cyclingDistance > runningDistance && cyclingDistance >= 25) {
        title = 'Ride 200 km this month';
        target = 200;
        progress = cyclingDistance;
        preferredMode = 'cycling';
    } else if (movementDistance > runningDistance && movementDistance >= 12) {
        title = 'Move 80 km this month';
        target = 80;
        progress = movementDistance;
        preferredMode = walkingDistance >= hikingDistance ? 'walking' : 'hiking';
    }

    const sessions = monthExercises.filter((exercise) => matchesMode(exercise.category, preferredMode)).length;
    const progressPercent = Math.max(4, Math.min((progress / target) * 100, 100));
    const remaining = Math.max(target - progress, 0);
    const avgDistance = sessions > 0 ? progress / sessions : 0;

    return {
        title,
        progressPercent,
        progressLabel: `${progress.toFixed(1)} / ${target} km`,
        remainingLabel: remaining > 0 ? `${remaining.toFixed(1)} km remaining` : 'Challenge completed',
        note:
            sessions > 0
                ? `Built from your ${sessions} matching session${sessions === 1 ? '' : 's'} this month, so the goal moves with real training data.`
                : 'Start the first session for this goal and the challenge card will begin updating automatically.',
        avgDistanceLabel: sessions > 0 ? `${avgDistance.toFixed(1)} km avg/session` : 'No matching sessions yet',
        sessions,
        preferredMode,
    };
}

function matchesMode(category: string, mode: QuickStartMode) {
    if (mode === 'walking') {
        return category === 'walking';
    }

    if (mode === 'hiking') {
        return category === 'hiking';
    }

    return category === mode;
}

function sumDistance(exercises: Exercise[], categories: string[]) {
    return exercises
        .filter((exercise) => categories.includes(exercise.category))
        .reduce((total, exercise) => total + (exercise.distance || 0), 0);
}

function isSameCalendarDay(isoDate: string, today: Date) {
    const value = new Date(isoDate);
    return (
        value.getFullYear() === today.getFullYear() &&
        value.getMonth() === today.getMonth() &&
        value.getDate() === today.getDate()
    );
}

function isSameCalendarMonth(isoDate: string, today: Date) {
    const value = new Date(isoDate);
    return value.getFullYear() === today.getFullYear() && value.getMonth() === today.getMonth();
}
