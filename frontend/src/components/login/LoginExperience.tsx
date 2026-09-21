import { lazy, Suspense, useLayoutEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, CalendarDays, Dumbbell, Timer } from 'lucide-react';
import gsap from 'gsap';
import { LiveTimeRing } from './LiveTimeRing';

const Backdrop = lazy(() => import('./AuthMotionBackdrop').then(m => ({ default: m.AuthMotionBackdrop })));

export function LoginExperience() {
  const root = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference) and (pointer: fine)', () => {
      const image = el.querySelector('.login-studio__art');
      const x = gsap.quickTo(image, 'rotationY', { duration: 1, ease: 'power3.out' });
      const y = gsap.quickTo(image, 'rotationX', { duration: 1, ease: 'power3.out' });
      const zoom = gsap.quickTo(image, 'scale', { duration: 1, ease: 'power3.out' });
      const move = (e: PointerEvent) => {
        const box = el.getBoundingClientRect();
        x(((e.clientX - box.left) / box.width - 0.5) * 12);
        y(-((e.clientY - box.top) / box.height - 0.5) * 8);
        zoom(1.055);
      };
      const reset = () => { x(0); y(0); zoom(1); };
      el.addEventListener('pointermove', move, { passive: true });
      el.addEventListener('pointerleave', reset);
      return () => {
        el.removeEventListener('pointermove', move);
        el.removeEventListener('pointerleave', reset);
        gsap.killTweensOf(image);
      };
    });
    return () => media.revert();
  }, []);

  return (
    <aside ref={root} className="login-studio" aria-label="Thời gian, lịch trình và vận động">
      <Link to="/" className="login-studio__back"><ArrowLeft size={16} /> Trang chủ</Link>
      <span className="login-studio__edition">LIFESYNC / NHỊP SỐNG CỦA BẠN</span>
      <div className="login-studio__stage">
        <img className="login-studio__art" src="/login/time-sport-studio.png" alt="Đồng hồ kim loại, lịch và tạ thể thao nổi trên đường chạy 3D" fetchPriority="high" />
        <Suspense fallback={null}><Backdrop /></Suspense>
      </div>
      <LiveTimeRing />
      <div className="login-studio__copy">
        <span className="login-studio__eyebrow"><span /> MỖI KHOẢNH KHẮC ĐỀU CÓ Ý NGHĨA</span>
        <h2>Đúng nhịp thời gian.<br /><span>Trọn nhịp cuộc sống.</span></h2>
        <p>Dành chỗ cho điều quan trọng. Sắp xếp công việc,<br className="login-studio__break" /> giữ nhịp vận động và tìm lại khoảng thời gian cho bạn.</p>
        <div className="login-studio__topics"><span><CalendarDays /> Lên kế hoạch</span><span><Timer /> Tập trung</span><span><Dumbbell /> Vận động</span><ArrowUpRight /></div>
      </div>
    </aside>
  );
}
