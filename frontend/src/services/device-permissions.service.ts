import { Capacitor } from '@capacitor/core';

export type DevicePermission = 'notifications' | 'camera' | 'location' | 'storage';
export type DevicePermissionState = 'granted' | 'denied' | 'prompt' | 'unsupported' | 'contextual';

function normalizePermissionState(state: string): DevicePermissionState {
    if (state === 'granted' || state === 'denied' || state === 'prompt') {
        return state;
    }

    // The browser uses "default" and Capacitor Android can return
    // "prompt-with-rationale". Both mean the user can still be prompted.
    if (state === 'default' || state === 'prompt-with-rationale') {
        return 'prompt';
    }

    return 'unsupported';
}

async function queryWebPermission(name: PermissionName): Promise<DevicePermissionState> {
    if (!navigator.permissions) {
        return 'prompt';
    }

    try {
        return normalizePermissionState((await navigator.permissions.query({ name })).state);
    } catch {
        return 'prompt';
    }
}

export async function getDevicePermissionState(permission: DevicePermission): Promise<DevicePermissionState> {
    if (permission === 'storage') {
        // Browsers grant access only to files explicitly selected by the user.
        return 'contextual';
    }

    if (permission === 'notifications') {
        if (Capacitor.isNativePlatform()) {
            const { PushNotifications } = await import('@capacitor/push-notifications');
            const status = await PushNotifications.checkPermissions();
            return normalizePermissionState(status.receive);
        }

        return 'Notification' in window ? normalizePermissionState(Notification.permission) : 'unsupported';
    }

    if (permission === 'location') {
        if (!('geolocation' in navigator)) {
            return 'unsupported';
        }
        return queryWebPermission('geolocation');
    }

    if (!navigator.mediaDevices?.getUserMedia) {
        return 'unsupported';
    }

    return queryWebPermission('camera' as PermissionName);
}

export async function requestDevicePermission(permission: DevicePermission): Promise<DevicePermissionState> {
    if (permission === 'storage') {
        return 'contextual';
    }

    if (permission === 'notifications') {
        if (Capacitor.isNativePlatform()) {
            const { PushNotifications } = await import('@capacitor/push-notifications');
            const status = await PushNotifications.requestPermissions();
            if (status.receive === 'granted') {
                await PushNotifications.register();
            }
            return normalizePermissionState(status.receive);
        }

        return 'Notification' in window
            ? Notification.requestPermission().then(normalizePermissionState)
            : 'unsupported';
    }

    if (permission === 'location') {
        if (!('geolocation' in navigator)) {
            return 'unsupported';
        }

        return new Promise((resolve) => {
            navigator.geolocation.getCurrentPosition(
                () => resolve('granted'),
                () => void getDevicePermissionState('location').then(resolve),
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
            );
        });
    }

    if (!navigator.mediaDevices?.getUserMedia) {
        return 'unsupported';
    }

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach((track) => track.stop());
        return 'granted';
    } catch {
        return getDevicePermissionState('camera');
    }
}

export async function showDeviceNotification(title: string, body?: string): Promise<boolean> {
    if (await getDevicePermissionState('notifications') !== 'granted') {
        return false;
    }

    if (Capacitor.isNativePlatform()) {
        const { LocalNotifications } = await import('@capacitor/local-notifications');
        await LocalNotifications.schedule({
            notifications: [{
                id: Date.now() % 2_147_483_647,
                title,
                body: body ?? '',
                schedule: { at: new Date(Date.now() + 100) },
            }],
        });
        return true;
    }

    const options: NotificationOptions = {
        body,
        icon: '/lifesync.svg',
        badge: '/lifesync.svg',
        tag: `lifesync-${title}`,
        silent: false,
    };

    if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification(title, options);
    } else {
        new Notification(title, options);
    }

    return true;
}
