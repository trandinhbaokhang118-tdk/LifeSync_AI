import { Capacitor } from '@capacitor/core';

function firstDefined(...values: Array<string | undefined>) {
    return values.find((value) => typeof value === 'string' && value.trim().length > 0)?.trim();
}

function normalizeUrl(url: string) {
    return url.replace(/\/+$/, '');
}

function resolveNativeApiUrl() {
    const platform = Capacitor.getPlatform();
    const platformOverride =
        platform === 'android'
            ? import.meta.env.VITE_ANDROID_API_URL
            : platform === 'ios'
              ? import.meta.env.VITE_IOS_API_URL
              : undefined;

    const configuredUrl = firstDefined(
        platformOverride,
        import.meta.env.VITE_NATIVE_API_URL,
        import.meta.env.VITE_API_URL,
    );

    if (configuredUrl) {
        return configuredUrl;
    }

    if (platform === 'android') {
        return 'http://10.0.2.2:3000';
    }

    return 'http://localhost:3000';
}

function resolveWebApiUrl() {
    return firstDefined(import.meta.env.VITE_WEB_API_URL, import.meta.env.VITE_API_URL) ?? 'http://localhost:3000';
}

export const API_URL = normalizeUrl(
    Capacitor.isNativePlatform() ? resolveNativeApiUrl() : resolveWebApiUrl(),
);

export const AI_CHAT_API_URL = `${API_URL}/ai-chat`;
