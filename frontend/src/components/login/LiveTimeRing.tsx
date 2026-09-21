import { useEffect, useMemo, useState } from 'react';

const RADIUS = 44;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function getNow() {
  return new Date();
}

/** A small real-time timekeeper that stays aligned with the user's local clock. */
export function LiveTimeRing() {
  const [now, setNow] = useState(getNow);

  useEffect(() => {
    let timeout: number;
    const tick = () => {
      const current = getNow();
      setNow(current);
      timeout = window.setTimeout(tick, 1000 - current.getMilliseconds());
    };
    timeout = window.setTimeout(tick, 1000 - Date.now() % 1000);
    const sync = () => { window.clearTimeout(timeout); tick(); };
    document.addEventListener('visibilitychange', sync);
    return () => {
      window.clearTimeout(timeout);
      document.removeEventListener('visibilitychange', sync);
    };
  }, []);

  const seconds = now.getSeconds() + now.getMilliseconds() / 1000;
  const progress = seconds / 60;
  const time = useMemo(() => now.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }), [now]);
  const date = useMemo(() => now.toLocaleDateString('vi-VN', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
  }), [now]);

  return (
    <div className="auth-time-ring" aria-label={`Giờ hiện tại ${time}, ${date}`}>
      <svg className="auth-time-ring__svg" viewBox="0 0 100 100" aria-hidden="true">
        <circle className="auth-time-ring__track" cx="50" cy="50" r={RADIUS} />
        <circle
          className="auth-time-ring__progress"
          cx="50"
          cy="50"
          r={RADIUS}
          style={{ strokeDasharray: CIRCUMFERENCE, strokeDashoffset: CIRCUMFERENCE * (1 - progress), transition: now.getSeconds() === 0 ? 'none' : undefined }}
        />
      </svg>
      <div className="auth-time-ring__content">
        <span className="auth-time-ring__time">{time}</span>
        <span className="auth-time-ring__date">{date}</span>
      </div>
      <span className="auth-time-ring__pulse" aria-hidden="true" />
    </div>
  );
}
