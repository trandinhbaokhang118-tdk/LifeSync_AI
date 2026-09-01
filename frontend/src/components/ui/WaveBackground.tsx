import { motion } from 'framer-motion';

interface WaveBackgroundProps {
    className?: string;
    /** Tone the layer toward light card areas (subtle) or full hero (vivid). */
    variant?: 'hero' | 'soft';
}

/**
 * Animated 3D wave backdrop in the "taste-skill" aesthetic:
 * - layered parallax SVG waves that flow horizontally
 * - perspective-tilted plane for depth
 * - floating gradient orbs + grain
 * Pure GPU transforms (translateX / rotateX) so it stays smooth (60fps).
 */
export function WaveBackground({ className = '', variant = 'hero' }: WaveBackgroundProps) {
    const opacity = variant === 'hero' ? 1 : 0.5;

    return (
        <div
            className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
            style={{ perspective: '1200px' }}
            aria-hidden="true"
        >
            {/* Floating gradient orbs (slow drift = depth) */}
            <motion.div
                className="absolute -left-24 top-10 h-80 w-80 rounded-full blur-3xl"
                style={{ background: 'radial-gradient(circle, rgba(0,229,255,0.45), transparent 70%)', opacity }}
                animate={{ x: [0, 40, 0], y: [0, 30, 0], scale: [1, 1.12, 1] }}
                transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
                className="absolute -right-20 bottom-16 h-96 w-96 rounded-full blur-3xl"
                style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.4), transparent 70%)', opacity }}
                animate={{ x: [0, -50, 0], y: [0, -24, 0], scale: [1, 1.18, 1] }}
                transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* 3D tilted wave plane */}
            <div
                className="absolute inset-x-0 bottom-0 h-[70%]"
                style={{ transform: 'rotateX(55deg) translateZ(-60px)', transformOrigin: 'bottom' }}
            >
                <WaveLayer color="rgba(0,229,255,0.30)" duration={9} amp={26} y={40} />
                <WaveLayer color="rgba(10,132,255,0.34)" duration={12} amp={34} y={55} reverse />
                <WaveLayer color="rgba(139,92,246,0.30)" duration={16} amp={42} y={70} />
            </div>

            {/* Front waves (flat, framing the bottom) */}
            <WaveLayer
                className="absolute inset-x-0 bottom-0"
                color="rgba(0,229,255,0.18)"
                duration={11}
                amp={20}
                y={0}
                reverse
            />
        </div>
    );
}

interface WaveLayerProps {
    color: string;
    duration: number;
    amp: number;
    y: number;
    reverse?: boolean;
    className?: string;
}

function WaveLayer({ color, duration, amp, y, reverse = false, className = '' }: WaveLayerProps) {
    // Two identical wave tiles side by side, scrolled to create a seamless loop.
    const path = `M0 ${60 + y} C 180 ${60 + y - amp} 360 ${60 + y + amp} 540 ${60 + y} S 900 ${60 + y - amp} 1080 ${60 + y} S 1440 ${60 + y + amp} 1620 ${60 + y} L 1620 200 L 0 200 Z`;

    return (
        <motion.svg
            className={`h-40 w-[200%] ${className}`}
            viewBox="0 0 1620 200"
            preserveAspectRatio="none"
            animate={{ x: reverse ? ['-50%', '0%'] : ['0%', '-50%'] }}
            transition={{ duration, repeat: Infinity, ease: 'linear' }}
        >
            <path d={path} fill={color} />
        </motion.svg>
    );
}
