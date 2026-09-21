import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { Check } from 'lucide-react';
import { useLoginTransition } from '../../store/login-transition.store';
import './login-experience.css';

/** Lives above the router's Suspense so the portal survives route loading. */
export function LoginTransition() {
  const { phase, setPhase } = useLoginTransition();
  const root = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (phase === 'idle' || !root.current) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const context = gsap.context(() => {
      if (phase === 'cover') {
        gsap.fromTo(root.current, { opacity: reduced ? 0 : 1, clipPath: reduced ? 'none' : 'circle(0% at 72% 55%)' }, {
          opacity: 1, clipPath: reduced ? 'none' : 'circle(150% at 72% 55%)', duration: reduced ? 0.12 : 0.65, ease: 'power3.inOut',
        });
        gsap.fromTo('.login-portal__message', { opacity: 0, y: reduced ? 0 : 12 }, { opacity: 1, y: 0, duration: reduced ? 0.12 : 0.4, delay: reduced ? 0 : 0.3 });
      } else {
        gsap.to(root.current, { opacity: 0, duration: reduced ? 0.12 : 0.7, ease: 'power2.inOut', onComplete: () => setPhase('idle') });
        if (!reduced) gsap.to('.login-portal__ring', { scale: 3.5, opacity: 0, duration: 0.7 });
      }
    }, root);
    // Never leave an overlay stuck if a destination route fails to mount.
    const safety = window.setTimeout(() => setPhase('idle'), 8000);
    return () => { context.revert(); window.clearTimeout(safety); };
  }, [phase, setPhase]);
  if (phase === 'idle') return null;
  return <div ref={root} className="login-portal" role="status" aria-live="polite">
    <div className="login-portal__ring" aria-hidden="true" />
    <div className="login-portal__message"><Check size={32} /><span>ĐÃ KẾT NỐI</span><strong>Ngày của bạn,<br />bắt đầu từ đây.</strong><p>Đang mở không gian của bạn…</p></div>
  </div>;
}
