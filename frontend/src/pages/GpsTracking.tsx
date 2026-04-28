import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useLocation } from 'react-router-dom';
import {
    Activity,
    AlertTriangle,
    ArrowRight,
    BatteryCharging,
    CalendarRange,
    CheckCircle2,
    Clock3,
    Droplets,
    Footprints,
    HeartPulse,
    ImagePlus,
    LocateFixed,
    Lock,
    Moon,
    Route,
    Sparkles,
    Square,
    Star,
    Target,
    TimerReset,
    TrendingUp,
    Zap,
} from 'lucide-react';
import { Badge, Button, Tabs, TabsContent, TabsList, TabsTrigger, showToast } from '../components/ui';
import { cn } from '../lib/utils';
import { fitnessService } from '../services/fitness.service';
import { gpsService } from '../services/gps.service';
import { subscriptionsService } from '../services/subscriptions.service';
import { timeBlocksService } from '../services/time-blocks.service';
import type { DailyActivity, Exercise, GpsRoute, Subscription, TimeBlock, TrackingSession, WeeklyStats } from '../types';

type LabRange = 7 | 30;
type LabTab = 'recovery' | 'stress' | 'hydration';
type TimelineKind = 'sleep' | 'deep-work' | 'meeting' | 'move' | 'workout' | 'recovery';
type TrackingPhase = 'idle' | 'starting' | 'recording' | 'finishing' | 'finished';
type TrackingMode = 'walking' | 'running' | 'cycling' | 'hiking';

interface TimelineBlock {
    id: string;
    label: string;
    kind: TimelineKind;
    start: number;
    end: number;
    hr: number;
    energy: number;
    stress: number;
    movement: string;
    insight: string;
}

interface LabPoint {
    label: string;
    readiness: number;
    sleep: number;
    sleepScore: number;
    rhr: number;
    hrv: number;
    hydration: number;
    deep: number;
    meetings: number;
    stress: number;
    load: number;
}

interface SessionSnapshot {
    id: string;
    sport: string;
    duration: number;
    effort: number;
    when: string;
    load: 'Heavy' | 'Light' | 'Recovery';
    tag: string;
}

interface LiveTrackPoint {
    lat: number;
    lng: number;
    timestamp: string;
    speed: number;
    altitude?: number;
}

interface TrackReflectionPhoto {
    name: string;
    url: string;
}

interface WorkoutSummary {
    title: string;
    mode: TrackingMode;
    durationSeconds: number;
    distanceKm: number;
    calories: number;
    avgPace: number | null;
    avgHeartRate: number;
    energyScore: number;
    stressState: string;
    syncMode: string;
    startedAt: string;
    completedAt: string;
    path: LiveTrackPoint[];
}

interface SavedWorkoutReflection extends WorkoutSummary {
    rating?: number;
    notes?: string;
    photos?: TrackReflectionPhoto[];
    savedAt?: string;
}

