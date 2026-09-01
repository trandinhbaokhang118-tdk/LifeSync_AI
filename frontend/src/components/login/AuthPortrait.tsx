import { useEffect, useRef } from 'react';

const TRACKING_LIMIT = 1.15;

export function AuthPortrait() {
  const frameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let currentX = 0;
    let currentY = 0;
    let targetX = 0;
    let targetY = 0;
    let animationFrame = 0;

    const updateTarget = (event: PointerEvent) => {
      if (reducedMotion || event.pointerType === 'touch') return;

      const bounds = frame.getBoundingClientRect();
      targetX = Math.max(-TRACKING_LIMIT, Math.min(TRACKING_LIMIT,
        ((event.clientX - bounds.left) / Math.max(bounds.width, 1) - 0.5) * 2));
      targetY = Math.max(-TRACKING_LIMIT, Math.min(TRACKING_LIMIT,
        ((event.clientY - bounds.top) / Math.max(bounds.height, 1) - 0.5) * 2));
    };

    const resetTarget = () => {
      targetX = 0;
      targetY = 0;
    };

    const renderFrame = () => {
      currentX += (targetX - currentX) * 0.075;
      currentY += (targetY - currentY) * 0.075;

      frame.style.setProperty('--portrait-shift-x', `${currentX * -7}px`);
      frame.style.setProperty('--portrait-shift-y', `${currentY * -4}px`);
      frame.style.setProperty('--portrait-gaze-x', `${currentX * 24}px`);
      frame.style.setProperty('--portrait-gaze-y', `${currentY * 10}px`);
      frame.style.setProperty('--portrait-tilt', `${currentX * 0.35}deg`);

      animationFrame = requestAnimationFrame(renderFrame);
    };

    window.addEventListener('pointermove', updateTarget, { passive: true });
    window.addEventListener('blur', resetTarget);
    window.addEventListener('resize', resetTarget);
    animationFrame = requestAnimationFrame(renderFrame);

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener('pointermove', updateTarget);
      window.removeEventListener('blur', resetTarget);
      window.removeEventListener('resize', resetTarget);
    };
  }, []);

  return (
    <div ref={frameRef} className="auth-portrait" aria-hidden="true">
      <img
        className="auth-portrait__image"
        src="/login/lifesync-athlete-v1.webp"
        alt=""
        draggable={false}
        fetchPriority="high"
      />
      <span className="auth-portrait__visor-track" />
    </div>
  );
}
