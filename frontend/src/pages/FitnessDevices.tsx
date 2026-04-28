import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, ArrowLeft, ArrowRight, RefreshCw, Smartphone, Watch } from 'lucide-react';
import { Button, showToast } from '../components/ui';
import { fitnessService } from '../services/fitness.service';
import { healthDevicesService } from '../services/health-devices.service';
import type { DailyActivity, FitnessProfile, HealthDeviceConnection, HealthProvider } from '../types';

const providers: HealthProvider[] = ['apple_health', 'google_fit'];

export function FitnessDevices() {
    const [profile, setProfile] = useState<FitnessProfile | null>(null);
    const [todayActivity, setTodayActivity] = useState<DailyActivity | null>(null);
    const [connections, setConnections] = useState<HealthDeviceConnection[]>([]);
    const [loading, setLoading] = useState(true);
    const [connectingProvider, setConnectingProvider] = useState<HealthProvider | null>(null);
    const [syncingProvider, setSyncingProvider] = useState<HealthProvider | null>(null);

    useEffect(() => {
        void loadData();
    }, []);

    async function loadData() {
        try {
            const [profileData, activityData] = await Promise.all([
                fitnessService.getProfile(),
                fitnessService.getDailyActivity(),
            ]);
            setProfile(profileData);
            setTodayActivity(activityData);
            setConnections(healthDevicesService.getConnections());
        } catch (error) {
            console.error('Failed to load device connection state:', error);
            showToast.error('Could not load device connections', 'The page opened, but sync state could not be refreshed.');
        } finally {
            setLoading(false);
        }
    }

    async function handleConnect(provider: HealthProvider) {
        if (connectingProvider) {
            return;
        }

        setConnectingProvider(provider);
        try {
            const updatedProfile = await fitnessService.connectHealthDevice(provider);
            setProfile(updatedProfile);
            const connection = healthDevicesService.connect(provider);
            setConnections(healthDevicesService.getConnections());
            showToast.success(
                `${connection.label} connected`,
                connection.connectionMode === 'native'
                    ? 'This device can use a native sync path for supported metrics.'
                    : 'This environment uses a preview sync flow, but the provider is now linked in the app.'
            );
        } catch (error) {
            console.error('Failed to connect provider:', error);
            showToast.error('Connection failed', 'The provider could not be linked right now.');
        } finally {
            setConnectingProvider(null);
        }
    }

    async function handleSync(provider: HealthProvider) {
        if (syncingProvider) {
            return;
        }

        setSyncingProvider(provider);
        try {
            const payload = healthDevicesService.buildDailySyncPayload(provider, todayActivity);
            const synced = await fitnessService.syncActivity(payload);
            healthDevicesService.markSynced(provider);
            setConnections(healthDevicesService.getConnections());
            setTodayActivity(synced);
            showToast.success(
                'Device sync completed',
                `${provider === 'apple_health' ? 'Apple Health' : 'Google Fit'} refreshed today's steps, distance, calories and recovery data.`
            );
        } catch (error) {
            console.error('Failed to sync provider:', error);
            showToast.error('Sync failed', 'The provider is connected, but today activity totals were not updated.');
        } finally {
            setSyncingProvider(null);
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

    const currentPlatform = healthDevicesService.getPlatform();
    const connectedCount = connections.length;

    return (
        <div className="page-shell pb-24">
            <div className="mx-auto max-w-6xl space-y-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                        <div className="mb-3 flex items-center gap-2 text-[var(--primary)]">
                            <Watch className="h-4 w-4" />
                            <span className="text-xs font-semibold uppercase tracking-[0.2em]">Device Connections</span>
                        </div>
                        <h1 className="text-3xl font-bold text-[var(--text)]">Health device sync</h1>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-2)]">
                            Link Apple Health or Google Fit, then sync today activity into Fitness without leaving the app.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button asChild variant="outline">
                            <Link to="/app/fitness">
                                <ArrowLeft className="h-4 w-4" />
                                Back to Fitness
                            </Link>
                        </Button>
                        <Button asChild variant="secondary">
                            <Link to="/app/fitness/history">
                                Workout history
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </Button>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <InfoCard title="Platform" value={currentPlatform.toUpperCase()} note="Detected runtime for native vs preview sync." />
                    <InfoCard title="Linked providers" value={String(connectedCount)} note="Each provider keeps its own local sync state in this app." />
                    <InfoCard
                        title="Profile sync"
                        value={profile?.healthConnect ? 'Enabled' : 'Pending'}
                        note={profile?.healthConnect ? 'Backend profile is marked as health connected.' : 'Connect one provider to enable health sync.'}
                    />
                </div>

                <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
                    <div className="space-y-4">
                        {providers.map((provider) => {
                            const existing = connections.find((connection) => connection.provider === provider);
                            const meta = existing ?? healthDevicesService.buildConnection(provider);
                            const isConnected = Boolean(existing);

                            return (
                                <div key={provider} className="fitness-card p-5">
                                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                        <div>
                                            <div className="mb-2 flex items-center gap-2">
                                                <span className="rounded-full bg-[var(--surface-highlight)] p-2 text-[var(--primary)]">
                                                    <Smartphone className="h-4 w-4" />
                                                </span>
                                                <div>
                                                    <h3 className="font-semibold text-[var(--text)]">{meta.label}</h3>
                                                    <p className="text-sm text-[var(--text-2)]">{meta.note}</p>
                                                </div>
                                            </div>
                                            <div className="mt-4 flex flex-wrap gap-2 text-xs text-[var(--text-2)]">
                                                {meta.metrics.map((metric) => (
                                                    <span key={metric} className="rounded-full border border-[var(--border)] px-3 py-1">
                                                        {metric}
                                                    </span>
                                                ))}
                                                <span className="rounded-full border border-[var(--surface-highlight-border)] px-3 py-1 text-[var(--primary)]">
                                                    {meta.connectionMode === 'native' ? 'Native ready' : 'Preview mode'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            <Button
                                                variant={isConnected ? 'secondary' : 'default'}
                                                onClick={() => void handleConnect(provider)}
                                                loading={connectingProvider === provider}
                                                disabled={connectingProvider !== null || isConnected}
                                            >
                                                {isConnected ? 'Connected' : 'Connect'}
                                            </Button>
                                            <Button
                                                variant="outline"
                                                onClick={() => void handleSync(provider)}
                                                loading={syncingProvider === provider}
                                                disabled={!isConnected || syncingProvider !== null}
                                            >
                                                <RefreshCw className="h-4 w-4" />
                                                Sync today
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                                        <MiniStatus
                                            label="Connected at"
                                            value={isConnected ? formatMoment(existing?.connectedAt) : 'Not linked'}
                                        />
                                        <MiniStatus
                                            label="Last sync"
                                            value={existing?.lastSyncedAt ? formatMoment(existing.lastSyncedAt) : 'No sync yet'}
                                        />
                                        <MiniStatus
                                            label="Sync count"
                                            value={isConnected ? String(existing?.syncCount ?? 0) : '0'}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="space-y-4">
                        <div className="fitness-card p-5">
                            <div className="mb-3 flex items-center gap-2 text-[var(--primary)]">
                                <Activity className="h-4 w-4" />
                                <span className="text-sm font-medium">Today activity snapshot</span>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <SnapshotMetric label="Steps" value={(todayActivity?.steps ?? 0).toLocaleString()} />
                                <SnapshotMetric label="Distance" value={`${(todayActivity?.distance ?? 0).toFixed(1)} km`} />
                                <SnapshotMetric label="Calories" value={String(todayActivity?.calories ?? 0)} />
                                <SnapshotMetric label="Active" value={`${todayActivity?.activeMinutes ?? 0} min`} />
                            </div>
                            <p className="mt-4 text-xs leading-5 text-[var(--text-2)]">
                                Current source: <span className="font-medium text-[var(--text)]">{todayActivity?.source || 'manual / none'}</span>
                            </p>
                        </div>

                        <div className="fitness-card p-5">
                            <h3 className="font-semibold text-[var(--text)]">How this works</h3>
                            <div className="mt-3 space-y-3 text-sm leading-6 text-[var(--text-2)]">
                                <p>`Connect` marks the provider as linked in your backend profile and in this app.</p>
                                <p>`Sync today` writes a fresh activity snapshot into the existing Fitness daily totals.</p>
                                <p>On web or unsupported platforms, the app uses a preview sync path so you can still test the product flow end to end.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function InfoCard({ title, value, note }: { title: string; value: string; note: string }) {
    return (
        <div className="fitness-card p-4">
            <p className="text-sm text-[var(--text-2)]">{title}</p>
            <p className="mt-2 text-2xl font-bold text-[var(--text)]">{value}</p>
            <p className="mt-2 text-xs leading-5 text-[var(--text-2)]">{note}</p>
        </div>
    );
}

function MiniStatus({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-3)] px-4 py-3">
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-3)]">{label}</p>
            <p className="mt-2 font-medium text-[var(--text)]">{value}</p>
        </div>
    );
}

function SnapshotMetric({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-3)] px-4 py-3">
            <p className="text-xs text-[var(--text-2)]">{label}</p>
            <p className="mt-2 text-lg font-semibold text-[var(--text)]">{value}</p>
        </div>
    );
}

function formatMoment(value?: string) {
    if (!value) {
        return 'Not available';
    }

    return new Date(value).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}
