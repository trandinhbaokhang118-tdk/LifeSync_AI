import { useEffect, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Eye, EyeOff, KeyRound, Lock, Mail, Shield } from 'lucide-react';
import { Button, Input } from '../components/ui';
import { showToast } from '../components/ui/toast';
import { useAuthStore } from '../store/auth.store';
import api from '../services/api';
import { getAllowedRedirectPathForUser, getDefaultRouteForUser } from '../lib/auth';
import type { ApiResponse, AuthResponse } from '../types';

const adminLoginSchema = z.object({
    email: z.string().email('Email khong hop le'),
    password: z.string().min(1, 'Vui long nhap mat khau'),
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
                'Dang nhap that bai',
                error.response?.data?.error?.message || 'Vui long kiem tra lai thong tin.',
            );
        }
    };

    const onSubmitMfa = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!mfaChallenge || !/^\d{6}$/.test(mfaCode.trim())) {
            showToast.error('Ma MFA khong hop le', 'Vui long nhap dung 6 chu so.');
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
                'Xac thuc MFA that bai',
                error.response?.data?.error?.message || 'Ma MFA khong dung hoac da het han.',
            );
        } finally {
            setIsVerifyingMfa(false);
        }
    };

    return (
        <div className="admin-login-page min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.2),_transparent_35%),linear-gradient(135deg,#020617_0%,#0f172a_45%,#111827_100%)] p-4">
            <div className="absolute inset-0 pointer-events-none opacity-20">
                <div className="absolute left-10 top-10 h-56 w-56 rounded-full bg-cyan-400 blur-3xl" />
                <div className="absolute bottom-10 right-10 h-64 w-64 rounded-full bg-blue-600 blur-3xl" />
            </div>

            <div className="relative z-10 w-full max-w-md rounded-3xl border border-cyan-500/20 bg-slate-950/80 p-8 shadow-2xl backdrop-blur-xl">
                <Link
                    to="/login"
                    className="mb-6 inline-flex items-center gap-2 text-sm text-cyan-300 transition-colors hover:text-cyan-100"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Về trang đăng nhập người dùng
                </Link>

                <div className="mb-8">
                    <div className="mb-5 flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 shadow-lg shadow-cyan-500/20">
                            <Shield className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/80">Admin Portal</p>
                            <h1 className="text-2xl font-semibold text-white">LifeSync AI Control</h1>
                        </div>
                    </div>

                    <h2 className="text-3xl font-bold text-white">Đăng nhập Admin</h2>
                    <p className="mt-2 text-sm text-slate-300">
                        Chỉ có tài khoản Admin mới có quyền đăng nhập trang quản trị.
                    </p>
                </div>

                {!mfaChallenge ? (
                    <>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-200">Email admin</label>
                                <Input
                                    {...register('email')}
                                    type="email"
                                    placeholder="admin@lifesyncai.com"
                                    icon={<Mail className="h-5 w-5" />}
                                    error={!!errors.email}
                                    className="border-white/10 bg-white/5 text-white placeholder:text-slate-400"
                                />
                                {errors.email && <p className="mt-1.5 text-sm text-rose-400">{errors.email.message}</p>}
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-200">Mat khau</label>
                                <Input
                                    {...register('password')}
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Nhap mat khau admin"
                                    icon={<Lock className="h-5 w-5" />}
                                    iconRight={
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword((current) => !current)}
                                            className="text-slate-400 transition-colors hover:text-white"
                                        >
                                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                        </button>
                                    }
                                    error={!!errors.password}
                                    className="border-white/10 bg-white/5 text-white placeholder:text-slate-400"
                                />
                                {errors.password && (
                                    <p className="mt-1.5 text-sm text-rose-400">{errors.password.message}</p>
                                )}
                            </div>

                            <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
                                Đăng nhập Admin
                            </Button>
                        </form>

                        <div className="mt-6 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-4 text-sm text-cyan-100">
                            <p className="font-medium">Lưu ý</p>
                            <p className="mt-1 text-cyan-50/80">
                                Tài khoản user thông thường sẽ không vào được trang này.
                            </p>
                        </div>
                    </>
                ) : (
                    <form onSubmit={onSubmitMfa} className="space-y-5">
                        <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-4 text-sm text-cyan-100">
                            <div className="mb-3 flex items-center gap-2 font-semibold text-white">
                                <KeyRound className="h-4 w-4 text-cyan-300" />
                                {mfaChallenge.mode === 'setup' ? 'Thiết lập MFA Admin' : 'Xác thực MFA Admin'}
                            </div>
                            <p className="text-cyan-50/80">
                                {mfaChallenge.mode === 'setup'
                                    ? 'Nhập secret này vào ứng dụng mã xác thực, sau đó điền mã 6 số vào ô bên dưới.'
                                    : `Nhập mã 6 số của ${mfaChallenge.user.email}.`}
                            </p>
                        </div>

                        {mfaChallenge.mode === 'setup' && (
                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-200">TOTP secret</label>
                                <input
                                    value={mfaChallenge.totp.secret}
                                    readOnly
                                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-mono text-sm text-cyan-100 outline-none"
                                />
                                <a
                                    href={mfaChallenge.totp.otpauthUrl}
                                    className="mt-2 inline-flex text-sm font-medium text-cyan-300 transition-colors hover:text-cyan-100"
                                >
                                    Mở bằng ứng dụng xác thực Google Authenticator ...
                                </a>
                            </div>
                        )}

                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-200">Mã 6 số</label>
                            <Input
                                value={mfaCode}
                                onChange={(event) => setMfaCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                                type="text"
                                inputMode="numeric"
                                placeholder="123456"
                                icon={<KeyRound className="h-5 w-5" />}
                                className="border-white/10 bg-white/5 text-white placeholder:text-slate-400"
                            />
                        </div>

                        <Button type="submit" className="w-full" size="lg" loading={isVerifyingMfa}>
                            {mfaChallenge.mode === 'setup' ? 'Bat MFA va dang nhap' : 'Xac thuc va dang nhap'}
                        </Button>

                        <button
                            type="button"
                            onClick={() => {
                                setMfaChallenge(null);
                                setMfaCode('');
                            }}
                            className="w-full text-sm font-medium text-slate-300 transition-colors hover:text-white"
                        >
                            Quay lại nhập mật khẩu 
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
