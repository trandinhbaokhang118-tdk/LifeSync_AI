import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import vi from './locales/vi';
import en from './locales/en';

export type Language = 'vi' | 'en';

export const translations = { vi, en } as const;

export const availableLanguages: { code: Language; label: string; flag: string }[] = [
    { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
    { code: 'en', label: 'English', flag: '🇬🇧' },
];

interface LanguageState {
    language: Language;
    setLanguage: (language: Language) => void;
    toggleLanguage: () => void;
}

export const useLanguageStore = create<LanguageState>()(
    persist(
        (set, get) => ({
            language: 'vi',
            setLanguage: (language) => set({ language }),
            toggleLanguage: () => set({ language: get().language === 'vi' ? 'en' : 'vi' }),
        }),
        { name: 'language-storage' }
    )
);

/** Safely read a nested key like "settings.profile.name" from an object. */
function resolveKey(obj: unknown, path: string): string {
    const value = path.split('.').reduce<unknown>((acc, part) => {
        if (acc && typeof acc === 'object' && part in (acc as Record<string, unknown>)) {
            return (acc as Record<string, unknown>)[part];
        }
        return undefined;
    }, obj);

    return typeof value === 'string' ? value : path;
}

/**
 * Translation hook. Returns `t(key)` for dot-notation lookups plus the current
 * language and setters. Falls back to the key itself if a translation is missing.
 */
export function useTranslation() {
    const { language, setLanguage, toggleLanguage } = useLanguageStore();

    const t = (key: string): string => {
        const dict = translations[language] ?? translations.vi;
        return resolveKey(dict, key);
    };

    return { t, language, setLanguage, toggleLanguage };
}
