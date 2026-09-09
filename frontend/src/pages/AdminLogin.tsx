import { useEffect, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Eye, EyeOff, KeyRound, Lock, Mail, ShieldCheck } from 'lucide-react';
import { Button, Input } from '../components/ui';
import { showToast } from '../components/ui/toast';
import { useAuthStore } from '../store/auth.store';
import api from '../services/api';
import { getAllowedRedirectPathForUser, getDefaultRouteForUser } from '../lib/auth';
import type { ApiResponse, AuthResponse } from '../types';
import './admin-login.css';

const adminLoginSchema = z.object({
    email: z.string().email('Email không hợp lệ'),
    password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
});

type AdminLoginForm = z.infer<typeof adminLoginSchema>;

type AdminMfaChallenge =
    | {
        mode: 'verify';
        mfaToken: string;
        expiresInSeconds: number;
        user: {
            email: string;
            name: string;
        };
    }
    | {
        mode: 'setup';
        mfaToken: string;
        expiresInSeconds: number;
        user: {
            email: string;
            name: string;
        };
        totp: {
            issuer: string;
            accountName: string;
            secret: string;
            otpauthUrl: string;
            period: number;
            digits: number;
        };
    };

type AdminLoginResult =
    | AuthResponse
    | {
        mfaRequired: true;
        mfaToken: string;
        expiresInSeconds: number;
        user: {
            email: string;
            name: string;
        };
    }
    | {
        mfaSetupRequired: true;
        mfaToken: string;
        expiresInSeconds: number;
        user: {
            email: string;
            name: string;
        };
        totp: {
            issuer: string;
            accountName: string;
            secret: string;
            otpauthUrl: string;
            period: number;
            digits: number;
        };
    };

