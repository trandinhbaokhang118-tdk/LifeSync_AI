import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { Clock, Calendar, Timer, TrendingUp, Zap, Target, Activity, Award } from 'lucide-react';

interface Animated3DSceneProps {
    className?: string;
}

/**
 * Animated 3D scene - time management + sport theme
 * Floating 3D icons with depth, rotation, parallax
 */
export function Animated3DScene({ className = '' }: Animated3DSceneProps) {
    // Precompute particle positions/timings once using a deterministic pseudo-random
    // generator. Avoids Math.random() during render (react-hooks/purity) and keeps
    // particle layout stable across re-renders.
    const particles = useMemo(() => {
        const seeded = (seed: number) => {
            const value = Math.sin(seed) * 10000;
            return value - Math.floor(value);
        };
        return Array.from({ length: 50 }).map((_, index) => ({
            left: `${seeded(index * 1.1) * 100}%`,
            top: `${seeded(index * 2.3 + 1) * 100}%`,
            duration: 3 + seeded(index * 3.7 + 2) * 4,
            delay: seeded(index * 4.9 + 3) * 3,
        }));
    }, []);

    const icons = [
        { Icon: Clock, x: '15%', y: '20%', delay: 0, duration: 12, color: '#00E5FF', size: 80 },
        { Icon: Calendar, x: '75%', y: '15%', delay: 1.5, duration: 15, color: '#3B82F6', size: 70 },
        { Icon: Timer, x: '85%', y: '60%', delay: 0.8, duration: 13, color: '#8B5CF6', size: 75 },
        { Icon: TrendingUp, x: '10%', y: '70%', delay: 2, duration: 14, color: '#22C55E', size: 65 },
        { Icon: Zap, x: '50%', y: '10%', delay: 1, duration: 11, color: '#FBBF24', size: 60 },
        { Icon: Target, x: '65%', y: '75%', delay: 1.8, duration: 16, color: '#EF4444', size: 70 },
        { Icon: Activity, x: '30%', y: '55%', delay: 0.5, duration: 13, color: '#06B6D4', size: 65 },
        { Icon: Award, x: '45%', y: '85%', delay: 2.5, duration: 14, color: '#F59E0B', size: 55 },
    ];

    return (
        <div
            className={`absolute inset-0 overflow-hidden ${className}`}
            style={{ perspective: '1500px' }}
            aria-hidden="true"
        >
            {/* Rotating rings (abstract clock/orbit) */}
            <motion.div
                className="absolute inset-0 flex items-center justify-center"
                style={{ transformStyle: 'preserve-3d' }}
                animate={{ rotateY: 360 }}
                transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
            >
                <div
                    className="absolute w-[800px] h-[800px] rounded-full border-2 border-cyan-500/20"
                    style={{ transform: 'rotateX(75deg)' }}
                />
                <div
                    className="absolute w-[600px] h-[600px] rounded-full border-2 border-blue-500/20"
                    style={{ transform: 'rotateX(75deg) rotateZ(45deg)' }}
                />
                <div
                    className="absolute w-[400px] h-[400px] rounded-full border-2 border-purple-500/20"
                    style={{ transform: 'rotateX(75deg) rotateZ(90deg)' }}
                />
            </motion.div>

            {/* Floating grid plane (3D perspective) */}
            <motion.div
                className="absolute inset-x-0 top-1/2 h-[600px] opacity-10"
                style={{
                    backgroundImage: `
                        linear-gradient(to right, rgba(59, 130, 246, 0.3) 1px, transparent 1px),
                        linear-gradient(to bottom, rgba(59, 130, 246, 0.3) 1px, transparent 1px)
                    `,
                    backgroundSize: '60px 60px',
                    transform: 'rotateX(60deg) translateZ(-200px)',
                    transformOrigin: 'center top',
                }}
                animate={{
                    backgroundPosition: ['0px 0px', '60px 60px'],
                }}
                transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: 'linear',
                }}
            />

            {/* Floating 3D icons */}
            {icons.map(({ Icon, x, y, delay, duration, color, size }, i) => (
                <motion.div
                    key={i}
                    className="absolute"
                    style={{
                        left: x,
                        top: y,
                        width: size,
                        height: size,
                        transformStyle: 'preserve-3d',
                    }}
                    animate={{
                        y: [0, -30, 0],
                        rotateY: [0, 360],
                        rotateX: [0, 15, 0],
                        scale: [1, 1.1, 1],
                    }}
                    transition={{
                        duration,
                        repeat: Infinity,
                        delay,
                        ease: 'easeInOut',
                    }}
                >
                    <motion.div
                        className="relative w-full h-full rounded-2xl backdrop-blur-sm flex items-center justify-center shadow-2xl"
                        style={{
                            background: `linear-gradient(135deg, ${color}22, ${color}11)`,
                            border: `2px solid ${color}44`,
                            boxShadow: `0 0 40px ${color}33, inset 0 0 20px ${color}11`,
                        }}
                        whileHover={{ scale: 1.2, rotateZ: 10 }}
                    >
                        <Icon
                            className="w-3/5 h-3/5"
                            style={{
                                color,
                                filter: `drop-shadow(0 0 10px ${color})`,
                            }}
                        />
                        {/* 3D depth layers */}
                        <div
                            className="absolute inset-0 rounded-2xl opacity-50"
                            style={{
                                background: `linear-gradient(135deg, transparent, ${color}22)`,
                                transform: 'translateZ(-10px)',
                            }}
                        />
                        <div
                            className="absolute inset-0 rounded-2xl opacity-30"
                            style={{
                                background: `linear-gradient(135deg, transparent, ${color}11)`,
                                transform: 'translateZ(-20px)',
                            }}
                        />
                    </motion.div>
                </motion.div>
            ))}

            {/* Particle field (stars/dots) */}
            <div className="absolute inset-0">
                {particles.map((particle, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-1 h-1 bg-white/40 rounded-full"
                        style={{
                            left: particle.left,
                            top: particle.top,
                        }}
                        animate={{
                            opacity: [0.2, 0.8, 0.2],
                            scale: [1, 1.5, 1],
                        }}
                        transition={{
                            duration: particle.duration,
                            repeat: Infinity,
                            delay: particle.delay,
                        }}
                    />
                ))}
            </div>

            {/* Radial gradient overlay (vignette) */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background: 'radial-gradient(circle at center, transparent 20%, rgba(0,0,0,0.4) 100%)',
                }}
            />
        </div>
    );
}
