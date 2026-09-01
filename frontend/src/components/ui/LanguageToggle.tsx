import { motion } from 'framer-motion';
import { availableLanguages, useLanguageStore, type Language } from '../../i18n';
import { cn } from '../../lib/utils';

interface LanguageToggleProps {
    className?: string;
}

/**
 * Segmented control to switch app language with a sliding highlight.
 */
export function LanguageToggle({ className }: LanguageToggleProps) {
    const { language, setLanguage } = useLanguageStore();

    return (
        <div
            className={cn(
                'relative inline-flex items-center gap-1 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-1',
                className
            )}
        >
            {availableLanguages.map((item) => {
                const active = language === item.code;
                return (
                    <button
                        key={item.code}
                        type="button"
                        onClick={() => setLanguage(item.code as Language)}
                        aria-pressed={active}
                        className={cn(
                            'relative z-10 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                            active ? 'text-[var(--primary)]' : 'text-[var(--text-2)] hover:text-[var(--text)]'
                        )}
                    >
                        {active && (
                            <motion.span
                                layoutId="lang-active-pill"
                                className="absolute inset-0 -z-10 rounded-lg border border-[var(--surface-highlight-border)] bg-[var(--surface-highlight)] shadow-[var(--shadow-sm)]"
                                transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                            />
                        )}
                        <span className="text-base leading-none">{item.flag}</span>
                        <span>{item.label}</span>
                    </button>
                );
            })}
        </div>
    );
}
