import { Capacitor } from '@capacitor/core';
import type { DailyActivity, HealthDeviceConnection, HealthPlatform, HealthProvider } from '../types';

const STORAGE_KEY = 'fitness-device-connections';

const providerLabels: Record<HealthProvider, string> = {
    apple_health: 'Apple Health',
    google_fit: 'Google Fit',
};

const providerMetrics: Record<HealthProvider, string[]> = {
    apple_health: ['steps', 'distance', 'sleep', 'heart rate'],
    google_fit: ['steps', 'distance', 'active minutes', 'calories'],
};

export const healthDevicesService = {
    getPlatform(): HealthPlatform {
        const platform = Capacitor.getPlatform();
        if (platform === 'ios' || platform === 'android') {
            return platform;
        }

        return 'web';
    },

    getConnections(): HealthDeviceConnection[] {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            return [];
        }

        try {
            const parsed = JSON.parse(raw) as HealthDeviceConnection[];
            return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            console.error('Failed to parse stored health device connections:', error);
            return [];
        }
    },

    getConnection(provider: HealthProvider) {
        return this.getConnections().find((connection) => connection.provider === provider) ?? null;
    },

    connect(provider: HealthProvider) {
        const connections = this.getConnections().filter((connection) => connection.provider !== provider);
        const connection = this.buildConnection(provider);
        connections.push(connection);
        this.saveConnections(connections);
        return connection;
    },

    markSynced(provider: HealthProvider) {
        const connections = this.getConnections().map((connection) =>
            connection.provider === provider
                ? {
                      ...connection,
                      lastSyncedAt: new Date().toISOString(),
                      syncCount: connection.syncCount + 1,
                  }
                : connection
        );
        this.saveConnections(connections);
        return connections.find((connection) => connection.provider === provider) ?? null;
    },

    buildDailySyncPayload(provider: HealthProvider, currentActivity?: DailyActivity | null) {
        const platform = this.getPlatform();
        const now = new Date();
        const dayProgress = clamp((now.getHours() * 60 + now.getMinutes()) / (16 * 60), 0.18, 1);
        const targets =
            provider === 'apple_health'
                ? { steps: 11200, distance: 8.4, calories: 640, activeMinutes: 92, sleepMinutes: 448, heartRateAvg: 67 }
                : { steps: 9800, distance: 7.1, calories: 560, activeMinutes: 78, sleepMinutes: 430, heartRateAvg: 69 };

        return {
            date: now.toISOString().split('T')[0],
            steps: Math.max(currentActivity?.steps ?? 0, Math.round(targets.steps * dayProgress)),
            distance: roundDecimal(Math.max(currentActivity?.distance ?? 0, targets.distance * dayProgress), 2),
            calories: Math.max(currentActivity?.calories ?? 0, Math.round(targets.calories * dayProgress)),
            activeMinutes: Math.max(currentActivity?.activeMinutes ?? 0, Math.round(targets.activeMinutes * dayProgress)),
            sleepMinutes: currentActivity?.sleepMinutes ?? targets.sleepMinutes,
            heartRateAvg: currentActivity?.heartRateAvg ?? targets.heartRateAvg,
            source: platform === 'web' ? `${provider}:preview` : provider,
        };
    },

    describeConnection(provider: HealthProvider) {
        const platform = this.getPlatform();
        const nativeMatch =
            (provider === 'apple_health' && platform === 'ios') || (provider === 'google_fit' && platform === 'android');
        const connectionMode: 'native' | 'preview' = nativeMatch ? 'native' : 'preview';

        return {
            label: providerLabels[provider],
            platform,
            connectionMode,
            metrics: providerMetrics[provider],
            note:
                connectionMode === 'native'
                    ? `This ${providerLabels[provider]} connection matches the current ${platform.toUpperCase()} device.`
                    : `This environment does not expose ${providerLabels[provider]} directly, so the app uses a preview sync flow.`,
        };
    },

    buildConnection(provider: HealthProvider): HealthDeviceConnection {
        const description = this.describeConnection(provider);
        return {
            provider,
            label: description.label,
            platform: description.platform,
            connectionMode: description.connectionMode,
            connectedAt: new Date().toISOString(),
            syncCount: 0,
            metrics: description.metrics,
            note: description.note,
        };
    },

    saveConnections(connections: HealthDeviceConnection[]) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(connections));
    },
};

function clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value));
}

function roundDecimal(value: number, precision: number) {
    const factor = 10 ** precision;
    return Math.round(value * factor) / factor;
}
