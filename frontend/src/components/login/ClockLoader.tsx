import { useEffect, useState } from 'react';

/** Reports real elapsed request time; the API alone determines success. */
export function ClockLoader({ size = 36 }: { size?: number }) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const started = performance.now();
    const timer = window.setInterval(() => setSeconds(Math.floor((performance.now() - started) / 1000)), 250);
    return () => window.clearInterval(timer);
  }, []);
  return <div className="login-request" role="status" aria-live="polite">
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <circle cx="20" cy="20" r="17" className="login-request__track" />
      <circle cx="20" cy="20" r="17" className="login-request__arc" />
      <path d="M20 10v10l6 4" className="login-request__hand" />
    </svg>
    <span>{seconds >= 10 ? 'Vẫn đang kết nối…' : 'Đang xác thực…'}</span>
    <span aria-hidden="true" className="login-request__elapsed">{String(Math.floor(seconds / 60)).padStart(2, '0')}:{String(seconds % 60).padStart(2, '0')}</span>
  </div>;
}
