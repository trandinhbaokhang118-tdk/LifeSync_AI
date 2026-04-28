import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Eye, EyeOff, Lock, Mail, Shield } from 'lucide-react';
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

export function AdminLogin() {
    const [showPassword, setShowPassword] = useState(false);
    const { login, isAuthenticated, user } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();
    const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/admin';

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
    });

    const onSubmit = async (data: AdminLoginForm) => {
        try {
            const response = await api.post<ApiResponse<AuthResponse>>('/auth/login', data);
            const { accessToken, refreshToken, user: loggedInUser } = response.data.data;

            if (loggedInUser.role !== 'ADMIN') {
                showToast.error('Khong du quyen truy cap', 'Trang nay chi danh cho tai khoan admin.');
                return;
            }

            login(loggedInUser, accessToken, refreshToken);
            showToast.success('Dang nhap admin thanh cong', `Xin chao ${loggedInUser.name}`);
            navigate(getAllowedRedirectPathForUser(loggedInUser, from), { replace: true });
        } catch (err: unknown) {
            const error = err as { response?: { data?: { error?: { message?: string } } } };
            showToast.error(
                'Dang nhap that bai',
                error.response?.data?.error?.message || 'Vui long kiem tra lai thong tin.',
            );
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.2),_transparent_35%),linear-gradient(135deg,#020617_0%,#0f172a_45%,#111827_100%)] p-4">
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
                    Ve cong dang nhap nguoi dung
                </Link>

                <div className="mb-8">
                    <div className="mb-5 flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 shadow-lg shadow-cyan-500/20">
                            <Shield className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/80">Admin Portal</p>
                            <h1 className="text-2xl font-semibold text-white">TimeManager Control</h1>
                        </div>
                    </div>

                    <h2 className="text-3xl font-bold text-white">Dang nhap Admin</h2>
                    <p className="mt-2 text-sm text-slate-300">
                        Chi tai khoan ADMIN moi duoc phep truy cap khu quan tri.
                    </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-200">Email admin</label>
                        <Input
                            {...register('email')}
                            type="email"
                            placeholder="admin@timemanager.com"
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
                        Dang nhap khu admin
                    </Button>
                </form>

                <div className="mt-6 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-4 text-sm text-cyan-100">
                    <p className="font-medium">Luu y</p>
                    <p className="mt-1 text-cyan-50/80">
                        Tai khoan user thong thuong se khong vao duoc trang nay va se khong duoc tai session admin.
                    </p>
                </div>
            </div>
        </div>
    );
}
