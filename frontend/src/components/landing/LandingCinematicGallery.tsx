import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Pause, Play } from 'lucide-react';

const scenes = [
    { src: '/landing/generated/01-start.png', label: 'Sẵn sàng', position: '50% 50%' },
    { src: '/landing/generated/02-plan.png', label: 'Lập kế hoạch', position: '50% 48%' },
    { src: '/landing/generated/03-focus.png', label: 'Tập trung', position: '50% 50%' },
    { src: '/landing/generated/04-momentum.png', label: 'Tạo đà', position: '50% 48%' },
    { src: '/landing/generated/05-recover.png', label: 'Phục hồi', position: '50% 50%' },
    { src: '/landing/generated/06-align.png', label: 'Đồng bộ', position: '50% 48%' },
] as const;

const FRAME_DURATION = 5600;

export function LandingCinematicGallery() {
    const reduceMotion = useReducedMotion();
    const [activeScene, setActiveScene] = useState(0);
    const [manuallyPaused, setManuallyPaused] = useState(false);
    const [interactionPaused, setInteractionPaused] = useState(false);
    const playing = !manuallyPaused && !interactionPaused;

    useEffect(() => {
        if (!playing || reduceMotion) return;

        const timer = window.setInterval(() => {
            setActiveScene((current) => (current + 1) % scenes.length);
        }, FRAME_DURATION);

        return () => window.clearInterval(timer);
    }, [playing, reduceMotion]);

    const selectScene = (index: number) => {
        setActiveScene(index);
        setManuallyPaused(true);
    };

    return (
        <div
            className={`cinematic-gallery ${playing ? 'is-playing' : ''}`}
            aria-label="Vòng phim về nhịp làm việc và vận động của LifeSync"
            onMouseEnter={() => setInteractionPaused(true)}
            onMouseLeave={() => setInteractionPaused(false)}
            onFocusCapture={() => setInteractionPaused(true)}
            onBlurCapture={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) setInteractionPaused(false);
            }}
        >
            <AnimatePresence initial={false} mode="sync">
                <motion.img
                    key={scenes[activeScene].src}
                    className="cinematic-gallery__image"
                    src={scenes[activeScene].src}
                    alt=""
                    aria-hidden="true"
                    draggable={false}
                    initial={{ opacity: 0, scale: reduceMotion ? 1 : 1.035 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{
                        opacity: { duration: reduceMotion ? 0.15 : 0.42, ease: [0.16, 1, 0.3, 1] },
                        scale: { duration: reduceMotion ? 0.15 : 5.4, ease: [0.16, 1, 0.3, 1] },
                    }}
                    style={{ objectPosition: scenes[activeScene].position }}
                    fetchPriority={activeScene === 0 ? 'high' : 'auto'}
                />
            </AnimatePresence>

            <div className="cinematic-gallery__controls">
                <div className="cinematic-gallery__status" aria-live="polite">
                    <span>{String(activeScene + 1).padStart(2, '0')}</span>
                    <strong>{scenes[activeScene].label}</strong>
                </div>
                <div className="cinematic-gallery__rail" role="group" aria-label="Chọn cảnh">
                    {scenes.map((scene, index) => (
                        <button
                            key={scene.src}
                            className={index === activeScene ? 'is-active' : ''}
                            type="button"
                            onClick={() => selectScene(index)}
                            aria-label={`Cảnh ${index + 1}: ${scene.label}`}
                            aria-pressed={index === activeScene}
                        >
                            <span />
                        </button>
                    ))}
                </div>
                <button
                    className="cinematic-gallery__toggle"
                    type="button"
                    onClick={() => setManuallyPaused((current) => !current)}
                    aria-label={manuallyPaused ? 'Tiếp tục vòng phim' : 'Tạm dừng vòng phim'}
                    disabled={Boolean(reduceMotion)}
                >
                    {manuallyPaused ? <Play size={16} /> : <Pause size={16} />}
                </button>
            </div>
        </div>
    );
}
