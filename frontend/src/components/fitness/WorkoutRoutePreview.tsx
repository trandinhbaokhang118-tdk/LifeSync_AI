import { MapPinned } from 'lucide-react';
import { cn } from '../../lib/utils';

interface WorkoutRoutePreviewProps {
    path?: Array<{ lat: number; lng: number }>;
    title?: string;
    caption?: string;
    compact?: boolean;
}

export function WorkoutRoutePreview({
    path = [],
    title = 'Route preview',
    caption = 'Workout route points appear here when a GPS path is available.',
    compact = false,
}: WorkoutRoutePreviewProps) {
    if (!path.length) {
        return (
            <div
                className={cn(
                    'rounded-3xl border border-dashed border-[var(--border)] bg-[var(--surface-3)] px-6 py-8 text-center',
                    compact && 'rounded-2xl px-4 py-5'
                )}
            >
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--surface-highlight)] text-[var(--primary)]">
                    <MapPinned className="h-5 w-5" />
                </div>
                <p className="font-medium text-[var(--text)]">{title}</p>
                <p className="mt-1 text-sm leading-6 text-[var(--text-2)]">{caption}</p>
            </div>
        );
    }

    const projected = projectTrackPoints(path);
    const polyline = projected.map((point) => `${point.x},${point.y}`).join(' ');

    return (
        <div className={cn('overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface-3)]', compact && 'rounded-2xl')}>
            <div className="flex items-center justify-between border-b border-[var(--divider)] px-4 py-3">
                <div>
                    <p className="font-medium text-[var(--text)]">{title}</p>
                    <p className="text-xs text-[var(--text-2)]">{caption}</p>
                </div>
                <span className="rounded-full border border-[var(--surface-highlight-border)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--primary)]">
                    GPS
                </span>
            </div>
            <div className="p-4">
                <svg viewBox="0 0 320 220" className="h-[240px] w-full overflow-hidden rounded-2xl bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_52%),linear-gradient(180deg,_rgba(12,16,28,0.95),_rgba(8,10,18,0.98))]" role="img" aria-label={title}>
                    <defs>
                        <linearGradient id="workout-route-fill" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="rgba(34,211,238,0.2)" />
                            <stop offset="100%" stopColor="rgba(59,130,246,0.04)" />
                        </linearGradient>
                        <linearGradient id="workout-route-line" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#22d3ee" />
                            <stop offset="100%" stopColor="#60a5fa" />
                        </linearGradient>
                    </defs>
                    <rect x="0" y="0" width="320" height="220" fill="transparent" />
                    <path
                        d="M0 170 C48 134 92 190 138 148 C174 116 214 154 260 112 C285 90 302 94 320 78 L320 220 L0 220 Z"
                        fill="url(#workout-route-fill)"
                        opacity="0.7"
                    />
                    <polyline
                        points={polyline}
                        fill="none"
                        stroke="url(#workout-route-line)"
                        strokeWidth="6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    <polyline
                        points={polyline}
                        fill="none"
                        stroke="rgba(255,255,255,0.18)"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    {projected[0] && <circle cx={projected[0].x} cy={projected[0].y} r="6" fill="#22c55e" />}
                    {projected[projected.length - 1] && (
                        <circle cx={projected[projected.length - 1].x} cy={projected[projected.length - 1].y} r="6" fill="#f97316" />
                    )}
                </svg>
            </div>
        </div>
    );
}

function projectTrackPoints(points: Array<{ lat: number; lng: number }>) {
    const width = 320;
    const height = 220;
    const padding = 24;
    const latitudes = points.map((point) => point.lat);
    const longitudes = points.map((point) => point.lng);
    const minLat = Math.min(...latitudes);
    const maxLat = Math.max(...latitudes);
    const minLng = Math.min(...longitudes);
    const maxLng = Math.max(...longitudes);
    const latSpan = maxLat - minLat || 0.001;
    const lngSpan = maxLng - minLng || 0.001;

    return points.map((point) => ({
        x: padding + ((point.lng - minLng) / lngSpan) * (width - padding * 2),
        y: height - padding - ((point.lat - minLat) / latSpan) * (height - padding * 2),
    }));
}
