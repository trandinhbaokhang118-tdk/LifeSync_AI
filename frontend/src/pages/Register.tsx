import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Mail, Lock, User, Eye, EyeOff, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { AuthVisual } from '../components/login/AuthVisual';
import { BrandMark } from '../components/ui/BrandMark';
import api from '../services/api';
import '../components/login/login.css';
import '../components/login/login-enterprise.css';

const registerSchema = z
    .object({
        name: z.string().min(2, 'Tên phải có ít nhất 2 ký tự'),
        email: z.string().email('Địa chỉ email không hợp lệ'),
        password: z
            .string()
            .min(6, 'Mật khẩu phải có ít nhất 6 ký tự')
            .regex(/[a-z]/, 'Mật khẩu phải có chữ thường')
            .regex(/[A-Z]/, 'Mật khẩu phải có chữ hoa')
            .regex(/[0-9]/, 'Mật khẩu phải có số'),
        confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: 'Mật khẩu xác nhận không khớp',
        path: ['confirmPassword'],
    });

type RegisterForm = z.infer<typeof registerSchema>;

/**
 * Register page — shares the Login page's dark Split Studio auth shell.
 * Desktop: Sync visual on the left, focused registration flow on the right.
 * Mobile: the visual stacks above the form without changing the auth logic.
 */