export function AdminLogin() {
    const [showPassword, setShowPassword] = useState(false);
    const [mfaCode, setMfaCode] = useState('');
    const [mfaChallenge, setMfaChallenge] = useState<AdminMfaChallenge | null>(null);
    const [isVerifyingMfa, setIsVerifyingMfa] = useState(false);
    const { login, isAuthenticated, user } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();
    const locationState = location.state as {
        from?: { pathname?: string };
        email?: string;
        redirectedFromUserLogin?: boolean;
    } | null;
    const from = locationState?.from?.pathname || '/admin';

    useEffect(() => {
        const savedTheme = (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        if (savedTheme === 'dark') {
            document.documentElement.classList.add('dark');
        }
    }, []);

    useEffect(() => {
        if (isAuthenticated) {
            navigate(getDefaultRouteForUser(user), { replace: true });
        }
    }, [isAuthenticated, navigate, user]);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<AdminLoginForm>({
        resolver: zodResolver(adminLoginSchema),
        defaultValues: {
            email: locationState?.email || '',
            password: '',
        },
    });

    const completeAdminLogin = (auth: AuthResponse) => {
        const { accessToken, refreshToken, user: loggedInUser } = auth;

        if (loggedInUser.role !== 'ADMIN' || loggedInUser.portal !== 'admin') {
            showToast.error('Không đủ quyền truy cập', 'Trang này chỉ dành cho tài khoản admin.');
            return;
        }

        login(loggedInUser, accessToken, refreshToken);
        showToast.success('Đăng nhập admin thành công', `Xin chào ${loggedInUser.name}`);
        navigate(getAllowedRedirectPathForUser(loggedInUser, from), { replace: true });
    };

    const onSubmit = async (data: AdminLoginForm) => {
        try {
            const response = await api.post<ApiResponse<AdminLoginResult>>('/auth/admin/login', data);
            const result = response.data.data;

            if ('mfaSetupRequired' in result) {
                setMfaChallenge({
                    mode: 'setup',
                    mfaToken: result.mfaToken,
                    expiresInSeconds: result.expiresInSeconds,
                    user: result.user,
                    totp: result.totp,
                });
                setMfaCode('');
                showToast.info('ần thiết lập MFA', 'Nhập secret vào ứng dụng xác thực rồi điền mã 6 số.');
                return;
            }

            if ('mfaRequired' in result) {
                setMfaChallenge({
                    mode: 'verify',
                    mfaToken: result.mfaToken,
                    expiresInSeconds: result.expiresInSeconds,
                    user: result.user,
                });
                setMfaCode('');
                showToast.info('Nhập mã MFA', 'Vui lòng nhập mã 6 số từ ứng dụng xác thực.');
                return;
            }

            completeAdminLogin(result);
        } catch (err: unknown) {
            const error = err as { response?: { data?: { error?: { message?: string } } } };
            showToast.error(
                'Đăng nhập thất bại',
                error.response?.data?.error?.message || 'Vui lòng kiểm tra lại thông tin.',
            );
        }
    };

    const onSubmitMfa = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!mfaChallenge || !/^\d{6}$/.test(mfaCode.trim())) {
            showToast.error('Mã MFA không hợp lệ', 'Vui lòng nhập đúng 6 chữ số.');
            return;
        }

        setIsVerifyingMfa(true);

        try {
            const endpoint =
                mfaChallenge.mode === 'setup'
                    ? '/auth/admin/mfa/setup/verify'
                    : '/auth/admin/mfa/verify';
            const response = await api.post<ApiResponse<AuthResponse>>(endpoint, {
                mfaToken: mfaChallenge.mfaToken,
                code: mfaCode.trim(),
            });

            completeAdminLogin(response.data.data);
        } catch (err: unknown) {
            const error = err as { response?: { data?: { error?: { message?: string } } } };
            showToast.error(
                'Xác thực MFA thất bại',
                error.response?.data?.error?.message || 'Mã MFA không đúng hoặc đã hết hạn.',
            );
        } finally {
            setIsVerifyingMfa(false);
        }
    };

    return (
        <main className="admin-login-page">
            <div className="admin-login-shell">
                <header className="admin-login-header">
                    <Link to="/login" className="admin-login-back">
                        <ArrowLeft aria-hidden="true" />
                        <span>Đăng nhập người dùng</span>
                    </Link>

                    <div className="admin-login-brand">
                        <div className="admin-login-brand-mark" aria-hidden="true">
                            <ShieldCheck />
                        </div>
                        <div>
                            <p>LifeSync AI</p>
                            <h1>Đăng nhập Admin</h1>
                        </div>
                    </div>

                    <p className="admin-login-intro">
                        Cổng quản trị dành riêng cho tài khoản Admin đã được cấp quyền.
                    </p>
                </header>

                <section className="admin-login-panel" aria-label="Xác thực quản trị viên">
                    {!mfaChallenge ? (
                        <form onSubmit={handleSubmit(onSubmit)} className="admin-login-form" noValidate>
                            <div className="admin-login-field">
                                <label htmlFor="admin-email">Email admin</label>
                                <Input
                                    {...register('email')}
                                    id="admin-email"
                                    type="email"
                                    autoComplete="username"
                                    placeholder="admin@lifesyncai.com"
                                    icon={<Mail aria-hidden="true" />}
                                    error={!!errors.email}
                                    aria-invalid={!!errors.email}
                                    aria-describedby="admin-email-help"
                                    className="admin-login-input"
                                />
                                <p id="admin-email-help" className="admin-login-helper" role={errors.email ? 'alert' : undefined}>
                                    {errors.email?.message}
                                </p>
                            </div>

                            <div className="admin-login-field">
                                <label htmlFor="admin-password">Mật khẩu</label>
                                <Input
                                    {...register('password')}
                                    id="admin-password"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="current-password"
                                    placeholder="Mật khẩu quản trị"
                                    icon={<Lock aria-hidden="true" />}
                                    iconRight={
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword((current) => !current)}
                                            className="admin-login-password-toggle"
                                            aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                                        >
                                            {showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
                                        </button>
                                    }
                                    error={!!errors.password}
                                    aria-invalid={!!errors.password}
                                    aria-describedby="admin-password-help"
                                    className="admin-login-input"
                                />
                                <p id="admin-password-help" className="admin-login-helper" role={errors.password ? 'alert' : undefined}>
                                    {errors.password?.message}
                                </p>
                            </div>

                            <Button type="submit" className="admin-login-submit" size="lg" loading={isSubmitting}>
                                Đăng nhập Admin
                            </Button>
                        </form>
                    ) : (
                        <form onSubmit={onSubmitMfa} className="admin-login-form" noValidate>
                            <div className="admin-login-mfa-note">
                                <KeyRound aria-hidden="true" />
                                <div>
                                    <h2>{mfaChallenge.mode === 'setup' ? 'Thiết lập MFA' : 'Xác thực MFA'}</h2>
                                    <p>
                                        {mfaChallenge.mode === 'setup'
                                            ? 'Thêm khóa bên dưới vào ứng dụng xác thực, sau đó nhập mã 6 số.'
                                            : `Nhập mã 6 số cho ${mfaChallenge.user.email}.`}
                                    </p>
                                </div>
                            </div>

                            {mfaChallenge.mode === 'setup' && (
                                <div className="admin-login-field">
                                    <label htmlFor="admin-totp-secret">Khóa thiết lập</label>
                                    <input
                                        id="admin-totp-secret"
                                        value={mfaChallenge.totp.secret}
                                        readOnly
                                        className="admin-login-secret"
                                    />
                                    <a href={mfaChallenge.totp.otpauthUrl} className="admin-login-authenticator-link">
                                        Mở bằng ứng dụng xác thực
                                    </a>
                                </div>
                            )}

                            <div className="admin-login-field">
                                <label htmlFor="admin-mfa-code">Mã xác thực 6 số</label>
                                <Input
                                    id="admin-mfa-code"
                                    value={mfaCode}
                                    onChange={(event) => setMfaCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                                    type="text"
                                    inputMode="numeric"
                                    autoComplete="one-time-code"
                                    placeholder="123456"
                                    icon={<KeyRound aria-hidden="true" />}
                                    className="admin-login-input admin-login-mfa-input"
                                />
                            </div>

                            <Button type="submit" className="admin-login-submit" size="lg" loading={isVerifyingMfa}>
                                {mfaChallenge.mode === 'setup' ? 'Bật MFA và đăng nhập' : 'Xác thực và đăng nhập'}
                            </Button>

                            <button
                                type="button"
                                onClick={() => {
                                    setMfaChallenge(null);
                                    setMfaCode('');
                                }}
                                className="admin-login-cancel"
                            >
                                Quay lại
                            </button>
                        </form>
                    )}
                </section>

                <footer className="admin-login-footer">Admin Portal · Xác thực đa lớp</footer>
            </div>
        </main>
    );
}