export function GpsTracking() {
    const queryClient = useQueryClient();
    const location = useLocation();
    const navigationState = location.state as { autoStart?: boolean; preferredMode?: TrackingMode } | null;
    const autoStartRequested = Boolean(navigationState?.autoStart);
    const preferredMode = navigationState?.preferredMode;

    const [labTab, setLabTab] = useState<LabTab>('recovery');
    const [labRange, setLabRange] = useState<LabRange>(7);
    const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
    const [trackingMode, setTrackingMode] = useState<TrackingMode>(preferredMode ?? 'walking');
    const [trackingPhase, setTrackingPhase] = useState<TrackingPhase>('idle');
    const [currentSession, setCurrentSession] = useState<TrackingSession | null>(null);
    const [livePoints, setLivePoints] = useState<LiveTrackPoint[]>([]);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [currentSpeed, setCurrentSpeed] = useState(0);
    const [gpsStatus, setGpsStatus] = useState('Ready to record');
    const [isSimulated, setIsSimulated] = useState(false);
    const [syncSource, setSyncSource] = useState<'cloud' | 'local'>('cloud');
    const [lastSummary, setLastSummary] = useState<WorkoutSummary | null>(null);
    const [workoutRating, setWorkoutRating] = useState(0);
    const [sessionNotes, setSessionNotes] = useState('');
    const [photoPreviews, setPhotoPreviews] = useState<TrackReflectionPhoto[]>([]);
    const [savedReflectionAt, setSavedReflectionAt] = useState<string | null>(null);
    const [completedWorkoutId, setCompletedWorkoutId] = useState<string | null>(null);

    const watchIdRef = useRef<number | null>(null);
    const timerRef = useRef<number | null>(null);
    const simulationRef = useRef<number | null>(null);
    const startTimeRef = useRef<number | null>(null);
    const sessionIdRef = useRef<string | null>(null);
    const autoStartRef = useRef(false);
    const pointsRef = useRef<LiveTrackPoint[]>([]);

    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);
    const isoDay = startOfDay.toISOString().split('T')[0];

    const { data: premiumAccess, isLoading: checkingAccess } = useQuery({
        queryKey: ['track-lab', 'access'],
        queryFn: async () => {
            try {
                return await fitnessService.checkPremiumFeature('gps-tracking');
            } catch (error) {
                console.error('Failed to check premium access:', error);
                return { feature: 'gps-tracking', hasAccess: false };
            }
        },
        retry: false,
    });

    const { data: subscription } = useQuery({
        queryKey: ['track-lab', 'subscription'],
        queryFn: async () => {
            try {
                return await subscriptionsService.getSubscription();
            } catch (error) {
                console.error('Failed to load subscription:', error);
                return null as Subscription | null;
            }
        },
        retry: false,
    });

    const { data: todayActivity } = useQuery({
        queryKey: ['track-lab', 'daily-activity', isoDay],
        queryFn: async () => {
            try {
                return await fitnessService.getDailyActivity(isoDay);
            } catch (error) {
                console.error('Failed to load daily activity:', error);
                return null as DailyActivity | null;
            }
        },
        retry: false,
    });

    const { data: weeklyStats } = useQuery({
        queryKey: ['track-lab', 'weekly-stats', isoDay],
        queryFn: async () => {
            try {
                return await fitnessService.getWeeklyStats(startOfDay.toISOString());
            } catch (error) {
                console.error('Failed to load weekly stats:', error);
                return null as WeeklyStats | null;
            }
        },
        retry: false,
    });

    const { data: exercises = [] } = useQuery({
        queryKey: ['track-lab', 'exercises'],
        queryFn: async () => {
            try {
                return await fitnessService.getExercises();
            } catch (error) {
                console.error('Failed to load exercises:', error);
                return [] as Exercise[];
            }
        },
        retry: false,
    });

    const { data: timeBlocks = [] } = useQuery({
        queryKey: ['track-lab', 'time-blocks', isoDay],
        queryFn: async () => {
            try {
                return await timeBlocksService.getAll({
                    startDate: startOfDay.toISOString(),
                    endDate: endOfDay.toISOString(),
                });
            } catch (error) {
                console.error('Failed to load time blocks:', error);
                return [] as TimeBlock[];
            }
        },
        retry: false,
    });

    const { data: routes = [] } = useQuery({
        queryKey: ['track-lab', 'routes'],
        queryFn: async () => {
            try {
                return await gpsService.getRoutes(6);
            } catch (error) {
                console.error('Failed to load routes:', error);
                return [] as GpsRoute[];
            }
        },
        retry: false,
    });

    const hasPremiumAccess = Boolean(premiumAccess?.hasAccess || subscription?.tier === 'PLUS');

    const model = buildTrackModel({ todayActivity, weeklyStats, exercises, timeBlocks, routes });
    const rangeSeries = labRange === 7 ? model.series.slice(-7) : model.series;
    const activeBlock = model.timeline.find((block) => block.id === activeBlockId) || model.timeline[0];
    const liveDistanceKm = calculateTrackDistance(livePoints);
    const livePace = liveDistanceKm > 0 ? elapsedSeconds / 60 / liveDistanceKm : null;
    const liveCalories = estimateCaloriesBurned(trackingMode, elapsedSeconds, liveDistanceKm);
    const liveHeartRate = estimateLiveHeartRate(trackingMode, currentSpeed, elapsedSeconds, model.readiness);
    const liveEnergy = estimateLiveEnergy(model.readiness, elapsedSeconds, liveDistanceKm);
    const liveStress = describeLiveStress(trackingMode, currentSpeed, model.readiness, elapsedSeconds);
    const recorderStatusLabel = {
        idle: 'Ready',
        starting: 'Starting',
        recording: 'Recording',
        finishing: 'Saving',
        finished: 'Completed',
    }[trackingPhase];
    const recorderPoints = trackingPhase === 'finished' && lastSummary ? lastSummary.path : livePoints;
    const syncChips = [
        syncSource === 'cloud' ? 'Cloud route sync' : 'Local recap mode',
        isSimulated ? 'Demo route overlay' : 'GPS live',
        activeBlock ? `Schedule slot: ${activeBlock.label}` : 'Schedule layer ready',
        `Energy ${liveEnergy}/100`,
    ];

    useEffect(() => {
        if (!activeBlockId && model.timeline[0]) {
            setActiveBlockId(model.timeline[0].id);
        }
    }, [activeBlockId, model.timeline]);

    useEffect(() => {
        if (!preferredMode || trackingPhase === 'recording' || trackingPhase === 'finishing') {
            return;
        }

        setTrackingMode(preferredMode);
    }, [preferredMode, trackingPhase]);

    useEffect(() => {
        pointsRef.current = livePoints;
    }, [livePoints]);

    useEffect(() => {
        if (autoStartRequested) {
            return;
        }

        try {
            const savedRaw = localStorage.getItem('track-lab-last-workout');
            if (!savedRaw) {
                return;
            }

            const saved = JSON.parse(savedRaw) as SavedWorkoutReflection;
            if (!saved?.startedAt || !Array.isArray(saved.path)) {
                return;
            }

            setLastSummary({
                title: saved.title,
                mode: saved.mode,
                durationSeconds: saved.durationSeconds,
                distanceKm: saved.distanceKm,
                calories: saved.calories,
                avgPace: saved.avgPace,
                avgHeartRate: saved.avgHeartRate,
                energyScore: saved.energyScore,
                stressState: saved.stressState,
                syncMode: saved.syncMode,
                startedAt: saved.startedAt,
                completedAt: saved.completedAt,
                path: saved.path,
            });
            setTrackingMode(saved.mode);
            setWorkoutRating(saved.rating ?? 0);
            setSessionNotes(saved.notes ?? '');
            setPhotoPreviews(saved.photos ?? []);
            setSavedReflectionAt(saved.savedAt ?? null);
            setTrackingPhase('finished');
            setSyncSource(saved.syncMode.toLowerCase().includes('cloud') ? 'cloud' : 'local');
            setCompletedWorkoutId(null);
            setGpsStatus('Loaded your last saved finish recap from this device.');
        } catch (error) {
            console.error('Failed to restore saved reflection:', error);
        }
    }, [autoStartRequested]);

    useEffect(() => {
        return () => {
            stopTrackingEngines();
        };
    }, []);

    // handleStartRecording is intentionally omitted to avoid auto-start loops from recreated closures.
    useEffect(() => {
        if (!autoStartRequested || autoStartRef.current || checkingAccess || trackingPhase !== 'idle') {
            return;
        }

        autoStartRef.current = true;
        void handleStartRecording();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoStartRequested, checkingAccess, trackingPhase]);

    function stopTrackingEngines() {
        if (timerRef.current !== null) {
            window.clearInterval(timerRef.current);
            timerRef.current = null;
        }

        if (simulationRef.current !== null) {
            window.clearInterval(simulationRef.current);
            simulationRef.current = null;
        }

        if (watchIdRef.current !== null && typeof navigator !== 'undefined' && 'geolocation' in navigator) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }
    }

    function beginElapsedTimer() {
        if (timerRef.current !== null) {
            window.clearInterval(timerRef.current);
        }

        timerRef.current = window.setInterval(() => {
            if (!startTimeRef.current) {
                return;
            }

            setElapsedSeconds(Math.max(1, Math.floor((Date.now() - startTimeRef.current) / 1000)));
        }, 1000);
    }

    async function syncPointToCloud(point: LiveTrackPoint) {
        if (!sessionIdRef.current) {
            return;
        }

        try {
            const session = await gpsService.updateLocation(sessionIdRef.current, {
                latitude: point.lat,
                longitude: point.lng,
                altitude: point.altitude,
                speed: point.speed > 0 ? point.speed / 3.6 : undefined,
                timestamp: point.timestamp,
            });
            setCurrentSession(session);
        } catch (error) {
            console.error('Failed to sync location:', error);
            setGpsStatus('Live route is still recording, waiting to resync the cloud session.');
        }
    }

    function pushTrackPoint(point: LiveTrackPoint) {
        setCurrentSpeed(point.speed);
        setLivePoints((current) => appendUniqueTrackPoint(current, point));
        void syncPointToCloud(point);
    }

    function startSimulationLoop(seed: LiveTrackPoint, mode: TrackingMode) {
        simulationRef.current = window.setInterval(() => {
            const nextPoint = simulateNextTrackPoint(pointsRef.current[pointsRef.current.length - 1] ?? seed, pointsRef.current.length, mode);
            pushTrackPoint(nextPoint);
            setGpsStatus('Simulation mode is keeping the route active until device GPS is available.');
        }, 4000);
    }

    function startGeolocationWatch() {
        if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
            return;
        }

        watchIdRef.current = navigator.geolocation.watchPosition(
            (position) => {
                const point = createTrackPointFromPosition(position);
                pushTrackPoint(point);
                setGpsStatus('GPS locked. Track Lab is syncing route progress in real time.');
            },
            () => {
                setGpsStatus('GPS signal is weak right now. Holding the last good route point.');
            },
            {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 4000,
            }
        );
    }

    function resetRecorder() {
        stopTrackingEngines();
        sessionIdRef.current = null;
        startTimeRef.current = null;
        setTrackingPhase('idle');
        setCurrentSession(null);
        setLivePoints([]);
        setElapsedSeconds(0);
        setCurrentSpeed(0);
        setGpsStatus('Ready to record');
        setIsSimulated(false);
        setSyncSource(hasPremiumAccess ? 'cloud' : 'local');
        setLastSummary(null);
        setWorkoutRating(0);
        setSessionNotes('');
        setPhotoPreviews([]);
        setSavedReflectionAt(null);
        setCompletedWorkoutId(null);
    }

    async function handleStartRecording() {
        if (trackingPhase === 'starting' || trackingPhase === 'recording' || trackingPhase === 'finishing') {
            return;
        }

        stopTrackingEngines();
        setTrackingPhase('starting');
        setCurrentSession(null);
        setLivePoints([]);
        setElapsedSeconds(0);
        setCurrentSpeed(0);
        setLastSummary(null);
        setWorkoutRating(0);
        setSessionNotes('');
        setPhotoPreviews([]);
        setSavedReflectionAt(null);
        setCompletedWorkoutId(null);
        setGpsStatus('Preparing route capture and looking for a stable location fix...');

        const seed = await resolveStartingPoint(trackingMode);
        const openingPoint: LiveTrackPoint = {
            lat: seed.lat,
            lng: seed.lng,
            timestamp: new Date().toISOString(),
            speed: seed.speed,
            altitude: seed.altitude,
        };

        let nextSyncSource: 'cloud' | 'local' = hasPremiumAccess ? 'cloud' : 'local';

        if (hasPremiumAccess) {
            try {
                const startedSession = await gpsService.startTracking({
                    latitude: openingPoint.lat,
                    longitude: openingPoint.lng,
                    activityType: trackingMode,
                    category: trackingMode,
                    intensity: getTrackingIntensity(trackingMode),
                });
                sessionIdRef.current = startedSession.sessionId;
                setCurrentSession(startedSession);
            } catch (error) {
                console.error('Failed to start cloud tracking session:', error);
                nextSyncSource = 'local';
                showToast.warning('Cloud sync is unavailable', 'Track Lab will keep recording locally on this device.');
            }
        }

        if (!hasPremiumAccess) {
            showToast.info('Local record mode', 'Upgrade to unlock cloud route sync, while this session still records locally.');
        }

        startTimeRef.current = Date.now();
        setSyncSource(nextSyncSource);
        setIsSimulated(seed.simulated);
        setLivePoints([openingPoint]);
        setCurrentSpeed(openingPoint.speed);
        setTrackingPhase('recording');
        setGpsStatus(
            nextSyncSource === 'cloud'
                ? seed.simulated
                    ? 'Cloud session is live with a demo route while GPS warms up.'
                    : 'Cloud session is live and the route is syncing in real time.'
                : seed.simulated
                  ? 'Local record mode is active with a demo route overlay.'
                  : 'Local record mode is active and the route is updating on this device.'
        );
        beginElapsedTimer();

        if (seed.simulated) {
            startSimulationLoop(openingPoint, trackingMode);
        } else {
            startGeolocationWatch();
        }

        showToast.success(
            'Workout recording started',
            nextSyncSource === 'cloud'
                ? 'Track Lab is now recording your route, timer and compatible live signals.'
                : 'Track Lab is recording locally and will build a full finish recap for this session.'
        );
    }

    async function handleFinishRecording() {
        if (trackingPhase !== 'recording' && trackingPhase !== 'starting') {
            return;
        }

        setTrackingPhase('finishing');
        setGpsStatus('Saving the workout summary and final route preview...');
        stopTrackingEngines();

        let endedSession: TrackingSession | null = currentSession;

        if (syncSource === 'cloud' && sessionIdRef.current) {
            try {
                endedSession = await gpsService.endTracking(sessionIdRef.current);
                setCurrentSession(endedSession);
            } catch (error) {
                console.error('Failed to end cloud tracking session:', error);
                showToast.warning('Cloud finish was incomplete', 'Track Lab is building the recap from the route already captured on this device.');
            }
        }

        const summary = buildWorkoutSummary({
            mode: trackingMode,
            elapsedSeconds,
            distanceKm: endedSession?.summary?.distance ?? liveDistanceKm,
            calories: endedSession?.summary?.caloriesBurned ?? liveCalories,
            avgPace: endedSession?.summary?.avgPace ?? livePace,
            avgHeartRate: liveHeartRate,
            energyScore: liveEnergy,
            stressState: liveStress,
            syncMode:
                syncSource === 'cloud'
                    ? isSimulated
                        ? 'Cloud sync + demo route'
                        : 'Cloud sync + GPS live'
                    : isSimulated
                      ? 'Local recap + demo route'
                      : 'Local recap + GPS live',
            path: livePoints,
            startedAt: new Date((startTimeRef.current ?? Date.now()) - elapsedSeconds * 1000).toISOString(),
        });

        setLastSummary(summary);
        sessionIdRef.current = null;
        const routePayload = buildRoutePayload(summary.path, summary.distanceKm, summary.durationSeconds);
        let workoutId = syncSource === 'cloud' ? endedSession?.sessionId ?? null : null;

        if (syncSource === 'local') {
            try {
                const createdExercise = await fitnessService.createExercise({
                    name: summary.title,
                    category: trackingMode,
                    subCategory: 'track-lab',
                    duration: Math.max(1, Math.round(summary.durationSeconds / 60)),
                    distance: Number(summary.distanceKm.toFixed(2)),
                    caloriesBurned: Math.round(summary.calories),
                    avgHeartRate: summary.avgHeartRate,
                    avgPace: summary.avgPace ? Number(summary.avgPace.toFixed(1)) : undefined,
                    intensity: getTrackingIntensity(trackingMode),
                    notes: `[Track Lab] ${summary.syncMode}`,
                    performedAt: summary.startedAt,
                    route: routePayload,
                });
                workoutId = createdExercise.id;
            } catch (error) {
                console.error('Failed to save local workout summary:', error);
                showToast.warning('Workout recap is ready', 'The visual recap was built, but the activity summary could not be saved to Fitness.');
            }
        }

        try {
            const syncedActivity = await syncWorkoutIntoDailyActivity(summary, todayActivity, isoDay);
            queryClient.setQueryData(['track-lab', 'daily-activity', isoDay], syncedActivity);
        } catch (error) {
            console.error('Failed to sync workout into daily activity:', error);
            showToast.warning('Workout was saved', 'The session recap is ready, but today activity totals could not be refreshed.');
        }

        await queryClient.invalidateQueries({ queryKey: ['track-lab'] });
        setCompletedWorkoutId(workoutId);
        setTrackingPhase('finished');
        setGpsStatus('Workout finished. Rate it, add photos and save the recap below.');
        showToast.success('Workout completed', 'Your route snapshot and finish recap are ready.');
    }

    async function handlePhotoUpload(event: ChangeEvent<HTMLInputElement>) {
        const selectedFiles = Array.from(event.target.files ?? []);
        const remainingSlots = Math.max(0, 4 - photoPreviews.length);
        const filesToRead = selectedFiles.slice(0, remainingSlots);

        if (filesToRead.length === 0) {
            event.target.value = '';
            showToast.info('Photo limit reached', 'Track Lab keeps up to 4 activity photos in one finish recap.');
            return;
        }

        try {
            const previews = await Promise.all(filesToRead.map(readPhotoPreview));
            setPhotoPreviews((current) => [...current, ...previews].slice(0, 4));
            showToast.success('Activity photos added', `${previews.length} photo preview${previews.length > 1 ? 's are' : ' is'} ready in the recap.`);
        } catch (error) {
            console.error('Failed to read activity photos:', error);
            showToast.error('Could not load the selected photos', 'Please try another image file.');
        } finally {
            event.target.value = '';
        }
    }

    function handleSaveReflection() {
        if (!lastSummary) {
            return;
        }

        try {
            const payload = {
                ...lastSummary,
                rating: workoutRating,
                notes: sessionNotes,
                photos: photoPreviews,
                savedAt: new Date().toISOString(),
            };
            localStorage.setItem('track-lab-last-workout', JSON.stringify(payload));
            setSavedReflectionAt(payload.savedAt);
            showToast.success('Finish recap saved', 'Rating, notes and activity photos were saved to this device.');
        } catch (error) {
            console.error('Failed to save reflection:', error);
            showToast.warning('Recap ready in memory', 'The recap could not be persisted locally, but it stays visible until you leave this page.');
        }
    }

    if (checkingAccess) {
        return (
            <div className="page-shell flex items-center justify-center">
                <div className="track-lab-panel flex min-h-[260px] w-full max-w-xl items-center justify-center">
                    <div className="text-center">
                        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-[var(--surface-highlight-border)] border-t-[var(--primary)]" />
                        <p className="text-sm text-[var(--text-2)]">Loading Track Lab...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="page-shell pb-24">
            <div className="mx-auto max-w-7xl space-y-6">
                <section className="track-lab-hero p-6 md:p-8">
                    <div className="relative z-10 flex flex-col gap-6">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div className="max-w-3xl">
                                <div className="mb-4 flex flex-wrap items-center gap-3">
                                    <Badge variant="primary" className="px-4 py-1.5 text-[11px] uppercase tracking-[0.22em]">
                                        Track Lab
                                    </Badge>
                                    <span className="track-metric-pill">
                                        <Sparkles className="h-3.5 w-3.5" />
                                        Premium
                                    </span>
                                    <span className="track-metric-pill">
                                        <CalendarRange className="h-3.5 w-3.5" />
                                        Recovery x Schedule
                                    </span>
                                </div>
                                <h1 className="text-3xl font-bold tracking-tight text-[var(--text)] md:text-4xl">
                                    Today Readiness & Focus
                                </h1>
                                <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--text-2)]">
                                    A premium analysis layer that blends calendar load, recovery signals and all-sport
                                    performance into one lab-style view of the day.
                                </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                                <span className="track-metric-pill">
                                    <Zap className="h-3.5 w-3.5" />
                                    {hasPremiumAccess ? 'Premium unlocked' : 'Premium preview'}
                                </span>
                                <span className="track-metric-pill">
                                    <Footprints className="h-3.5 w-3.5" />
                                    {subscription?.tier || 'FREE'} plan
                                </span>
                                <Button asChild variant={hasPremiumAccess ? 'outline' : 'default'}>
                                    <Link to={hasPremiumAccess ? '/app/calendar' : '/app/subscription'}>
                                        {hasPremiumAccess ? 'Sync schedule' : 'Unlock Track Lab'}
                                        <ArrowRight className="h-4 w-4" />
                                    </Link>
                                </Button>
                            </div>
                        </div>

                        <PremiumPreview
                            locked={!hasPremiumAccess}
                            title="Readiness and focus intelligence"
                            teaser="Track Lab turns sleep depth, schedule pressure and training strain into one concrete plan for the day."
                            compact
                        >
                            <div className="grid gap-4 xl:grid-cols-[1.55fr_0.95fr]">
                                <div className="track-lab-panel p-5 md:p-6">
                                    <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                        <div>
                                            <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-3)]">Readiness score</p>
                                            <div className="mt-3 flex items-end gap-3">
                                                <span className="text-6xl font-bold leading-none text-[var(--text)]">{model.readiness}</span>
                                                <span className={cn('mb-1 rounded-full px-3 py-1 text-sm font-semibold', getReadinessClass(model.readiness))}>
                                                    {model.readinessLevel}
                                                </span>
                                            </div>
                                            <p className="mt-4 max-w-xl text-sm leading-6 text-[var(--text-2)]">
                                                {model.recommendation}
                                            </p>
                                        </div>

                                        <div className="min-w-[220px]">
                                            <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-[0.18em] text-[var(--text-3)]">
                                                <span>7-day trend</span>
                                                <span className={cn(model.readinessDelta >= 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]')}>
                                                    {formatDelta(model.readinessDelta)}
                                                </span>
                                            </div>
                                            <Sparkline points={model.series.slice(-7).map((item) => item.readiness)} bright />
                                        </div>
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-[1fr_0.9fr]">
                                        <div className="track-chart-card p-4">
                                            <div className="mb-3 flex items-center gap-2 text-[var(--primary)]">
                                                <Moon className="h-4 w-4" />
                                                <span className="text-sm font-medium">Why it moved</span>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {model.reasons.map((reason) => (
                                                    <span key={reason} className="track-note-chip">
                                                        {reason}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="track-chart-card p-4">
                                            <div className="mb-3 flex items-center gap-2 text-[var(--primary)]">
                                                <TrendingUp className="h-4 w-4" />
                                                <span className="text-sm font-medium">Signals</span>
                                            </div>
                                            <div className="grid grid-cols-3 gap-3">
                                                <SignalMini label="Energy" value={model.energyState} />
                                                <SignalMini label="Stress" value={model.stressState} />
                                                <SignalMini label="Load" value={model.loadLevel} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                                    <InfoCard
                                        title="Năng lượng hiện tại"
                                        value={model.energyState}
                                        note={model.energyNote}
                                        icon={<BatteryCharging className="h-4 w-4" />}
                                    />
                                    <InfoCard
                                        title="Stress"
                                        value={model.stressState}
                                        note={model.stressNote}
                                        icon={<HeartPulse className="h-4 w-4" />}
                                    />
                                    <div className="track-lab-panel p-4 sm:col-span-2 xl:col-span-1">
                                        <div className="mb-3 flex items-center justify-between">
                                            <span className="text-sm font-medium text-[var(--text)]">Primary focus note</span>
                                            <span className="track-metric-pill">
                                                <AlertTriangle className="h-3.5 w-3.5" />
                                                {model.schedulePressure}
                                            </span>
                                        </div>
                                        <p className="text-sm leading-6 text-[var(--text-2)]">{model.todayInsight}</p>
                                    </div>
                                </div>
                            </div>
                        </PremiumPreview>
                    </div>
                </section>

                <section className="track-lab-panel p-5 md:p-6">
                    <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                        <div>
                            <div className="mb-2 flex items-center gap-2 text-[var(--primary)]">
                                <LocateFixed className="h-4 w-4" />
                                <span className="text-xs font-semibold uppercase tracking-[0.2em]">Live Record Console</span>
                            </div>
                            <h2 className="text-xl font-semibold text-[var(--text)]">Record the workout, keep the timer live, finish with a full route recap</h2>
                            <p className="mt-1 max-w-3xl text-sm leading-6 text-[var(--text-2)]">
                                Start from Fitness or from this console and Track Lab will capture route progress, session time and compatible live signals. When you finish, the route snapshot stays here for rating, photos and a completion recap.
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <span className={cn('track-load-pill', trackingPhase === 'recording' ? 'track-load-pill-danger' : 'track-load-pill-primary')}>
                                {recorderStatusLabel}
                            </span>
                            <span className="track-metric-pill">
                                <Route className="h-3.5 w-3.5" />
                                {syncSource === 'cloud' ? 'Cloud route sync' : 'Local recap mode'}
                            </span>
                            <span className="track-metric-pill">
                                <Zap className="h-3.5 w-3.5" />
                                {isSimulated ? 'Demo route overlay' : 'GPS live'}
                            </span>
                        </div>
                    </div>

                    <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
                        <div className="track-chart-card p-4">
                            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                    <p className="text-sm text-[var(--text-2)]">Route snapshot</p>
                                    <h3 className="mt-1 text-lg font-semibold text-[var(--text)]">
                                        {trackingPhase === 'recording' ? 'Live map-style route drawing' : 'Workout route preview'}
                                    </h3>
                                </div>
                                <span className="track-metric-pill">
                                    <Clock3 className="h-3.5 w-3.5" />
                                    {formatElapsedTime(elapsedSeconds)}
                                </span>
                            </div>

                            <RoutePreview
                                points={recorderPoints}
                                active={trackingPhase === 'recording'}
                                title={trackingPhase === 'finished' ? 'Finished route snapshot' : 'Realtime route snapshot'}
                                status={gpsStatus}
                            />

                            <div className="mt-4 flex flex-wrap gap-2">
                                {syncChips.map((chip) => (
                                    <span key={chip} className="track-note-chip">
                                        {chip}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="track-lab-panel p-4">
                                <div className="mb-4 flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-[var(--text)]">Workout mode</p>
                                        <p className="text-xs text-[var(--text-3)]">Choose the session style before you start.</p>
                                    </div>
                                    <span className="track-metric-pill">
                                        <Activity className="h-3.5 w-3.5" />
                                        {currentSession?.locationCount ?? livePoints.length} points
                                    </span>
                                </div>

                                <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                                    {(['walking', 'running', 'cycling', 'hiking'] as TrackingMode[]).map((mode) => (
                                        <button
                                            key={mode}
                                            type="button"
                                            onClick={() => setTrackingMode(mode)}
                                            disabled={trackingPhase === 'recording' || trackingPhase === 'finishing'}
                                            className={cn(
                                                'rounded-2xl border px-3 py-3 text-sm font-medium transition-all',
                                                trackingMode === mode
                                                    ? 'border-[var(--surface-highlight-border)] bg-[var(--surface-highlight)] text-[var(--primary)] shadow-[var(--primary-glow)]'
                                                    : 'border-[var(--border)] bg-[var(--surface-3)] text-[var(--text-2)] hover:border-[var(--surface-highlight-border)] hover:text-[var(--text)]'
                                            )}
                                        >
                                            {getTrackingModeLabel(mode)}
                                        </button>
                                    ))}
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    <Button onClick={() => void handleStartRecording()} loading={trackingPhase === 'starting'} disabled={trackingPhase === 'recording' || trackingPhase === 'finishing'}>
                                        {trackingPhase === 'finished' ? 'Record another session' : 'Start recording'}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => void handleFinishRecording()}
                                        disabled={trackingPhase !== 'recording' && trackingPhase !== 'starting'}
                                    >
                                        <Square className="h-4 w-4" />
                                        Finish
                                    </Button>
                                    <Button variant="ghost" onClick={resetRecorder} disabled={trackingPhase === 'starting' || trackingPhase === 'finishing'}>
                                        <TimerReset className="h-4 w-4" />
                                        Reset
                                    </Button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <RecordStatCard label="Timer" value={formatElapsedTime(elapsedSeconds)} note={trackingPhase === 'recording' ? 'Live counter is running' : 'Ready for the next session'} />
                                <RecordStatCard label="Distance" value={`${liveDistanceKm.toFixed(2)} km`} note="Realtime route distance" />
                                <RecordStatCard label="Pace" value={formatWorkoutPace(livePace)} note={trackingMode === 'cycling' ? 'Avg effort pace' : 'Minutes per km'} />
                                <RecordStatCard label="Heart / Energy" value={`${liveHeartRate} bpm`} note={`Energy ${liveEnergy}/100`} />
                            </div>

                            <div className="track-lab-panel p-4">
                                <div className="mb-3 flex items-center gap-2 text-[var(--primary)]">
                                    <Sparkles className="h-4 w-4" />
                                    <span className="text-sm font-medium">Compatible live sync</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <span className="track-note-chip">{syncSource === 'cloud' ? 'GPS route sync to backend' : 'Local save flow for recap'}</span>
                                    <span className="track-note-chip">Effort {liveStress}</span>
                                    <span className="track-note-chip">{currentSpeed.toFixed(1)} km/h current speed</span>
                                    <span className="track-note-chip">
                                        {activeBlock ? `Current context: ${activeBlock.label}` : 'Context timeline ready'}
                                    </span>
                                </div>
                                <p className="mt-4 text-sm leading-6 text-[var(--text-2)]">{gpsStatus}</p>
                            </div>
                        </div>
                    </div>

                    {trackingPhase === 'finished' && lastSummary && (
                        <div className="mt-5 grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
                            <div className="track-chart-card p-4">
                                <div className="mb-4 flex items-start justify-between gap-4">
                                    <div>
                                        <div className="mb-2 flex items-center gap-2 text-[var(--success)]">
                                            <CheckCircle2 className="h-4 w-4" />
                                            <span className="text-xs font-semibold uppercase tracking-[0.2em]">Finish recap</span>
                                        </div>
                                        <h3 className="text-xl font-semibold text-[var(--text)]">Workout completed nicely</h3>
                                        <p className="mt-2 text-sm leading-6 text-[var(--text-2)]">
                                            Great work. Your route snapshot, progress summary and post-session reflection are ready below.
                                        </p>
                                    </div>
                                    <span className="track-metric-pill">
                                        <Zap className="h-3.5 w-3.5" />
                                        {lastSummary.syncMode}
                                    </span>
                                </div>

                                <RoutePreview points={lastSummary.path} title="Completed route image" status="The full route preview is locked into this recap." />

                                <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                                    <RecordStatCard label="Duration" value={formatElapsedTime(lastSummary.durationSeconds)} note="Saved session time" />
                                    <RecordStatCard label="Distance" value={`${lastSummary.distanceKm.toFixed(2)} km`} note="Final route distance" />
                                    <RecordStatCard label="Calories" value={`${Math.round(lastSummary.calories)}`} note="Estimated burn" />
                                    <RecordStatCard label="Avg pace" value={formatWorkoutPace(lastSummary.avgPace)} note={`${lastSummary.avgHeartRate} bpm avg`} />
                                </div>

                                <div className="mt-4 flex flex-wrap gap-2">
                                    {completedWorkoutId && (
                                        <Button asChild variant="outline">
                                            <Link to={`/app/fitness/workouts/${completedWorkoutId}`}>
                                                Open workout detail
                                                <ArrowRight className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                    )}
                                    <Button asChild variant="ghost">
                                        <Link to="/app/fitness/history">Open workout history</Link>
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="track-lab-panel p-4">
                                    <div className="mb-4 flex items-center gap-2 text-[var(--primary)]">
                                        <Star className="h-4 w-4" />
                                        <span className="text-sm font-medium">Rate this session</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {[1, 2, 3, 4, 5].map((value) => (
                                            <button
                                                key={value}
                                                type="button"
                                                onClick={() => setWorkoutRating(value)}
                                                className={cn(
                                                    'flex h-11 w-11 items-center justify-center rounded-2xl border transition-all',
                                                    workoutRating >= value
                                                        ? 'border-[var(--surface-highlight-border)] bg-[var(--surface-highlight)] text-[var(--primary)] shadow-[var(--primary-glow)]'
                                                        : 'border-[var(--border)] bg-[var(--surface-3)] text-[var(--text-2)] hover:text-[var(--text)]'
                                                )}
                                            >
                                                <Star className={cn('h-4 w-4', workoutRating >= value && 'fill-current')} />
                                            </button>
                                        ))}
                                    </div>
                                    <textarea
                                        value={sessionNotes}
                                        onChange={(event) => setSessionNotes(event.target.value)}
                                        placeholder="How did this workout feel? What should Track Lab remember for the next one?"
                                        className="mt-4 min-h-[120px] w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-3)] px-4 py-3 text-sm text-[var(--text)] outline-none transition-colors placeholder:text-[var(--text-3)] focus:border-[var(--surface-highlight-border)]"
                                    />
                                </div>

                                <div className="track-lab-panel p-4">
                                    <div className="mb-4 flex items-center justify-between gap-4">
                                        <div>
                                            <div className="mb-2 flex items-center gap-2 text-[var(--primary)]">
                                                <ImagePlus className="h-4 w-4" />
                                                <span className="text-sm font-medium">Upload activity photos</span>
                                            </div>
                                            <p className="text-sm leading-6 text-[var(--text-2)]">
                                                Add a few photos from the session so the finish recap feels personal and complete.
                                            </p>
                                        </div>
                                        <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[var(--surface-highlight-border)] bg-[var(--surface-highlight)] px-4 py-2 text-sm font-semibold text-[var(--primary)] transition-colors hover:bg-[var(--surface-3)]">
                                            <ImagePlus className="h-4 w-4" />
                                            Add photos
                                            <input type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoUpload} />
                                        </label>
                                    </div>

                                    {photoPreviews.length > 0 ? (
                                        <div className="grid grid-cols-2 gap-3">
                                            {photoPreviews.map((photo) => (
                                                <div key={photo.url} className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-3)]">
                                                    <img src={photo.url} alt={photo.name} className="h-32 w-full object-cover" />
                                                    <div className="px-3 py-2 text-xs text-[var(--text-2)]">{photo.name}</div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-3)] px-4 py-6 text-center text-sm text-[var(--text-2)]">
                                            No activity photos yet. Add a few snapshots to complete the recap.
                                        </div>
                                    )}

                                    <Button className="mt-4 w-full" onClick={handleSaveReflection}>
                                        Save finish recap
                                    </Button>

                                    {savedReflectionAt && (
                                        <p className="mt-3 text-xs text-[var(--text-3)]">
                                            Saved locally at {new Date(savedReflectionAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </section>

                <PremiumPreview
                    locked={!hasPremiumAccess}
                    title="Time × Movement × Recovery Timeline"
                    teaser="A day map that merges work blocks, movement intensity, heart-rate stress and recovery context."
                >
                    <section className="track-lab-panel p-5 md:p-6">
                        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                            <div>
                                <div className="mb-2 flex items-center gap-2 text-[var(--primary)]">
                                    <Clock3 className="h-4 w-4" />
                                    <span className="text-xs font-semibold uppercase tracking-[0.2em]">Today timeline</span>
                                </div>
                                <h2 className="text-xl font-semibold text-[var(--text)]">Time × Movement × Recovery Timeline</h2>
                                <p className="mt-1 text-sm text-[var(--text-2)]">
                                    Hover or tap a block to inspect heart rate, energy, stress and the suggested next move.
                                </p>
                            </div>
                            <span className="track-metric-pill">
                                <Activity className="h-3.5 w-3.5" />
                                {model.timeline.length} blocks mapped
                            </span>
                        </div>

                        <div className="track-timeline-shell p-4 md:p-5">
                            <div className="mb-4 grid grid-cols-7 gap-2 text-[11px] uppercase tracking-[0.16em] text-[var(--text-3)]">
                                {['00', '04', '08', '12', '16', '20', '24'].map((tick) => (
                                    <span key={tick}>{tick}h</span>
                                ))}
                            </div>
                            <div className="track-timeline-grid">
                                {model.timeline.map((block) => (
                                    <button
                                        key={block.id}
                                        type="button"
                                        onMouseEnter={() => setActiveBlockId(block.id)}
                                        onFocus={() => setActiveBlockId(block.id)}
                                        onClick={() => setActiveBlockId(block.id)}
                                        className={cn(
                                            'track-timeline-block',
                                            getTimelineTone(block.kind),
                                            activeBlock?.id === block.id && 'ring-2 ring-[var(--surface-highlight-border)]'
                                        )}
                                        style={{
                                            left: `${(block.start / 24) * 100}%`,
                                            width: `${Math.max(((block.end - block.start) / 24) * 100, 6)}%`,
                                        }}
                                    >
                                        <span className="truncate text-xs font-semibold">{block.label}</span>
                                        <span className="text-[11px] text-[var(--text-3)]">
                                            {formatHour(block.start)} - {formatHour(block.end)}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {activeBlock && (
                            <div className="mt-5 grid gap-4 lg:grid-cols-[1.15fr_1fr]">
                                <div className="track-lab-panel p-4">
                                    <div className="mb-3 flex items-center justify-between">
                                        <div>
                                            <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-3)]">Selected block</p>
                                            <h3 className="mt-1 text-lg font-semibold text-[var(--text)]">{activeBlock.label}</h3>
                                        </div>
                                        <span className="track-metric-pill">
                                            {formatHour(activeBlock.start)} - {formatHour(activeBlock.end)}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <span className="track-note-chip">Avg HR {activeBlock.hr} bpm</span>
                                        <span className="track-note-chip">Energy {activeBlock.energy}/100</span>
                                        <span className="track-note-chip">Stress {activeBlock.stress.toFixed(1)}/5</span>
                                        <span className="track-note-chip">{activeBlock.movement}</span>
                                    </div>
                                    <p className="mt-4 text-sm leading-6 text-[var(--text-2)]">{activeBlock.insight}</p>
                                </div>

                                <div className="track-lab-panel p-4">
                                    <div className="mb-3 flex items-center gap-2 text-[var(--primary)]">
                                        <Sparkles className="h-4 w-4" />
                                        <span className="text-sm font-medium">Suggested adjustment</span>
                                    </div>
                                    <p className="text-sm leading-6 text-[var(--text-2)]">{model.timelineAdvice}</p>
                                    <div className="mt-4 space-y-3">
                                        <ProgressLine label="Energy fit" value={activeBlock.energy} tone="primary" />
                                        <ProgressLine label="Stress load" value={Math.round((activeBlock.stress / 5) * 100)} tone="danger" />
                                        <ProgressLine label="Readiness overlap" value={Math.round((activeBlock.energy + model.readiness) / 2)} tone="warning" />
                                    </div>
                                </div>
                            </div>
                        )}
                    </section>
                </PremiumPreview>

                <PremiumPreview
                    locked={!hasPremiumAccess}
                    title="Body Metrics & Recovery Lab"
                    teaser="A premium core layer focused on sleep, HRV, RHR, stress correlation and hydration-energy patterns."
                >
                    <section className="track-lab-panel p-5 md:p-6">
                        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                            <div>
                                <div className="mb-2 flex items-center gap-2 text-[var(--primary)]">
                                    <HeartPulse className="h-4 w-4" />
                                    <span className="text-xs font-semibold uppercase tracking-[0.2em]">Premium core</span>
                                </div>
                                <h2 className="text-xl font-semibold text-[var(--text)]">Body Metrics & Recovery Lab</h2>
                                <p className="mt-1 text-sm text-[var(--text-2)]">
                                    Use the tabs to move between recovery, stress-focus correlation and hydration-energy patterns.
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                {[7, 30].map((range) => (
                                    <button
                                        key={range}
                                        type="button"
                                        onClick={() => setLabRange(range as LabRange)}
                                        className={cn(
                                            'rounded-full border px-3 py-1.5 text-sm transition-colors',
                                            labRange === range
                                                ? 'border-[var(--surface-highlight-border)] bg-[var(--surface-highlight)] text-[var(--primary)]'
                                                : 'border-[var(--border)] bg-[var(--surface-3)] text-[var(--text-2)] hover:text-[var(--text)]'
                                        )}
                                    >
                                        {range}d
                                    </button>
                                ))}
                            </div>
                        </div>

                        <Tabs value={labTab} onValueChange={(value) => setLabTab(value as LabTab)} className="w-full">
                            <TabsList className="mb-6">
                                <TabsTrigger value="recovery">Recovery & Sleep</TabsTrigger>
                                <TabsTrigger value="stress">Stress & Focus</TabsTrigger>
                                <TabsTrigger value="hydration">Hydration & Energy</TabsTrigger>
                            </TabsList>

                            <TabsContent value="recovery">
                                <div className="grid gap-4 lg:grid-cols-3">
                                    <MetricCard
                                        title="Sleep duration"
                                        value={`${rangeSeries[rangeSeries.length - 1]?.sleep.toFixed(1) || '0.0'}h`}
                                        note={formatDelta(delta(rangeSeries, 'sleep'), 'h')}
                                        chart={<Sparkline points={rangeSeries.map((item) => item.sleep * 10)} />}
                                    />
                                    <MetricCard
                                        title="Sleep score"
                                        value={`${Math.round(rangeSeries[rangeSeries.length - 1]?.sleepScore || 0)}`}
                                        note={formatDelta(delta(rangeSeries, 'sleepScore'))}
                                        chart={<Sparkline points={rangeSeries.map((item) => item.sleepScore)} />}
                                    />
                                    <MetricCard
                                        title="RHR / HRV"
                                        value={`${Math.round(rangeSeries[rangeSeries.length - 1]?.rhr || 0)} bpm`}
                                        note={`${Math.round(rangeSeries[rangeSeries.length - 1]?.hrv || 0)} ms HRV`}
                                        chart={<Sparkline points={rangeSeries.map((item) => item.hrv)} />}
                                    />
                                </div>
                                <div className="mt-5 flex flex-wrap gap-2">
                                    {model.recoveryAlerts.map((item) => (
                                        <span key={item} className="track-note-chip track-note-chip-warning">
                                            {item}
                                        </span>
                                    ))}
                                </div>
                            </TabsContent>

                            <TabsContent value="stress">
                                <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
                                    <div className="track-chart-card p-4">
                                        <div className="mb-4 flex items-center justify-between">
                                            <div>
                                                <h3 className="font-semibold text-[var(--text)]">Workload correlation</h3>
                                                <p className="text-sm text-[var(--text-2)]">
                                                    Deep work, meetings and stress signals over {labRange} days.
                                                </p>
                                            </div>
                                            <span className="track-metric-pill">
                                                <Target className="h-3.5 w-3.5" />
                                                Focus map
                                            </span>
                                        </div>
                                        <div className="space-y-3">
                                            {rangeSeries.slice(-6).map((item) => (
                                                <div key={item.label} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-3)] p-3">
                                                    <div className="mb-3 flex items-center justify-between">
                                                        <span className="text-sm font-medium text-[var(--text)]">{item.label}</span>
                                                        <span className="text-xs text-[var(--text-3)]">Stress {item.stress.toFixed(1)}/5</span>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <ProgressLine label="Deep work" value={Math.round((item.deep / 5.5) * 100)} tone="primary" />
                                                        <ProgressLine label="Meetings" value={Math.round((item.meetings / 4.5) * 100)} tone="warning" />
                                                        <ProgressLine label="Stress" value={Math.round((item.stress / 5) * 100)} tone="danger" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        {model.focusInsights.map((item) => (
                                            <InfoCard key={item} title="Focus insight" value="Correlation" note={item} icon={<Activity className="h-4 w-4" />} />
                                        ))}
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="hydration">
                                <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
                                    <div className="track-chart-card p-4">
                                        <div className="mb-4 flex items-center justify-between">
                                            <div>
                                                <h3 className="font-semibold text-[var(--text)]">Hydration cadence</h3>
                                                <p className="text-sm text-[var(--text-2)]">
                                                    Daily water rhythm against energy and readiness.
                                                </p>
                                            </div>
                                            <span className="track-metric-pill">
                                                <Droplets className="h-3.5 w-3.5" />
                                                {labRange}d view
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-10 gap-2">
                                            {rangeSeries.slice(-10).map((item) => (
                                                <div key={item.label} className="flex flex-col items-center gap-2">
                                                    <div className="flex h-36 w-full items-end rounded-2xl bg-[var(--surface-3)] p-1">
                                                        <div
                                                            className="w-full rounded-xl bg-[image:var(--primary-gradient)] shadow-[var(--primary-glow)]"
                                                            style={{ height: `${Math.max((item.hydration / 3.6) * 100, 12)}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-[11px] uppercase tracking-[0.16em] text-[var(--text-3)]">{item.label}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        {model.hydrationInsights.map((item) => (
                                            <InfoCard key={item} title="Energy insight" value="Hydration" note={item} icon={<Droplets className="h-4 w-4" />} />
                                        ))}
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </section>
                </PremiumPreview>

                <PremiumPreview
                    locked={!hasPremiumAccess}
                    title="Performance Snapshot (All-sports)"
                    teaser="Quality, training load and consistency across sessions without repeating steps, calories or distance from Fitness."
                >
                    <section className="track-lab-panel p-5 md:p-6">
                        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                            <div>
                                <div className="mb-2 flex items-center gap-2 text-[var(--primary)]">
                                    <Route className="h-4 w-4" />
                                    <span className="text-xs font-semibold uppercase tracking-[0.2em]">All-sports snapshot</span>
                                </div>
                                <h2 className="text-xl font-semibold text-[var(--text)]">Performance Snapshot</h2>
                                <p className="mt-1 text-sm text-[var(--text-2)]">
                                    Focus on session quality, load balance and consistency rather than raw movement totals.
                                </p>
                            </div>
                            <span className="track-metric-pill">
                                <TrendingUp className="h-3.5 w-3.5" />
                                {model.sessions.length} sessions in view
                            </span>
                        </div>

                        <div className="grid gap-4 lg:grid-cols-3">
                            <MetricCard
                                title="Load 7 ngày"
                                value={`${Math.round(model.load7d)}`}
                                note={model.loadLevel}
                                chart={<Sparkline points={model.series.slice(-7).map((item) => item.load)} />}
                            />
                            <MetricCard
                                title="Buổi chất lượng cao"
                                value={`${model.qualitySessions}`}
                                note={`${model.sessions.length} sessions tracked`}
                                chart={<Sparkline points={model.sessions.map((item) => item.effort)} />}
                            />
                            <MetricCard
                                title="Consistency"
                                value={`${model.consistency}%`}
                                note={`${model.balanceStreak} balanced weeks`}
                                chart={<Sparkline points={model.series.slice(-7).map((item) => item.readiness)} />}
                            />
                        </div>

                        <div className="mt-5 grid gap-4 xl:grid-cols-[0.92fr_1.08fr]">
                            <div className="track-chart-card p-4">
                                <div className="mb-3 flex items-center gap-2 text-[var(--primary)]">
                                    <CalendarRange className="h-4 w-4" />
                                    <span className="text-sm font-medium">Weekly balance</span>
                                </div>
                                <div className="space-y-3">
                                    {model.weekPlan.map((item) => (
                                        <div key={item.day} className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface-3)] px-3 py-2">
                                            <div>
                                                <p className="text-sm font-medium text-[var(--text)]">{item.day}</p>
                                                <p className="text-xs text-[var(--text-2)]">{item.note}</p>
                                            </div>
                                            <span className={cn('track-load-pill', getLoadPillClass(item.mode))}>{item.mode}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="grid gap-4 md:grid-cols-2">
                                {model.sessions.map((session) => (
                                    <div key={session.id} className="track-lab-panel p-4">
                                        <div className="mb-3 flex items-center justify-between">
                                            <span className="track-metric-pill">
                                                <Route className="h-3.5 w-3.5" />
                                                {session.sport}
                                            </span>
                                            <span className={cn('track-load-pill', getLoadPillClass(session.load))}>{session.tag}</span>
                                        </div>
                                        <p className="text-lg font-semibold text-[var(--text)]">{session.duration} min</p>
                                        <div className="mt-3 flex items-center justify-between text-sm text-[var(--text-2)]">
                                            <span>Effort {session.effort}</span>
                                            <span>{session.when}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                </PremiumPreview>

                <PremiumPreview
                    locked={!hasPremiumAccess}
                    title="AI Insights & Suggestions"
                    teaser="Actionable daily and weekly suggestions shaped by recovery, schedule pressure and balanced streaks."
                >
                    <section className="grid gap-4 xl:grid-cols-3">
                        <InfoCard title="Hôm nay nên làm gì?" value="AI action" note={model.aiToday} icon={<Sparkles className="h-4 w-4" />} />
                        <InfoCard title="Kế hoạch tuần thông minh" value="Smart week" note={model.aiWeek} icon={<CalendarRange className="h-4 w-4" />} />
                        <InfoCard title="Streak thông minh" value="Balanced streak" note={model.aiStreak} icon={<Target className="h-4 w-4" />} />
                    </section>
                </PremiumPreview>
            </div>
        </div>
    );
}

function PremiumPreview({
    locked,
    title,
    teaser,
    compact = false,
    children,
}: {
    locked: boolean;
    title: string;
    teaser: string;
    compact?: boolean;
    children: ReactNode;
}) {
    return (
        <div className="relative">
            <div className={cn('transition-all duration-300', locked && 'pointer-events-none select-none blur-[8px] saturate-[0.8]')}>
                {children}
            </div>
            {locked && (
                <div className={cn('track-premium-overlay', compact && 'track-premium-overlay-compact')}>
                    <div className="max-w-md text-center">
                        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-[var(--surface-highlight-border)] bg-[var(--surface-highlight)] text-[var(--primary)]">
                            <Lock className="h-5 w-5" />
                        </div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--primary)]">Premium preview</p>
                        <h3 className="text-xl font-semibold text-[var(--text)]">{title}</h3>
                        <p className="mt-3 text-sm leading-6 text-[var(--text-2)]">{teaser}</p>
                        <Button asChild className="mt-5">
                            <Link to="/app/subscription">
                                Unlock Track Lab
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

function InfoCard({ title, value, note, icon }: { title: string; value: string; note: string; icon: ReactNode }) {
    return (
        <div className="track-lab-panel p-4">
            <div className="mb-2 flex items-center gap-2 text-[var(--primary)]">
                {icon}
                <span className="text-sm font-medium text-[var(--text)]">{title}</span>
            </div>
            <p className="text-2xl font-semibold text-[var(--text)]">{value}</p>
            <p className="mt-2 text-sm leading-6 text-[var(--text-2)]">{note}</p>
        </div>
    );
}

function RecordStatCard({ label, value, note }: { label: string; value: string; note: string }) {
    return (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-3)] p-4 shadow-[var(--shadow-sm)]">
            <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-3)]">{label}</p>
            <p className="mt-2 text-xl font-semibold text-[var(--text)]">{value}</p>
            <p className="mt-2 text-xs leading-5 text-[var(--text-2)]">{note}</p>
        </div>
    );
}

function RoutePreview({
    points,
    active = false,
    title,
    status,
}: {
    points: Array<{ lat: number; lng: number }>;
    active?: boolean;
    title: string;
    status: string;
}) {
    if (points.length === 0) {
        return (
            <div className="track-route-shell">
                <div className="track-route-overlay" />
                <div className="track-route-empty">
                    <Route className="h-5 w-5 text-[var(--primary)]" />
                    <div>
                        <p className="text-sm font-medium text-[var(--text)]">{title}</p>
                        <p className="mt-1 text-sm text-[var(--text-2)]">Start recording to draw the route path and build the finish snapshot.</p>
                    </div>
                </div>
            </div>
        );
    }

    const projected = projectTrackPoints(points);
    const polyline = projected.map((point) => `${point.x},${point.y}`).join(' ');
    const start = projected[0];
    const finish = projected[projected.length - 1];

    return (
        <div className="track-route-shell">
            <div className="track-route-overlay" />
            <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                    <p className="text-sm font-medium text-[var(--text)]">{title}</p>
                    <p className="mt-1 text-xs text-[var(--text-3)]">{status}</p>
                </div>
                <span className={cn('track-load-pill', active ? 'track-load-pill-danger' : 'track-load-pill-primary')}>
                    {active ? 'Live route' : 'Route image'}
                </span>
            </div>

            <svg viewBox="0 0 320 220" className="track-route-map" role="img" aria-label={title}>
                <defs>
                    <linearGradient id="track-route-stroke" x1="0%" x2="100%" y1="0%" y2="100%">
                        <stop offset="0%" stopColor="rgba(0,229,255,0.98)" />
                        <stop offset="100%" stopColor="rgba(10,132,255,0.92)" />
                    </linearGradient>
                </defs>

                {Array.from({ length: 7 }, (_, index) => (
                    <line
                        key={`v-${index}`}
                        x1={32 + index * 42}
                        y1="24"
                        x2={32 + index * 42}
                        y2="196"
                        stroke="rgba(255,255,255,0.05)"
                        strokeDasharray="4 10"
                    />
                ))}
                {Array.from({ length: 4 }, (_, index) => (
                    <line
                        key={`h-${index}`}
                        x1="24"
                        y1={46 + index * 38}
                        x2="296"
                        y2={46 + index * 38}
                        stroke="rgba(255,255,255,0.05)"
                        strokeDasharray="4 10"
                    />
                ))}

                <polyline
                    points={polyline}
                    fill="none"
                    stroke="url(#track-route-stroke)"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={active ? 'track-route-path-active' : 'track-route-path'}
                />

                {projected.filter((_, index) => index > 0 && index < projected.length - 1 && index % Math.max(Math.floor(projected.length / 4), 2) === 0).map((point) => (
                    <circle key={`${point.x}-${point.y}`} cx={point.x} cy={point.y} r="4" fill="rgba(255,255,255,0.9)" />
                ))}

                <circle cx={start.x} cy={start.y} r="7" fill="rgba(34,197,94,0.95)" />
                <circle cx={finish.x} cy={finish.y} r="7" fill="rgba(0,229,255,0.98)" />
            </svg>

            <div className="mt-3 flex flex-wrap gap-2">
                <span className="track-note-chip">Start marker captured</span>
                <span className="track-note-chip">Finish marker captured</span>
                <span className="track-note-chip">Path points {points.length}</span>
            </div>
        </div>
    );
}

function MetricCard({
    title,
    value,
    note,
    chart,
}: {
    title: string;
    value: string;
    note: string;
    chart: ReactNode;
}) {
    return (
        <div className="track-chart-card p-4">
            <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                    <p className="text-sm text-[var(--text-2)]">{title}</p>
                    <p className="mt-2 text-2xl font-semibold text-[var(--text)]">{value}</p>
                </div>
                <span className="track-load-pill track-load-pill-primary">{note}</span>
            </div>
            {chart}
        </div>
    );
}

function SignalMini({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-3)] px-3 py-3 text-center">
            <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-3)]">{label}</p>
            <p className="mt-2 text-sm font-semibold text-[var(--text)]">{value}</p>
        </div>
    );
}

function ProgressLine({
    label,
    value,
    tone,
}: {
    label: string;
    value: number;
    tone: 'primary' | 'warning' | 'danger';
}) {
    return (
        <div>
            <div className="mb-1 flex items-center justify-between text-xs text-[var(--text-3)]">
                <span>{label}</span>
                <span>{value}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[var(--surface-3)]">
                <div
                    className={cn(
                        'h-full rounded-full',
                        tone === 'primary' && 'bg-[image:var(--primary-gradient)]',
                        tone === 'warning' && 'bg-gradient-to-r from-amber-400 to-orange-500',
                        tone === 'danger' && 'bg-gradient-to-r from-rose-500 to-red-500'
                    )}
                    style={{ width: `${value}%` }}
                />
            </div>
        </div>
    );
}

function Sparkline({ points, bright = false }: { points: number[]; bright?: boolean }) {
    if (points.length === 0) {
        return <div className="h-16 rounded-2xl bg-[var(--surface-3)]" />;
    }

    const width = 220;
    const height = 64;
    const min = Math.min(...points);
    const max = Math.max(...points);
    const spread = max - min || 1;
    const step = points.length > 1 ? width / (points.length - 1) : width;
    const polyline = points
        .map((point, index) => {
            const x = step * index;
            const y = height - ((point - min) / spread) * (height - 10) - 5;
            return `${x},${y}`;
        })
        .join(' ');

    return (
        <svg viewBox={`0 0 ${width} ${height}`} className="h-16 w-full">
            <defs>
                <linearGradient id={bright ? 'track-lab-bright' : 'track-lab-soft'} x1="0%" x2="100%" y1="0%" y2="0%">
                    <stop offset="0%" stopColor="rgba(0,229,255,0.95)" />
                    <stop offset="100%" stopColor="rgba(10,132,255,0.85)" />
                </linearGradient>
            </defs>
            <polyline
                fill="none"
                stroke={bright ? 'url(#track-lab-bright)' : 'url(#track-lab-soft)'}
                strokeWidth="3"
                points={polyline}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

async function resolveStartingPoint(mode: TrackingMode) {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
        return { ...getFallbackTrackSeed(mode), simulated: true };
    }

    try {
        const position = await getCurrentPosition();
        return {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            speed:
                position.coords.speed == null
                    ? roundDecimal(getTrackingSeedSpeed(mode) * 0.72, 1)
                    : roundDecimal(Math.max(position.coords.speed * 3.6, 0), 1),
            altitude: position.coords.altitude ?? undefined,
            simulated: false,
        };
    } catch (error) {
        console.error('Failed to resolve GPS start point:', error);
        return { ...getFallbackTrackSeed(mode), simulated: true };
    }
}

function createTrackPointFromPosition(position: GeolocationPosition): LiveTrackPoint {
    return {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        altitude: position.coords.altitude ?? undefined,
        speed: roundDecimal(Math.max((position.coords.speed ?? 0) * 3.6, 0), 1),
        timestamp: new Date(position.timestamp).toISOString(),
    };
}

function simulateNextTrackPoint(current: LiveTrackPoint, step: number, mode: TrackingMode): LiveTrackPoint {
    const factor = mode === 'cycling' ? 0.0012 : mode === 'running' ? 0.00062 : mode === 'hiking' ? 0.0004 : 0.00034;
    const latOffset = Math.sin(step / 1.8) * factor + factor * 0.85;
    const lngOffset = Math.cos(step / 2.2) * factor + factor * 0.4;

    return {
        lat: current.lat + latOffset,
        lng: current.lng + lngOffset,
        altitude: current.altitude,
        speed: roundDecimal(getTrackingSeedSpeed(mode) + Math.sin(step / 2.5) * 1.8, 1),
        timestamp: new Date().toISOString(),
    };
}

function appendUniqueTrackPoint(points: LiveTrackPoint[], point: LiveTrackPoint) {
    const lastPoint = points[points.length - 1];
    if (!lastPoint) {
        return [point];
    }

    if (haversineDistanceKm(lastPoint, point) < 0.003) {
        return points;
    }

    return [...points, point];
}

function calculateTrackDistance(points: Array<{ lat: number; lng: number }>) {
    if (points.length < 2) {
        return 0;
    }

    let distance = 0;
    for (let index = 1; index < points.length; index += 1) {
        distance += haversineDistanceKm(points[index - 1], points[index]);
    }

    return roundDecimal(distance, 2);
}

function haversineDistanceKm(start: { lat: number; lng: number }, end: { lat: number; lng: number }) {
    const earthRadiusKm = 6371;
    const deltaLat = degToRad(end.lat - start.lat);
    const deltaLng = degToRad(end.lng - start.lng);
    const a =
        Math.sin(deltaLat / 2) ** 2 +
        Math.cos(degToRad(start.lat)) * Math.cos(degToRad(end.lat)) * Math.sin(deltaLng / 2) ** 2;

    return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function degToRad(value: number) {
    return (value * Math.PI) / 180;
}

function estimateCaloriesBurned(mode: TrackingMode, elapsedSeconds: number, distanceKm: number) {
    const perKm = mode === 'cycling' ? 42 : mode === 'running' ? 63 : mode === 'hiking' ? 54 : 32;
    const timeLift = elapsedSeconds / 45;
    return Math.max(Math.round(distanceKm * perKm + timeLift), 0);
}

function estimateLiveHeartRate(mode: TrackingMode, currentSpeed: number, elapsedSeconds: number, readiness: number) {
    const base = mode === 'cycling' ? 112 : mode === 'running' ? 126 : mode === 'hiking' ? 118 : 96;
    const speedLift = currentSpeed * 1.8;
    const readinessOffset = Math.max(0, 72 - readiness) * 0.22;
    const warmup = Math.min(elapsedSeconds / 30, 18);
    return clamp(Math.round(base + speedLift + readinessOffset + warmup), 78, 186);
}

function estimateLiveEnergy(readiness: number, elapsedSeconds: number, distanceKm: number) {
    return clamp(Math.round(readiness - elapsedSeconds / 90 - distanceKm * 8 + 10), 18, 100);
}

function describeLiveStress(mode: TrackingMode, currentSpeed: number, readiness: number, elapsedSeconds: number) {
    const stressScore =
        currentSpeed +
        elapsedSeconds / 180 +
        Math.max(65 - readiness, 0) * 0.35 +
        (mode === 'running' ? 4 : mode === 'hiking' ? 2 : 0);
    if (stressScore >= 24) return 'Pushed';
    if (stressScore >= 14) return 'Focused';
    return 'Calm';
}

function buildWorkoutSummary({
    mode,
    elapsedSeconds,
    distanceKm,
    calories,
    avgPace,
    avgHeartRate,
    energyScore,
    stressState,
    syncMode,
    path,
    startedAt,
}: {
    mode: TrackingMode;
    elapsedSeconds: number;
    distanceKm: number;
    calories: number;
    avgPace: number | null;
    avgHeartRate: number;
    energyScore: number;
    stressState: string;
    syncMode: string;
    path: LiveTrackPoint[];
    startedAt: string;
}): WorkoutSummary {
    return {
        title: `${getTrackingModeLabel(mode)} Track Lab Session`,
        mode,
        durationSeconds: elapsedSeconds,
        distanceKm: roundDecimal(distanceKm, 2),
        calories,
        avgPace: avgPace ? roundDecimal(avgPace, 1) : null,
        avgHeartRate,
        energyScore,
        stressState,
        syncMode,
        startedAt,
        completedAt: new Date().toISOString(),
        path,
    };
}

function buildRoutePayload(path: LiveTrackPoint[], distanceKm: number, durationSeconds: number) {
    if (path.length === 0) {
        return undefined;
    }

    const start = path[0];
    const end = path[path.length - 1];

    return {
        startLat: start.lat,
        startLng: start.lng,
        endLat: end.lat,
        endLng: end.lng,
        totalDistance: roundDecimal(distanceKm, 2),
        duration: Math.max(durationSeconds, 1),
        path: path.map((point) => ({ lat: point.lat, lng: point.lng })),
    };
}

async function syncWorkoutIntoDailyActivity(
    summary: WorkoutSummary,
    currentActivity: DailyActivity | null | undefined,
    activityDate: string
) {
    const durationMinutes = Math.max(1, Math.round(summary.durationSeconds / 60));
    const existingMinutes = currentActivity?.activeMinutes ?? 0;

    return fitnessService.syncActivity({
        date: activityDate,
        steps: (currentActivity?.steps ?? 0) + estimateWorkoutSteps(summary.mode, summary.distanceKm),
        distance: roundDecimal((currentActivity?.distance ?? 0) + summary.distanceKm, 2),
        calories: (currentActivity?.calories ?? 0) + Math.round(summary.calories),
        activeMinutes: existingMinutes + durationMinutes,
        sleepMinutes: currentActivity?.sleepMinutes,
        heartRateAvg: blendHeartRate(currentActivity?.heartRateAvg, existingMinutes, summary.avgHeartRate, durationMinutes),
        source: `track-lab:${summary.mode}`,
    });
}

function projectTrackPoints(points: Array<{ lat: number; lng: number }>) {
    const width = 320;
    const height = 220;
    const padding = 24;
    const lats = points.map((point) => point.lat);
    const lngs = points.map((point) => point.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const latSpan = maxLat - minLat || 0.001;
    const lngSpan = maxLng - minLng || 0.001;

    return points.map((point) => ({
        x: padding + ((point.lng - minLng) / lngSpan) * (width - padding * 2),
        y: height - padding - ((point.lat - minLat) / latSpan) * (height - padding * 2),
    }));
}

function formatElapsedTime(totalSeconds: number) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function formatWorkoutPace(pace: number | null) {
    if (!pace || pace <= 0 || !Number.isFinite(pace)) {
        return '--';
    }

    const wholeMinutes = Math.floor(pace);
    const seconds = Math.round((pace - wholeMinutes) * 60);
    return `${wholeMinutes}:${seconds.toString().padStart(2, '0')}/km`;
}

function getTrackingSeedSpeed(mode: TrackingMode) {
    if (mode === 'cycling') return 21;
    if (mode === 'running') return 9.2;
    if (mode === 'hiking') return 5.7;
    return 4.8;
}

function getTrackingIntensity(mode: TrackingMode) {
    if (mode === 'cycling') return 'moderate';
    if (mode === 'running') return 'high';
    if (mode === 'hiking') return 'moderate';
    return 'light';
}

function getTrackingModeLabel(mode: TrackingMode) {
    if (mode === 'cycling') return 'Ride';
    if (mode === 'running') return 'Run';
    if (mode === 'hiking') return 'Hike';
    return 'Walk';
}

function estimateWorkoutSteps(mode: TrackingMode, distanceKm: number) {
    const stepsPerKm = mode === 'running' ? 1320 : mode === 'hiking' ? 1680 : mode === 'walking' ? 1450 : 0;
    return Math.round(distanceKm * stepsPerKm);
}

function blendHeartRate(
    previousHeartRate: number | undefined,
    previousMinutes: number,
    sessionHeartRate: number,
    sessionMinutes: number
) {
    if (!previousHeartRate || previousMinutes <= 0) {
        return sessionHeartRate;
    }

    const weightedAverage =
        (previousHeartRate * previousMinutes + sessionHeartRate * sessionMinutes) /
        (previousMinutes + sessionMinutes);
    return Math.round(weightedAverage);
}

function getFallbackTrackSeed(mode: TrackingMode) {
    return {
        lat: 10.7768,
        lng: 106.7009,
        speed: getTrackingSeedSpeed(mode),
        altitude: 6,
    };
}

function getCurrentPosition() {
    return new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
        });
    });
}

function readPhotoPreview(file: File) {
    return new Promise<TrackReflectionPhoto>((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => resolve({ name: file.name, url: String(reader.result) });
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
    });
}

function roundDecimal(value: number, precision: number) {
    const multiplier = 10 ** precision;
    return Math.round(value * multiplier) / multiplier;
}

function buildTrackModel({
    todayActivity,
    weeklyStats,
    exercises,
    timeBlocks,
    routes,
}: {
    todayActivity: DailyActivity | null | undefined;
    weeklyStats: WeeklyStats | null | undefined;
    exercises: Exercise[];
    timeBlocks: TimeBlock[];
    routes: GpsRoute[];
}) {
    const recentExercises = [...exercises].sort((a, b) => new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime());
    const sleepHours = clamp((todayActivity?.sleepMinutes ?? 430) / 60, 5.3, 8.9);
    const baseHr = todayActivity?.heartRateAvg ?? weeklyStats?.avgHeartRate ?? 68;
    const timeline = buildTimeline(timeBlocks, recentExercises, sleepHours, baseHr);
    const meetingHours = totalHours(timeline, 'meeting');
    const deepHours = totalHours(timeline, 'deep-work');
    const loadFromExercises = recentExercises.slice(0, 7).reduce((sum, item) => sum + effortScore(item), 0);
    const readiness = clamp(
        Math.round(
            68 +
                (sleepHours - 7) * 12 -
                meetingHours * 5 -
                loadFromExercises * 0.05 -
                Math.max(baseHr - 66, 0) * 1.2 +
                deepHours * 2
        ),
        28,
        96
    );
    const series = buildSeries(readiness, sleepHours, baseHr, meetingHours, deepHours, loadFromExercises);
    const current = series[series.length - 1];
    current.readiness = readiness;
    current.sleep = sleepHours;
    current.rhr = Math.round(baseHr);
    current.hrv = clamp(Math.round(58 + (sleepHours - 7) * 8 - meetingHours * 2.4), 34, 82);
    current.sleepScore = clamp(Math.round(current.sleep * 12 + current.hrv * 0.42), 48, 96);
    current.hydration = clamp(2.1 + deepHours * 0.12 - meetingHours * 0.06 + sleepHours * 0.08, 1.6, 3.7);
    current.stress = clamp(2.1 + meetingHours * 0.55 + Math.max(baseHr - 66, 0) * 0.05, 1.1, 4.8);
    current.load = clamp(loadFromExercises / 7, 24, 92);

    const sessions = buildSessions(recentExercises, routes);
    const readinessLevel = readiness >= 76 ? 'High' : readiness >= 56 ? 'Medium' : 'Low';
    const loadLevel = loadFromExercises >= 360 ? 'High' : loadFromExercises >= 220 ? 'Medium' : 'Low';

    return {
        readiness,
        readinessLevel,
        readinessDelta: readiness - series[series.length - 2].readiness,
        recommendation:
            readinessLevel === 'High'
                ? 'Hôm nay nên: Đẩy mạnh tập, nhưng vẫn giữ một block recovery sau buổi nặng.'
                : readinessLevel === 'Medium'
                  ? 'Hôm nay nên: Tập vừa, ưu tiên block quan trọng ngay sau vận động nhẹ.'
                  : 'Hôm nay nên: Ưu tiên hồi phục và giảm cường độ ở cả tập luyện lẫn lịch họp dày.',
        reasons: [
            sleepHours < 6.5 && 'Ngủ ít hơn baseline',
            loadFromExercises > 320 && 'Tải tập 7 ngày đang cao',
            meetingHours > 3 && 'Lịch họp đang dày',
            baseHr > 74 && 'RHR cao hơn bình thường',
            deepHours >= 2.5 && 'Có cửa sổ deep work tốt',
        ].filter(Boolean) as string[],
        energyState: readiness >= 78 ? 'High' : readiness >= 54 ? 'Normal' : 'Low',
        stressState: current.stress >= 3.8 ? 'Stressed' : current.stress >= 2.5 ? 'Focused' : 'Calm',
        loadLevel,
        energyNote:
            readiness >= 78
                ? 'Body and calendar are aligned enough for ambitious work.'
                : readiness >= 54
                  ? 'Giữ nhịp đều, tránh dồn cả họp lẫn bài nặng vào cùng một nửa ngày.'
                  : 'Nên neo ngày bằng break ngắn và vận động nhẹ để tránh tụt năng lượng.',
        stressNote:
            current.stress >= 3.8
                ? 'Calendar pressure and bio signals are both elevated.'
                : current.stress >= 2.5
                  ? 'Stress đang trong ngưỡng có thể chuyển hóa thành tập trung.'
                  : 'Signals đang yên, có thể bảo vệ focus tốt hơn trong nửa đầu ngày.',
        schedulePressure: meetingHours >= 3.5 ? 'High' : meetingHours >= 1.75 ? 'Managed' : 'Light',
        todayInsight:
            meetingHours >= 3
                ? 'Sau cụm họp dài, một break vận động 8-10 phút sẽ giúp hạ stress nhanh hơn nhiều so với ngồi nghỉ tại chỗ.'
                : 'Khung giờ làm việc sâu đang khá đẹp. Đặt việc khó nhất ngay sau một block di chuyển nhẹ để giữ đà.',
        timeline,
        timelineAdvice:
            meetingHours >= 3
                ? 'Khung giờ này thường quá stress. Nếu lịch chưa đổi được, hãy chen 1 break đi bộ ngắn giữa 2 block họp để kéo nhịp tim xuống.'
                : 'Đây là một cửa sổ tốt cho deep work hoặc bài tập vừa sức, miễn là bạn không nối nó trực tiếp với một cụm stress cao.',
        series,
        recoveryAlerts: [
            series.slice(-3).every((item) => item.hrv < series[0].hrv) && 'HRV đang giảm liên tục hơn 3 ngày',
            series.slice(-3).every((item) => item.rhr >= current.rhr - 1) && 'RHR nhích lên trong vài ngày gần đây',
            sleepHours < 6.6 && 'Giấc ngủ thấp hơn ngưỡng phục hồi tối ưu',
        ].filter(Boolean) as string[],
        focusInsights: [
            'Slot 9-11h: hiệu suất cao hơn khi có vận động nhẹ trước đó 20-30 phút.',
            meetingHours >= 3
                ? 'Sau 3 giờ họp liên tục, stress tăng mạnh. Nên thêm break vận động thay vì chuyển thẳng sang deep work.'
                : 'Khi deep work được gom trước cụm họp, nhịp tim và cảm nhận stress ổn định hơn.',
        ],
        hydrationInsights: [
            current.hydration < 2.2
                ? 'Hydration thấp đang đi cùng readiness giảm. Tăng 400-600ml trước block tập trung dài.'
                : 'Hydration đều đang giữ năng lượng nửa đầu ngày ổn định hơn.',
            current.stress > 3.2
                ? 'Những ngày stress cao thường đi cùng uống nước ít hơn. Hãy neo hydration vào các break cố định.'
                : 'Khi hydration đủ, mệt mỏi cuối ngày giảm rõ rệt dù lịch vẫn bận.',
        ],
        load7d: sessions.reduce((sum, item) => sum + item.effort, 0),
        sessions,
        qualitySessions: sessions.filter((item) => item.effort >= 75).length,
        consistency: clamp(Math.round((sessions.length / 4) * 100), 22, 100),
        balanceStreak: clamp(Math.round((clamp(Math.round((sessions.length / 4) * 100), 22, 100) + readiness) / 28), 1, 8),
        weekPlan: [
            { day: 'Mon', mode: readinessLevel === 'High' ? 'Heavy' : 'Light', note: 'Open with the strongest session.' },
            { day: 'Tue', mode: 'Light', note: 'Keep movement without crowding focus blocks.' },
            { day: 'Wed', mode: meetingHours >= 3 ? 'Recovery' : 'Heavy', note: 'Only push if calendar stays breathable.' },
            { day: 'Thu', mode: 'Light', note: 'Technique, tempo or aerobic support.' },
            { day: 'Fri', mode: sessions.length > 2 ? 'Heavy' : 'Light', note: 'Use the remaining intensity budget here.' },
            { day: 'Sat', mode: 'Recovery', note: 'Sleep reset and low-intensity mobility.' },
            { day: 'Sun', mode: 'Recovery', note: 'Protect readiness for the next week.' },
        ] as Array<{ day: string; mode: 'Heavy' | 'Light' | 'Recovery'; note: string }>,
        aiToday:
            readinessLevel === 'Low'
                ? 'Lịch hôm nay nhiều áp lực + readiness thấp: chỉ nên tập nhẹ 20 phút đi bộ trước giờ làm và cắt bớt khối lượng nặng.'
                : readinessLevel === 'Medium'
                  ? 'Một buổi vừa sức + 1 block deep work đặt sau vận động nhẹ sẽ cho hiệu quả cao hơn dồn toàn bộ việc khó vào cuối ngày.'
                  : 'Readiness tốt: có thể xếp 1 buổi chất lượng cao, nhưng nên khóa thêm một block hồi phục ngay sau đó.',
        aiWeek:
            meetingHours >= 3
                ? 'Tuần này nên phân bổ 2 ngày nặng, 3 ngày nhẹ/chất lượng, 2 ngày recovery để lịch họp không đẩy bạn vào trạng thái quá tải.'
                : 'Tuần này phù hợp với 3 ngày tập nặng, 2 ngày tập nhẹ và 2 ngày recovery dựa trên mức readiness hiện tại.',
        aiStreak: `Balanced streak hiện tại là ${clamp(Math.round((clamp(Math.round((sessions.length / 4) * 100), 22, 100) + readiness) / 28), 1, 8)} tuần: bạn đang giữ được nhịp ngủ, tập và hồi phục ở mức ${clamp(Math.round((sessions.length / 4) * 100), 22, 100)}% ổn định.`,
    };
}

function buildSeries(readiness: number, sleep: number, baseHr: number, meetings: number, deep: number, load: number) {
    return Array.from({ length: 30 }, (_, index) => {
        const reverse = 30 - index;
        const wave = Math.sin(reverse / 2.5);
        const drift = Math.cos(reverse / 3.2);
        const seriesSleep = clamp(sleep + wave * 0.45, 5.3, 8.8);
        const hrv = clamp(Math.round(56 + wave * 7 - Math.sin(reverse / 4.2) * 5 + (seriesSleep - 7) * 6), 34, 82);
        const rhr = clamp(Math.round(baseHr + drift * 3 + Math.sin(reverse / 5) * 2 - (seriesSleep - 7) * 1.7), 54, 82);

        return {
            label: dayLabel(index, 30),
            readiness: clamp(Math.round(readiness + wave * 9 - drift * 4), 28, 96),
            sleep: seriesSleep,
            sleepScore: clamp(Math.round(seriesSleep * 12 + hrv * 0.42), 46, 97),
            rhr,
            hrv,
            hydration: clamp(2.2 + drift * 0.3 + deep * 0.08 - meetings * 0.03, 1.6, 3.8),
            deep: clamp(deep + drift * 0.6, 1, 5.5),
            meetings: clamp(meetings + wave * 0.3, 0.5, 4.8),
            stress: clamp(2.4 + meetings * 0.32 - (seriesSleep - 7) * 0.4 + Math.max(rhr - 68, 0) * 0.05, 1.2, 4.8),
            load: clamp(load / 7 + Math.sin(reverse / 4) * 15, 24, 88),
        };
    });
}

function buildTimeline(timeBlocks: TimeBlock[], exercises: Exercise[], sleepHours: number, baseHr: number): TimelineBlock[] {
    const mapped = [...timeBlocks]
        .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
        .map((block) => makeBlock(classifyKind(block.title, block.description), block.title, localHour(block.startAt), localHour(block.endAt), baseHr));

    const workout = exercises.find((item) => sameDay(item.performedAt, new Date()));
    if (workout) {
        mapped.push(makeBlock('workout', workout.name, localHour(workout.performedAt), localHour(workout.performedAt) + workout.duration / 60, baseHr));
    }

    mapped.push(makeBlock('sleep', 'Sleep', Math.max(0, 6.4 - sleepHours), 6.4, baseHr));

    if (mapped.length === 1) {
        mapped.push(
            makeBlock('deep-work', 'Deep Work', 9, 11.5, baseHr),
            makeBlock('meeting', 'Meetings', 13, 15, baseHr),
            makeBlock('move', 'Reset Walk', 16.25, 16.75, baseHr),
            makeBlock('recovery', 'Wind Down', 21, 22, baseHr)
        );
    }

    return mapped.sort((a, b) => a.start - b.start).slice(0, 7);
}

function buildSessions(exercises: Exercise[], routes: GpsRoute[]): SessionSnapshot[] {
    const fromExercises = exercises.slice(0, 4).map((item) => {
        const effort = effortScore(item);
        const load: SessionSnapshot['load'] = effort >= 75 ? 'Heavy' : effort >= 48 ? 'Light' : 'Recovery';
        return {
            id: item.id,
            sport: item.name || capitalize(item.category),
            duration: item.duration,
            effort,
            when: new Date(item.performedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            load,
            tag: load === 'Heavy' ? 'Tập nặng' : load === 'Light' ? 'Tập nhẹ' : 'Phục hồi',
        };
    });

    if (fromExercises.length >= 4) return fromExercises;

    const fromRoutes = routes.slice(0, 4 - fromExercises.length).map((route, index) => {
        const duration = Math.round((route.duration ?? 1800) / 60);
        const effort = clamp(Math.round(duration * 1.2 + route.totalDistance * 9), 34, 88);
        const load: SessionSnapshot['load'] = effort >= 75 ? 'Heavy' : effort >= 48 ? 'Light' : 'Recovery';
        return {
            id: `route-${route.id}`,
            sport: route.name || `${getTrackingModeLabel((route.category as TrackingMode) || 'walking')} route`,
            duration,
            effort,
            when: route.performedAt
                ? new Date(route.performedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                : `Route ${index + 1}`,
            load,
            tag: load === 'Heavy' ? 'Tập nặng' : load === 'Light' ? 'Tập nhẹ' : 'Phục hồi',
        };
    });

    return [...fromExercises, ...fromRoutes];
}

function makeBlock(kind: TimelineKind, label: string, start: number, end: number, baseHr: number): TimelineBlock {
    const profile = {
        sleep: { movement: 'Sedentary', hr: -12, energy: 82, stress: 1.1, insight: 'The main recovery window feeding tomorrow’s readiness.' },
        'deep-work': { movement: 'Sedentary', hr: 4, energy: 78, stress: 2.4, insight: 'A strong focus slot when it follows light movement and low meeting debt.' },
        meeting: { movement: 'Light', hr: 10, energy: 56, stress: 4.2, insight: 'This slot often spikes stress. Add a short walk before the next cognitively heavy block.' },
        move: { movement: 'Moderate', hr: 14, energy: 72, stress: 2.0, insight: 'Light movement here helps clear residual stress and lifts the next focus block.' },
        workout: { movement: 'Vigorous', hr: 24, energy: 68, stress: 2.8, insight: 'Workout quality is best here if it does not sit right after a dense meeting cluster.' },
        recovery: { movement: 'Light', hr: -3, energy: 66, stress: 1.8, insight: 'A deliberate reset window that lowers mental load before the day ends.' },
    } as const;

    const item = profile[kind];
    return {
        id: `${kind}-${label}-${start}`,
        label: label || kind,
        kind,
        start,
        end: Math.max(end, start + 0.5),
        hr: Math.round(baseHr + item.hr),
        energy: item.energy,
        stress: item.stress,
        movement: item.movement,
        insight: item.insight,
    };
}

function effortScore(exercise: Exercise) {
    const intensity = (exercise.intensity || '').toLowerCase();
    const factor =
        intensity.includes('high') || intensity.includes('vigorous') || intensity.includes('hard')
            ? 1.45
            : intensity.includes('medium') || intensity.includes('moderate')
              ? 1.15
              : intensity.includes('light') || intensity.includes('recovery') || intensity.includes('low')
                ? 0.82
                : 1;
    const heartComponent = exercise.avgHeartRate ? exercise.avgHeartRate * 0.33 : 21;
    return clamp(Math.round(exercise.duration * factor + heartComponent), 24, 96);
}

function classifyKind(title: string, description?: string): TimelineKind {
    const source = `${title} ${description ?? ''}`.toLowerCase();
    if (source.includes('meeting') || source.includes('call') || source.includes('sync') || source.includes('review')) return 'meeting';
    if (source.includes('break') || source.includes('rest') || source.includes('lunch')) return 'recovery';
    if (source.includes('run') || source.includes('gym') || source.includes('workout') || source.includes('cardio')) return 'workout';
    if (source.includes('walk') || source.includes('move') || source.includes('commute') || source.includes('travel')) return 'move';
    if (source.includes('sleep')) return 'sleep';
    return 'deep-work';
}

function getReadinessClass(score: number) {
    if (score >= 76) return 'bg-success-var';
    if (score >= 56) return 'bg-warning-var';
    return 'bg-danger-var';
}

function getTimelineTone(kind: TimelineKind) {
    const tones: Record<TimelineKind, string> = {
        sleep: 'from-slate-500/20 to-slate-700/20 border-white/10',
        'deep-work': 'from-cyan-500/20 to-blue-500/18 border-cyan-400/20',
        meeting: 'from-amber-500/18 to-rose-500/18 border-amber-400/20',
        move: 'from-emerald-500/18 to-cyan-500/16 border-emerald-400/20',
        workout: 'from-orange-500/24 to-red-500/20 border-orange-300/20',
        recovery: 'from-violet-500/16 to-slate-500/12 border-violet-300/18',
    };
    return tones[kind];
}

function getLoadPillClass(mode: 'Heavy' | 'Light' | 'Recovery') {
    if (mode === 'Heavy') return 'track-load-pill-danger';
    if (mode === 'Light') return 'track-load-pill-primary';
    return 'track-load-pill-success';
}

function totalHours(blocks: TimelineBlock[], kind: TimelineKind) {
    return blocks.filter((item) => item.kind === kind).reduce((sum, item) => sum + (item.end - item.start), 0);
}

function dayLabel(index: number, total: number) {
    const date = new Date();
    date.setDate(date.getDate() - (total - index - 1));
    return date.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 3).toUpperCase();
}

function delta(series: LabPoint[], key: keyof LabPoint) {
    if (series.length < 2) return 0;
    return Number(series[series.length - 1][key]) - Number(series[series.length - 2][key]);
}

function formatDelta(value: number, suffix = '') {
    const rounded = Math.round(value * 10) / 10;
    return `${rounded >= 0 ? '+' : ''}${rounded}${suffix}`;
}

function localHour(iso: string) {
    const date = new Date(iso);
    return date.getHours() + date.getMinutes() / 60;
}

function sameDay(iso: string, date: Date) {
    const value = new Date(iso);
    return value.getFullYear() === date.getFullYear() && value.getMonth() === date.getMonth() && value.getDate() === date.getDate();
}

function formatHour(hour: number) {
    const safe = clamp(hour, 0, 24);
    const whole = Math.floor(safe);
    const minutes = Math.round((safe % 1) * 60);
    return `${whole.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

function capitalize(value: string) {
    if (!value) return '';
    return value.charAt(0).toUpperCase() + value.slice(1);
}

function clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value));
}
