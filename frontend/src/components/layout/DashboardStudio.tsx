import { lazy, Suspense, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { Pause, Play } from 'lucide-react';

const Orbit = lazy(() => import('../login/AuthMotionBackdrop').then(m => ({ default: m.AuthMotionBackdrop })));

export function DashboardStudio() {
  const root = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  useLayoutEffect(() => {
    if (!root.current || paused) return;
    const el = root.current;
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference) and (pointer: fine)', () => {
      const art = el.querySelector('.workspace-art__images');
      const x = gsap.quickTo(art, 'rotationY', { duration: .8, ease: 'power3.out' });
      const y = gsap.quickTo(art, 'rotationX', { duration: .8, ease: 'power3.out' });
      const zoom = gsap.quickTo(art, 'scale', { duration: .8, ease: 'power3.out' });
      const move = (event: PointerEvent) => {
        const box = el.getBoundingClientRect();
        x(((event.clientX - box.left) / box.width - .5) * 10);
        y(-((event.clientY - box.top) / box.height - .5) * 8);
        zoom(1.055);
      };
      const reset = () => { x(0); y(0); zoom(1); };
      el.addEventListener('pointermove', move, { passive: true });
      el.addEventListener('pointerleave', reset);
      return () => {
        el.removeEventListener('pointermove', move);
        el.removeEventListener('pointerleave', reset);
        gsap.killTweensOf(art);
        gsap.set(art, { clearProps: 'transform' });
      };
    });
    return () => media.revert();
  }, [paused]);
  return <div ref={root} className="workspace-art login-studio" data-paused={paused}>
    <div className="workspace-art__images" aria-hidden="true">
      <img className="workspace-art__day" src="/dashboard/studio-wide-day.png" alt="" width="2172" height="724" fetchPriority="high" />
      <img className="workspace-art__night" src="/dashboard/studio-wide-night.png" alt="" width="2172" height="724" />
    </div>
    {!paused && <Suspense fallback={null}><Orbit /></Suspense>}
    <div className="workspace-art__caption">LỊCH TRÌNH · THỜI GIAN · VẬN ĐỘNG</div>
    <button type="button" className="workspace-art__pause" onClick={() => setPaused(v => !v)} aria-label={paused ? 'Bật chuyển động 3D' : 'Tạm dừng chuyển động 3D'} aria-pressed={paused}>{paused ? <Play size={14} /> : <Pause size={14} />}</button>
  </div>;
}
