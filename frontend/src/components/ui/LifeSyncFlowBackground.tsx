import { motion } from 'framer-motion';

interface LifeSyncFlowBackgroundProps {
    className?: string;
    variant?: 'hero' | 'soft';
}

const flowPoints = [
    { left: '12%', top: '22%', delay: 0, duration: 13 },
    { left: '34%', top: '68%', delay: 2.5, duration: 17 },
    { left: '63%', top: '29%', delay: 1.2, duration: 15 },
    { left: '84%', top: '74%', delay: 4, duration: 19 },
];

/**
 * Ambient background inspired by a planned day: calendar grid, connected
 * milestones and slow-moving focus points. It stays deliberately quiet so
 * application content remains the visual priority.
 */
export function LifeSyncFlowBackground({
    className = '',
    variant = 'soft',
}: LifeSyncFlowBackgroundProps) {
    const intensity = variant === 'hero' ? 1 : 0.58;

    return (
        <div
            className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
            style={{ opacity: intensity }}
            aria-hidden="true"
        >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_16%,rgba(10,132,255,0.12),transparent_30%),radial-gradient(circle_at_82%_30%,rgba(124,58,237,0.08),transparent_28%),radial-gradient(circle_at_54%_88%,rgba(249,115,22,0.06),transparent_24%)]" />

            <motion.div
                className="absolute -inset-[80px] opacity-[0.22] dark:opacity-[0.12]"
                style={{
                    backgroundImage:
                        'linear-gradient(rgba(71,85,105,.16) 1px, transparent 1px), linear-gradient(90deg, rgba(71,85,105,.16) 1px, transparent 1px)',
                    backgroundSize: '72px 72px',
                    maskImage: 'linear-gradient(to bottom, transparent, black 18%, black 78%, transparent)',
                }}
                animate={{ x: [0, 72], y: [0, 72] }}
                transition={{ duration: 32, repeat: Infinity, ease: 'linear' }}
            />

            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1440 900" preserveAspectRatio="none">
                <defs>
                    <linearGradient id="lifesync-flow-line" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0" stopColor="#0A84FF" stopOpacity="0" />
                        <stop offset="0.38" stopColor="#0A84FF" stopOpacity="0.2" />
                        <stop offset="0.72" stopColor="#7C3AED" stopOpacity="0.14" />
                        <stop offset="1" stopColor="#F97316" stopOpacity="0" />
                    </linearGradient>
                </defs>
                <motion.path
                    d="M-80 650 C 180 650, 210 250, 470 310 S 760 690, 980 470 S 1210 160, 1520 270"
                    fill="none"
                    stroke="url(#lifesync-flow-line)"
                    strokeWidth="2"
                    strokeDasharray="8 14"
                    animate={{ strokeDashoffset: [0, -44] }}
                    transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                />
                <path
                    d="M-80 690 C 210 690, 250 330, 490 370 S 770 740, 1010 515 S 1240 230, 1520 330"
                    fill="none"
                    stroke="url(#lifesync-flow-line)"
                    strokeOpacity="0.45"
                    strokeWidth="1"
                />
            </svg>

            {flowPoints.map((point) => (
                <motion.div
                    key={`${point.left}-${point.top}`}
                    className="absolute h-2 w-2 rounded-full bg-blue-500/50 shadow-[0_0_18px_rgba(10,132,255,.38)] dark:bg-cyan-300/40"
                    style={{ left: point.left, top: point.top }}
                    animate={{ y: [0, -12, 0], opacity: [0.25, 0.75, 0.25], scale: [0.8, 1.25, 0.8] }}
                    transition={{ duration: point.duration, delay: point.delay, repeat: Infinity, ease: 'easeInOut' }}
                />
            ))}

            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--bg)]/10 to-[var(--bg)]/55" />
        </div>
    );
}
