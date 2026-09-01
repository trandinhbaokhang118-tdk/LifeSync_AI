import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Clock3, Footprints, MapPin, Search, Sparkles } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button, showToast } from '../components/ui';
import { fitnessService } from '../services/fitness.service';
import { gpsService } from '../services/gps.service';
import { includesNormalizedVietnamese, normalizeVietnameseText } from '../lib/utils';
import type { Exercise, GpsRoute } from '../types';

const workoutFilters = ['all', 'running', 'walking', 'cycling', 'hiking', 'strength'] as const;
type WorkoutFilter = (typeof workoutFilters)[number];

export function WorkoutHistory() {
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [routes, setRoutes] = useState<GpsRoute[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<WorkoutFilter>('all');
    const [search, setSearch] = useState('');

    useEffect(() => {
        void loadHistory();
    }, []);

    async function loadHistory() {
        try {
            const [exerciseData, routeData] = await Promise.all([
                fitnessService.getExercises(),
                gpsService.getRoutes(100),
            ]);
            setExercises(exerciseData);
            setRoutes(routeData);
        } catch (error) {
            console.error('Failed to load workout history:', error);
            showToast.error('Could not load workout history', 'Try again when the backend is reachable.');
        } finally {
            setLoading(false);
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

    const routeMap = new Map(routes.map((route) => [route.exerciseId, route]));
    const normalizedSearch = normalizeVietnameseText(search);
    const filteredExercises = exercises.filter((exercise) => {
        const matchesFilter = filter === 'all' || exercise.category === filter;
        const matchesSearch =
            normalizedSearch.length === 0 ||
            includesNormalizedVietnamese(exercise.name, normalizedSearch) ||
            includesNormalizedVietnamese(exercise.category, normalizedSearch);
        return matchesFilter && matchesSearch;
    });

    const totalDistance = filteredExercises.reduce((sum, exercise) => sum + (exercise.distance || 0), 0);
    const totalMinutes = filteredExercises.reduce((sum, exercise) => sum + exercise.duration, 0);
    const routeCount = filteredExercises.filter((exercise) => routeMap.has(exercise.id)).length;

    return (
        <div className="page-shell pb-24">
            <div className="mx-auto max-w-6xl space-y-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                        <div className="mb-3 flex items-center gap-2 text-[var(--primary)]">
                            <Footprints className="h-4 w-4" />
                            <span className="text-xs font-semibold uppercase tracking-[0.2em]">Workout History</span>
                        </div>
                        <h1 className="text-3xl font-bold text-[var(--text)]">Every recorded session</h1>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-2)]">
                            Browse all workouts, jump into the details, and separate route-based sessions from simple activity entries.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button asChild variant="outline">
                            <Link to="/app/fitness">
                                <ArrowLeft className="h-4 w-4" />
                                Back to Fitness
                            </Link>
                        </Button>
                        <Button asChild variant="default">
                            <Link to="/app/gps-tracking" state={{ preferredMode: 'running' }}>
                                Start workout
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </Button>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-4">
                    <StatCard label="Sessions" value={String(filteredExercises.length)} note="Current filtered set" />
                    <StatCard label="Distance" value={`${totalDistance.toFixed(1)} km`} note="Across visible workouts" />
                    <StatCard label="Duration" value={`${Math.round(totalMinutes / 60)} h`} note="Rounded total training time" />
                    <StatCard label="Routes" value={String(routeCount)} note="Entries with a stored GPS path" />
                </div>

                <div className="fitness-card p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="relative w-full max-w-md">
                            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-3)]" />
                            <input
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Search by workout name or category"
                                className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-3)] py-3 pl-11 pr-4 text-sm text-[var(--text)] outline-none transition-colors focus:border-[var(--surface-highlight-border)]"
                            />
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {workoutFilters.map((item) => (
                                <button
                                    key={item}
                                    type="button"
                                    onClick={() => setFilter(item)}
                                    className={
                                        filter === item
                                            ? 'rounded-full border border-[var(--surface-highlight-border)] bg-[var(--surface-highlight)] px-4 py-2 text-sm font-semibold text-[var(--primary)]'
                                            : 'rounded-full border border-[var(--border)] bg-[var(--surface-3)] px-4 py-2 text-sm text-[var(--text-2)] transition-colors hover:text-[var(--text)]'
                                    }
                                >
                                    {item === 'all' ? 'All workouts' : capitalize(item)}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {filteredExercises.length === 0 ? (
                    <div className="fitness-card p-8 text-center">
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--surface-highlight)] text-[var(--primary)]">
                            <Sparkles className="h-5 w-5" />
                        </div>
                        <h2 className="text-xl font-semibold text-[var(--text)]">No workouts match this filter</h2>
                        <p className="mt-2 text-sm leading-6 text-[var(--text-2)]">
                            Clear the search, pick another category, or record a new session from Track Lab.
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                        {filteredExercises.map((exercise) => {
                            const route = routeMap.get(exercise.id);
                            return (
                                <Link
                                    key={exercise.id}
                                    to={`/app/fitness/workouts/${exercise.id}`}
                                    className="fitness-card group block p-5 transition-colors hover:border-[var(--surface-highlight-border)]"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[var(--text-3)]">
                                                <span>{capitalize(exercise.category)}</span>
                                                {route && <span className="rounded-full border border-[var(--surface-highlight-border)] px-2 py-0.5 text-[var(--primary)]">Route</span>}
                                            </div>
                                            <h3 className="text-lg font-semibold text-[var(--text)]">{exercise.name}</h3>
                                            <p className="mt-1 text-sm text-[var(--text-2)]">{formatWorkoutMoment(exercise.performedAt)}</p>
                                        </div>
                                        <ArrowRight className="h-4 w-4 text-[var(--primary)] transition-transform group-hover:translate-x-0.5" />
                                    </div>

                                    <div className="mt-4 grid grid-cols-3 gap-3">
                                        <MetricPill icon={<Clock3 className="h-4 w-4" />} value={`${exercise.duration} min`} />
                                        <MetricPill icon={<MapPin className="h-4 w-4" />} value={exercise.distance ? `${exercise.distance.toFixed(1)} km` : '--'} />
                                        <MetricPill icon={<Footprints className="h-4 w-4" />} value={exercise.avgPace ? `${exercise.avgPace.toFixed(1)} /km` : exercise.steps ? `${exercise.steps}` : '--'} />
                                    </div>

                                    <div className="mt-4 flex flex-wrap gap-2 text-xs text-[var(--text-2)]">
                                        <span className="rounded-full border border-[var(--border)] px-3 py-1">
                                            {exercise.intensity || 'moderate'}
                                        </span>
                                        {exercise.avgHeartRate && (
                                            <span className="rounded-full border border-[var(--border)] px-3 py-1">
                                                {exercise.avgHeartRate} bpm
                                            </span>
                                        )}
                                        {exercise.caloriesBurned && (
                                            <span className="rounded-full border border-[var(--border)] px-3 py-1">
                                                {exercise.caloriesBurned} cal
                                            </span>
                                        )}
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

function StatCard({ label, value, note }: { label: string; value: string; note: string }) {
    return (
        <div className="fitness-card p-4">
            <p className="text-sm text-[var(--text-2)]">{label}</p>
            <p className="mt-2 text-2xl font-bold text-[var(--text)]">{value}</p>
            <p className="mt-2 text-xs text-[var(--text-2)]">{note}</p>
        </div>
    );
}

function MetricPill({ icon, value }: { icon: ReactNode; value: string }) {
    return (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-3)] px-4 py-3">
            <div className="mb-2 text-[var(--primary)]">{icon}</div>
            <p className="text-sm font-medium text-[var(--text)]">{value}</p>
        </div>
    );
}

function formatWorkoutMoment(iso: string) {
    return new Date(iso).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function capitalize(value: string) {
    return value.charAt(0).toUpperCase() + value.slice(1);
}