export function Register() {
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();
    const reduceMotion = useReducedMotion();

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors, isSubmitting },
    } = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) });

    const password = watch('password', '');

    const passwordRules = [
        { label: 'Ít nhất 6 ký tự', valid: password.length >= 6 },
        { label: 'Một chữ thường', valid: /[a-z]/.test(password) },
        { label: 'Một chữ hoa', valid: /[A-Z]/.test(password) },
        { label: 'Một chữ số', valid: /[0-9]/.test(password) },
    ];

    // The auth routes share one dark, focused visual system.
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

    const onSubmit = async (data: RegisterForm) => {
        try {
            await api.post('/auth/register', {
                name: data.name,
                email: data.email,
                password: data.password,
            });
            toast.success('Tạo tài khoản thành công! Vui lòng đăng nhập.');
            navigate('/login');
        } catch (err: unknown) {
            const error = err as { response?: { data?: { error?: { message?: string } }; status?: number } };
            const message =
                error.response?.status === 429
                    ? 'Bạn đã tạo quá nhiều tài khoản. Vui lòng thử lại sau.'
                    : error.response?.data?.error?.message || 'Đăng ký thất bại';
            toast.error(message);
        }
    };

    return (
        <main className="auth-page auth-page--login auth-page--register">
            <div className="auth-layout">
                <AuthVisual mode="register" />
                <motion.section
                    className="auth-form-side"
                    aria-label="Đăng ký LifeSync AI"
                    initial={{ opacity: 0, x: reduceMotion ? 0 : 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: reduceMotion ? 0.01 : 0.54, ease: [0.16, 1, 0.3, 1] }}
                >
                    <motion.div
                        className="login-card auth-form-card auth-register-card w-full max-w-md p-6 md:p-8 lg:p-9"
                        initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: reduceMotion ? 0.01 : 0.42, ease: [0.16, 1, 0.3, 1] }}
                    >
                        {/* Header */}
                        <div className="auth-form-heading mb-6 lg:mb-8">
                            <div className="flex items-center gap-3 mb-4">
                                <motion.div
                                    className="auth-login-mark h-11 w-11"
                                >
                                    <BrandMark className="h-full w-full rounded-[10px]" />
                                </motion.div>
                                <span className="auth-login-brand text-lg font-bold">LifeSync AI</span>
                            </div>
                            <h1 className="auth-login-title text-2xl md:text-3xl font-extrabold">
                                Tạo tài khoản
                            </h1>
                            <p className="auth-login-subtitle mt-1.5 text-sm md:text-base">
                                Tạo không gian để công việc và sức khỏe cùng vận hành đúng nhịp.
                            </p>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit(onSubmit)} className="auth-login-form auth-register-form space-y-4" noValidate>
                            {/* Name */}
                            <div>
                                <label htmlFor="reg-name" className="auth-field-label block text-sm font-medium mb-1.5">
                                    Họ và tên
                                </label>
                                <div className={`auth-field-shell relative login-input-glow ${errors.name ? 'auth-field-shell--error' : ''}`}>
                                    <User className="auth-field-icon absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 pointer-events-none" />
                                    <input
                                        id="reg-name"
                                        {...register('name')}
                                        type="text"
                                        placeholder="Tên của bạn"
                                        autoComplete="name"
                                        disabled={isSubmitting}
                                        aria-required="true"
                                        aria-invalid={Boolean(errors.name)}
                                        aria-describedby={errors.name ? 'reg-name-error' : undefined}
                                        className="auth-field-input w-full h-12 pl-11 pr-10 text-sm disabled:opacity-50"
                                    />
                                </div>
                                <div className="auth-error-slot">
                                    <AnimatePresence>
                                        {errors.name && (
                                            <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} id="reg-name-error" role="alert" className="auth-field-error text-xs">
                                                {errors.name.message}
                                            </motion.p>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>

                            {/* Email */}
                            <div>
                                <label htmlFor="reg-email" className="auth-field-label block text-sm font-medium mb-1.5">
                                    Email
                                </label>
                                <div className={`auth-field-shell relative login-input-glow ${errors.email ? 'auth-field-shell--error' : ''}`}>
                                    <Mail className="auth-field-icon absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 pointer-events-none" />
                                    <input
                                        id="reg-email"
                                        {...register('email')}
                                        type="email"
                                        placeholder="ban@example.com"
                                        autoComplete="email"
                                        disabled={isSubmitting}
                                        aria-required="true"
                                        aria-invalid={Boolean(errors.email)}
                                        aria-describedby={errors.email ? 'reg-email-error' : undefined}
                                        className="auth-field-input w-full h-12 pl-11 pr-10 text-sm disabled:opacity-50"
                                    />
                                </div>
                                <div className="auth-error-slot">
                                    <AnimatePresence>
                                        {errors.email && (
                                            <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} id="reg-email-error" role="alert" className="auth-field-error text-xs">
                                                {errors.email.message}
                                            </motion.p>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>

                            {/* Password */}
                            <div>
                                <label htmlFor="reg-password" className="auth-field-label block text-sm font-medium mb-1.5">
                                    Mật khẩu
                                </label>
                                <div className={`auth-field-shell relative login-input-glow ${errors.password ? 'auth-field-shell--error' : ''}`}>
                                    <Lock className="auth-field-icon absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 pointer-events-none" />
                                    <input
                                        id="reg-password"
                                        {...register('password')}
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Tạo mật khẩu"
                                        autoComplete="new-password"
                                        disabled={isSubmitting}
                                        aria-required="true"
                                        aria-invalid={Boolean(errors.password)}
                                        aria-describedby={errors.password ? 'reg-password-error' : password ? 'reg-password-rules' : undefined}
                                        className="auth-field-input w-full h-12 pl-11 pr-12 text-sm disabled:opacity-50"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((v) => !v)}
                                        disabled={isSubmitting}
                                        aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                                        aria-pressed={showPassword}
                                        className="auth-password-toggle absolute right-3.5 top-1/2 -translate-y-1/2"
                                    >
                                        {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                                    </button>
                                </div>
                                {/* Password rules */}
                                <AnimatePresence>
                                    {password && (
                                        <motion.div
                                            id="reg-password-rules"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="auth-password-rules"
                                            aria-live="polite"
                                        >
                                            {passwordRules.map((rule) => (
                                                <div key={rule.label} className={`auth-password-rule ${rule.valid ? 'is-valid' : ''}`}>
                                                    {rule.valid ? <Check aria-hidden="true" /> : <X aria-hidden="true" />}
                                                    <span>{rule.label}</span>
                                                </div>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                                <div className="auth-error-slot">
                                    <AnimatePresence>
                                        {errors.password && (
                                            <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} id="reg-password-error" role="alert" className="auth-field-error text-xs">
                                                {errors.password.message}
                                            </motion.p>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>

                            {/* Confirm password */}
                            <div>
                                <label htmlFor="reg-confirm" className="auth-field-label block text-sm font-medium mb-1.5">
                                    Xác nhận mật khẩu
                                </label>
                                <div className={`auth-field-shell relative login-input-glow ${errors.confirmPassword ? 'auth-field-shell--error' : ''}`}>
                                    <Lock className="auth-field-icon absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 pointer-events-none" />
                                    <input
                                        id="reg-confirm"
                                        {...register('confirmPassword')}
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Nhập lại mật khẩu"
                                        autoComplete="new-password"
                                        disabled={isSubmitting}
                                        aria-required="true"
                                        aria-invalid={Boolean(errors.confirmPassword)}
                                        aria-describedby={errors.confirmPassword ? 'reg-confirm-error' : undefined}
                                        className="auth-field-input w-full h-12 pl-11 pr-10 text-sm disabled:opacity-50"
                                    />
                                </div>
                                <div className="auth-error-slot">
                                    <AnimatePresence>
                                        {errors.confirmPassword && (
                                            <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} id="reg-confirm-error" role="alert" className="auth-field-error text-xs">
                                                {errors.confirmPassword.message}
                                            </motion.p>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>

                            {/* Submit */}
                            <div className="pt-1">
                                <motion.button
                                    type="submit"
                                    disabled={isSubmitting}
                                    aria-busy={isSubmitting}
                                    className="auth-primary-button flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {isSubmitting ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
                                </motion.button>
                            </div>
                        </form>

                        {/* Sign in link */}
                        <p className="auth-secondary-copy text-center text-sm mt-4">
                            Đã có tài khoản?{' '}
                            <Link to="/login" className="auth-text-link font-semibold">
                                Đăng nhập
                            </Link>
                        </p>
                    </motion.div>
                    <p className="auth-footer">© 2026 LifeSync AI</p>
                </motion.section>
            </div>
        </main>
    );
}
