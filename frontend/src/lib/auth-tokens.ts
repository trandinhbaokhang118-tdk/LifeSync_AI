type TokenStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

function getStorage(rememberMe = false): TokenStorage {
    return rememberMe ? localStorage : sessionStorage;
}

export function getAccessToken() {
    return localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
}

export function getRefreshToken() {
    return localStorage.getItem('refreshToken') || sessionStorage.getItem('refreshToken');
}

export function hasAuthTokens() {
    return Boolean(getAccessToken() || getRefreshToken());
}

export function saveAuthTokens(accessToken: string, refreshToken: string, rememberMe: boolean) {
    clearAuthTokens();
    const storage = getStorage(rememberMe);
    storage.setItem('accessToken', accessToken);
    storage.setItem('refreshToken', refreshToken);
}

export function replaceAuthTokens(accessToken: string, refreshToken: string) {
    const rememberMe = Boolean(localStorage.getItem('refreshToken'));
    saveAuthTokens(accessToken, refreshToken, rememberMe);
}

export function clearAuthTokens() {
    for (const storage of [localStorage, sessionStorage]) {
        storage.removeItem('accessToken');
        storage.removeItem('refreshToken');
    }
}
