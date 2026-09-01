import { useState, useCallback, useEffect, useRef, type FormEvent } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { ClockLoader } from './ClockLoader';
import { API_URL } from '../../lib/api-config';
import api from '../../services/api';
import type { AuthResponse } from '../../types';
import { Link, useNavigate } from 'react-router-dom';
import { BrandMark } from '../ui/BrandMark';

type LoginApiResponse = { data: AuthResponse } | AuthResponse;
type OAuthStatus = { google: boolean; facebook: boolean };
type OAuthStatusResponse = { data: OAuthStatus } | OAuthStatus;

/* ─── Types ─── */
export type LoginState = 'idle' | 'loading' | 'celebrating' | 'error';

interface LoginFormProps {
  onLoginStateChange: (state: LoginState) => void;
  loginState: LoginState;
  onLoginSuccess: (auth: AuthResponse, rememberMe: boolean) => void;
}

/* ─── Shake variants ─── */
export function LoginForm({ onLoginStateChange, loginState, onLoginSuccess }: LoginFormProps) {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [shouldShake, setShouldShake] = useState(false);
  const [oauthStatus, setOAuthStatus] = useState<OAuthStatus>({ google: false, facebook: false });

  useEffect(() => {
    let active = true;

    api.get<OAuthStatusResponse>('/auth/oauth/status')
      .then((response) => {
        if (!active) return;
        setOAuthStatus('data' in response.data ? response.data.data : response.data);
      })
      .catch(() => {
        if (active) setOAuthStatus({ google: false, facebook: false });
      });

    return () => {
      active = false;
    };
  }, []);

  const validate = useCallback(() => {
    const newErrors: typeof errors = {};
    if (!email.trim()) newErrors.email = 'Vui lòng nhập email';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Địa chỉ email không hợp lệ';
    if (!password.trim()) newErrors.password = 'Vui lòng nhập mật khẩu';
    return newErrors;
  }, [email, password]);

  const triggerShake = useCallback(() => {
    setShouldShake(true);
    setTimeout(() => setShouldShake(false), 600);
  }, []);

  // Holds the authenticated session returned by the API until the clock
  // animation finishes, so we redirect with real tokens (not a demo stub).
  const authRef = useRef<AuthResponse | null>(null);
  const clockCompleteRef = useRef(false);
  const redirectingRef = useRef(false);

  const finishLoginIfReady = useCallback(() => {
    if (!authRef.current || !clockCompleteRef.current || redirectingRef.current) {
      return;
    }

    const auth = authRef.current;
    redirectingRef.current = true;
    onLoginStateChange('celebrating');

    // Let celebration play for 1.5s, then redirect with the real session.
    setTimeout(() => {
      onLoginSuccess(auth, rememberMe);
    }, 1500);
  }, [onLoginStateChange, onLoginSuccess, rememberMe]);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setErrors({});

      // Validate
      const validationErrors = validate();
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        triggerShake();
        return;
      }

      // Start loading
      authRef.current = null;
      clockCompleteRef.current = false;
      redirectingRef.current = false;
      onLoginStateChange('loading');

      try {
        // Call the real backend. Responses are wrapped as { data: ... }.
        const res = await api.post<LoginApiResponse>('/auth/login', {
          email: email.trim(),
          password,
          rememberMe,
        });

        // Keep the session for handleClockComplete to consume after the
        // success animation finishes.
        authRef.current = 'data' in res.data ? res.data.data : res.data;
        finishLoginIfReady();
      } catch (err: unknown) {
        authRef.current = null;
        clockCompleteRef.current = false;
        redirectingRef.current = false;
        const error = err as { response?: { data?: { error?: { code?: string; message?: string } }; status?: number } };
        const status = error.response?.status;
        const code = error.response?.data?.error?.code;

        if (code === 'AUTH_ADMIN_PORTAL_REQUIRED') {
          onLoginStateChange('idle');
          navigate('/admin/login', {
            state: { email: email.trim(), redirectedFromUserLogin: true },
          });
          return;
        }

        const message =
          status === 429
            ? 'Bạn đã thử đăng nhập quá nhiều lần. Vui lòng thử lại sau.'
            : error.response?.data?.error?.message || 'Email hoặc mật khẩu không đúng.';

        onLoginStateChange('error');
        setErrors({ general: message });
        triggerShake();
        setTimeout(() => onLoginStateChange('idle'), 100);
      }
    },
    [email, password, rememberMe, validate, onLoginStateChange, triggerShake, finishLoginIfReady, navigate],
  );

  const handleClockComplete = useCallback(() => {
    clockCompleteRef.current = true;
    finishLoginIfReady();
  }, [finishLoginIfReady]);

  const handleGoogleLogin = useCallback(() => {
    // Use the existing social login flow
    window.location.href = `${API_URL}/auth/google`;
  }, []);

  const handleFacebookLogin = useCallback(() => {
    window.location.href = `${API_URL}/auth/facebook`;
  }, []);

  const isLoading = loginState === 'loading';
  const isCelebrating = loginState === 'celebrating';

  return (
    <motion.div
      className="login-card auth-form-card w-full max-w-md p-6 md:p-8 lg:p-9"
      initial={{ opacity: 0, x: reduceMotion ? 0 : 24 }}
      animate={shouldShake && !reduceMotion
        ? { opacity: 1, x: [0, -8, 8, -6, 6, -3, 3, 0] }
        : { opacity: 1, x: 0 }}
      transition={{ duration: reduceMotion ? 0.01 : shouldShake ? 0.5 : 0.54, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Header */}
      <motion.div
        className="auth-form-heading mb-6 lg:mb-8"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: reduceMotion ? 0 : 0.12, duration: 0.36 }}
      >
        <div className="flex items-center gap-3 mb-4">
          <motion.div className="auth-login-mark h-11 w-11">
            <BrandMark className="h-full w-full rounded-[10px]" />
          </motion.div>
          <span className="auth-login-brand text-lg font-bold">LifeSync AI</span>
        </div>
        <h1 className="auth-login-title text-2xl md:text-3xl font-extrabold">
          Chào mừng trở lại
        </h1>
        <p className="auth-login-subtitle mt-1.5 text-sm md:text-base">
          Tiếp tục nhịp làm việc và chăm sóc bản thân của bạn.
        </p>
      </motion.div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="auth-login-form space-y-4" noValidate>
        {/* General error */}
        <AnimatePresence>
          {errors.general && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              role="alert"
              className="auth-general-error px-4 py-3 text-sm"
            >
              {errors.general}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Email */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <label htmlFor="login-email" className="auth-field-label block text-sm font-medium mb-1.5">
            Email
          </label>
          <div className={`auth-field-shell relative login-input-glow ${errors.email ? 'auth-field-shell--error' : ''}`}>
            <Mail className="auth-field-icon absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 pointer-events-none" />
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setErrors((prev) => ({ ...prev, email: undefined })); }}
              placeholder="ban@example.com"
              disabled={isLoading || isCelebrating}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? 'login-email-error' : undefined}
              className="auth-field-input w-full h-12 pl-11 pr-4 text-sm disabled:opacity-50"
            />
          </div>
          <div className="auth-error-slot">
            <AnimatePresence>
              {errors.email && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  id="login-email-error"
                  role="alert"
                  className="auth-field-error text-xs"
                >
                  {errors.email}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Password */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <label htmlFor="login-password" className="auth-field-label block text-sm font-medium mb-1.5">
            Mật khẩu
          </label>
          <div className={`auth-field-shell relative login-input-glow ${errors.password ? 'auth-field-shell--error' : ''}`}>
            <Lock className="auth-field-icon absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 pointer-events-none" />
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setErrors((prev) => ({ ...prev, password: undefined })); }}
              placeholder="Nhập mật khẩu"
              disabled={isLoading || isCelebrating}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? 'login-password-error' : undefined}
              className="auth-field-input w-full h-12 pl-11 pr-12 text-sm disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              aria-pressed={showPassword}
              className="auth-password-toggle absolute right-3.5 top-1/2 -translate-y-1/2"
            >
              {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
            </button>
          </div>
          <div className="auth-error-slot">
            <AnimatePresence>
              {errors.password && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  id="login-password-error"
                  role="alert"
                  className="auth-field-error text-xs"
                >
                  {errors.password}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Remember me + Forgot password */}
        <motion.div
          className="flex items-center justify-between"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="login-checkbox"
            />
            <span className="auth-remember-label text-sm">
              Ghi nhớ đăng nhập
            </span>
          </label>
          <Link
            to="/forgot-password"
            className="auth-text-link text-sm font-medium"
          >
            Quên mật khẩu?
          </Link>
        </motion.div>

        {/* Login Button / Clock Loader */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="pt-1"
        >
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="clock-loader"
                initial={{ opacity: 0, y: reduceMotion ? 0 : 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: reduceMotion ? 0 : -5 }}
                className="flex items-center justify-center h-12"
              >
                <ClockLoader size={48} onComplete={handleClockComplete} />
              </motion.div>
            ) : (
              <motion.button
                key="login-button"
                type="submit"
                disabled={isCelebrating}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, y: reduceMotion ? 0 : -5 }}
                className="auth-primary-button flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isCelebrating ? (
                  <>
                    Đăng nhập thành công
                  </>
                ) : (
                  'Đăng nhập'
                )}
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Divider */}
        <motion.div
          className="relative my-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="absolute inset-0 flex items-center">
            <div className="auth-divider-rule w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="auth-divider-label px-3 text-gray-500">hoặc tiếp tục với</span>
          </div>
        </motion.div>

        {/* Social sign-in */}
        <div className="grid gap-3 sm:grid-cols-2">
          <motion.button
            type="button"
            onClick={handleGoogleLogin}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            disabled={isLoading || isCelebrating || !oauthStatus.google}
            title={oauthStatus.google ? 'Dang nhap bang Google' : 'Google chua duoc cau hinh'}
            className="login-social-btn w-full h-12 font-medium text-sm
                       flex items-center justify-center gap-2.5 disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Google
          </motion.button>

          <motion.button
            type="button"
            onClick={handleFacebookLogin}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            disabled={isLoading || isCelebrating || !oauthStatus.facebook}
            title={oauthStatus.facebook ? 'Dang nhap bang Facebook' : 'Facebook chua duoc cau hinh'}
            className="login-social-btn w-full h-12 font-medium text-sm
                       flex items-center justify-center gap-2.5 disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#1877F2" d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.313 0 2.686.236 2.686.236v2.97h-1.513c-1.49 0-1.956.93-1.956 1.884v2.27h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
            </svg>
            Facebook
          </motion.button>
        </div>

        {/* Sign up link */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="auth-secondary-copy text-center text-sm mt-2"
        >
          Chưa có tài khoản?{' '}
          <Link to="/register" className="auth-text-link font-semibold">
            Đăng ký ngay
          </Link>
        </motion.p>

      </form>
    </motion.div>
  );
}
