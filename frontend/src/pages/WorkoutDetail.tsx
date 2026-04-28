import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Clock3, Flame, Footprints, HeartPulse, MapPin, Route } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button, showToast } from '../components/ui';
import { WorkoutRoutePreview } from '../components/fitness/WorkoutRoutePreview';
import { fitnessService } from '../services/fitness.service';
import { gpsService } from '../services/gps.service';
import type { Exercise, GpsRoute } from '../types';

type PreferredTrackingMode = 'walking' | 'running' | 'cycling' | 'hiking';

export function WorkoutDetail() {
    const { id } = useParams<{ id: string }>();
    const [exercise, setExercise] = useState<Exercise | null>(null);
    const [route, setRoute] = useState<GpsRoute | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) {
            setLoading(false);
            return;
        }

        void loadWorkout(id);
    }, [id]);

    async function loadWorkout(workoutId: string) {
        try {
            const exerciseData = await fitnessService.getExercise(workoutId);
            setExercise(exerciseData);

            if (exerciseData.route) {
                try {
                    const routeData = await gpsService.getRoute(workoutId);
                    setRoute(routeData);
                } catch (error) {
                    console.error('Failed to load workout route detail:', error);
                    setRoute(null);
                }
            } else {
                setRoute(null);
            }
        } catch (error) {
            console.error('Failed to load workout detail:', error);
            showToast.error('Workout not available', 'This workout could not be loaded from Fitness.');
            setExercise(null);
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

    if (!exercise) {
        return (
            <div className="page-shell pb-24">
                <div className="mx-auto max-w-3xl">
                    <div className="fitness-card p-8 text-center">
                        <h1 className="text-2xl font-semibold text-[var(--text)]">Workout not found</h1>
                        <p className="mt-3 text-sm leading-6 text-[var(--text-2)]">
                            The workout may have been removed, or the link is no longer valid.
                        </p>
                        <div className="mt-6 flex justify-center">
                            <Button asChild variant="outline">
                                <Link to="/app/fitness/history">
                                    <ArrowLeft className="h-4 w-4" />
                                    Back to history
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const preferredMode = normalizeTrackingMode(exercise.category);

    return (
        <div className="page-shell pb-24">
            <div className="mx-auto max-w-6xl space-y-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                        <div className="mb-3 flex items-center gap-2 text-[var(--primary)]">
                            <Route className="h-4 w-4" />
                            <span className="text-xs font-semibold uppercase tracking-[0.2em]">Workout Detail</span>
                        </div>
                        <h1 className="text-3xl font-bold text-[var(--text)]">{exercise.name}</h1>
                        <p className="mt-2 text-sm leading-6 text-[var(--text-2)]">
                            {formatWorkoutMoment(exercise.performedAt)} · {capitalize(exercise.category)} · {describeSource(exercise)}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button asChild variant="outline">
                            <Link to="/app/fitness/history">
                                <ArrowLeft className="h-4 w-4" />
                                Back to history
                            </Link>
                        </Button>
                        <Button asChild variant="secondary">
                            <Link to="/app/gps-tracking" state={{ preferredMode }}>
                                Repeat workout
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </Button>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                    <DetailStat label="Duration" value={`${exercise.duration} min`} icon={<Clock3 className="h-4 w-4" />} />
                    <DetailStat label="Distance" value={exercise.distance ? `${exercise.distance.toFixed(2)} km` : '--'} icon={<MapPin className="h-4 w-4" />} />
                    <DetailStat label="Calories" value={exercise.caloriesBurned ? `${exercise.caloriesBurned}` : '--'} icon={<Flame className="h-4 w-4" />} />
                    <DetailStat label="Heart rate" value={exercise.avgHeartRate ? `${exercise.avgHeartRate} bpm` : '--'} icon={<HeartPulse className="h-4 w-4" />} />
                    <DetailStat label="Pace / steps" value={exercise.avgPace ? `${exercise.avgPace.toFixed(1)} /km` : exercise.steps ? `${exercise.steps}` : '--'} icon={<Footprints className="h-4 w-4" />} />
                </div>

                <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
                    <WorkoutRoutePreview
                        path={route?.path}
                        title={route?.path?.length ? 'Recorded route' : 'No route stored'}
                        caption={
                            route?.path?.length
                                ? `This workout stored ${route.path.length} GPS points and ${(route.totalDistance || exercise.distance || 0).toFixed(2)} km of route distance.`
                                : 'This workout does not have a GPS route. It may have been created manually or synced without location data.'
                        }
                    />

                    <div className="space-y-4">
                        <div className="fitness-card p-5">
                            <h2 className="font-semibold text-[var(--text)]">Workout context</h2>
                            <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                <KeyValue label="Category" value={capitalize(exercise.category)} />
                                <KeyValue label="Intensity" value={exercise.intensity || 'moderate'} />
                                <KeyValue label="Sub-category" value={exercise.subCategory || 'None'} />
                                <KeyValue label="Source" value={describeSource(exercise)} />
                            </div>
                        </div>

                        <div className="fitness-card p-5">
                            <h2 className="font-semibold text-[var(--text)]">Notes</h2>
                            <p className="mt-3 text-sm leading-6 text-[var(--text-2)]">
                                {exercise.notes || 'No notes were saved for this workout yet.'}
                            </p>
                        </div>

                        <div className="fitness-card p-5">
                            <h2 className="font-semibold text-[var(--text)]">Next action</h2>
                            <p className="mt-3 text-sm leading-6 text-[var(--text-2)]">
                                Start another workout in the same mode, or return to history to compare with the rest of your sessions.
                            </p>
                            <div className="mt-4 flex flex-wrap gap-2">
                                <Button asChild variant="default">
                                    <Link to="/app/gps-tracking" state={{ preferredMode }}>
                                        Start {capitalize(preferredMode)}
                                    </Link>
                                </Button>
                                <Button asChild variant="outline">
                                    <Link to="/app/fitness/devices">Open device sync</Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function DetailStat({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
    return (
        <div className="fitness-card p-4">
            <div className="mb-2 flex items-center gap-2 text-[var(--text-2)]">
                <span className="text-[var(--primary)]">{icon}</span>
                <span className="text-sm">{label}</span>
            </div>
            <p className="text-2xl font-bold text-[var(--text)]">{value}</p>
        </div>
    );
}

function KeyValue({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-3)] px-4 py-3">
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-3)]">{label}</p>
            <p className="mt-2 font-medium text-[var(--text)]">{value}</p>
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

function describeSource(exercise: Exercise) {
    if (exercise.notes?.toLowerCase().includes('track lab')) {
        return 'Track Lab';
    }

    if (exercise.route) {
        return 'GPS route';
    }

    if (exercise.notes?.toLowerCase().includes('apple_health')) {
        return 'Apple Health';
    }

    if (exercise.notes?.toLowerCase().includes('google_fit')) {
        return 'Google Fit';
    }

    return 'Fitness log';
}

function normalizeTrackingMode(category: string): PreferredTrackingMode {
    if (category === 'running' || category === 'walking' || category === 'cycling' || category === 'hiking') {
        return category;
    }

    return 'walking';
}

function capitalize(value: string) {
    return value.charAt(0).toUpperCase() + value.slice(1);
}
