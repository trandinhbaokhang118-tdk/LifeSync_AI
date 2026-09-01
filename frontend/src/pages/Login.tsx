import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { AuthVisual } from '../components/login/AuthVisual';
import { LoginForm, type LoginState } from '../components/login/LoginForm';
import { getDefaultRouteForUser } from '../lib/auth';
import { useAuthStore } from '../store/auth.store';
import type { AuthResponse } from '../types';
import '../components/login/login.css';
import '../components/login/login-enterprise.css';

export function Login() {
  const [loginState, setLoginState] = useState<LoginState>('idle');
  const { login, isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate(getDefaultRouteForUser(user), { replace: true });
    }
  }, [isAuthenticated, navigate, user]);

  useEffect(() => {
    const root = document.documentElement;
    const previousTheme = root.getAttribute('data-theme');
    const previouslyDark = root.classList.contains('dark');

    root.setAttribute('data-theme', 'dark');
    root.classList.add('dark');

    return () => {
      if (previousTheme) root.setAttribute('data-theme', previousTheme);
      else root.removeAttribute('data-theme');

      root.classList.toggle('dark', previouslyDark);
    };
  }, []);

  const handleLoginSuccess = useCallback(
    (auth: AuthResponse, rememberMe: boolean) => {
      login(auth.user, auth.accessToken, auth.refreshToken, rememberMe);
      navigate(getDefaultRouteForUser(auth.user), { replace: true });
    },
    [login, navigate],
  );

  const isCelebrating = loginState === 'celebrating';

  return (
    <main className="auth-page auth-page--login">
      <AnimatePresence>
        {isCelebrating && (
          <motion.div
            className="auth-success-wash"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
          />
        )}
      </AnimatePresence>

      <div className="auth-layout">
        <AuthVisual mode="login" celebrating={isCelebrating} />
        <section className="auth-form-side" aria-label="Đăng nhập LifeSync AI">
          <LoginForm
            loginState={loginState}
            onLoginStateChange={setLoginState}
            onLoginSuccess={handleLoginSuccess}
          />
          <p className="auth-footer">© 2026 LifeSync AI</p>
        </section>
      </div>
    </main>
  );
}
