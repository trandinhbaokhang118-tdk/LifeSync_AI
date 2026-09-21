import { useEffect } from 'react';
import { useAuthStore } from '../store/auth.store';
import { sendPresenceHeartbeat } from '../services/admin-kpis.service';
export function PresenceHeartbeat() {
  const authenticated = useAuthStore(s => s.isAuthenticated);
  useEffect(() => {
    if (!authenticated) return;
    let busy = false;
    const beat = async () => {
      if (busy || document.visibilityState !== 'visible' || !navigator.onLine) return;
      busy = true;
      try { await sendPresenceHeartbeat(); } catch { /* Presence retries on next interval. */ }
      finally { busy = false; }
    };
    void beat();
    const timer = window.setInterval(beat, 60000);
    document.addEventListener('visibilitychange', beat);
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', beat); };
  }, [authenticated]);
  return null;
}
