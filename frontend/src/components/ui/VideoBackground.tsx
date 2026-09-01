import { useEffect, useRef } from 'react';

interface VideoBackgroundProps {
    /** Video source path (relative to public folder) */
    src?: string;
    /** Additional CSS classes */
    className?: string;
    /** Opacity overlay (0-1) */
    opacity?: number;
}

/**
 * Looping video background for login/landing pages
 * Auto-plays, muted, loops infinitely
 */
export function VideoBackground({
    src = '/video-login.mp4',
    className = '',
    opacity = 0.6
}: VideoBackgroundProps) {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        // Ensure video plays (some browsers block autoplay)
        const playPromise = video.play();
        if (playPromise !== undefined) {
            playPromise.catch((error) => {
                console.warn('Video autoplay blocked:', error);
                // Retry on user interaction
                const handleInteraction = () => {
                    video.play();
                    document.removeEventListener('click', handleInteraction);
                    document.removeEventListener('touchstart', handleInteraction);
                };
                document.addEventListener('click', handleInteraction);
                document.addEventListener('touchstart', handleInteraction);
            });
        }
    }, []);

    return (
        <div className={`absolute inset-0 overflow-hidden ${className}`}>
            {/* Video element */}
            <video
                ref={videoRef}
                className="absolute inset-0 w-full h-full object-cover"
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
                style={{ opacity }}
            >
                <source src={src} type="video/mp4" />
                {/* Fallback for browsers that don't support video */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#0A1628] via-[#1E3A5F] to-[#0F1F3A]" />
            </video>

            {/* Optional gradient overlay for better text readability */}
            <div
                className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/30 pointer-events-none"
                aria-hidden="true"
            />
        </div>
    );
}
