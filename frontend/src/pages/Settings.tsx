import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    User,
    Mail,
    Lock,
    Camera,
    Save,
    Bell,
    Globe,
    Calendar as CalendarIcon,
} from 'lucide-react';
import { Button, Input, UserAvatar } from '../components/ui';
import { showToast } from '../components/ui/toast';
import { useAuthStore } from '../store/auth.store';
import { useDarkMode } from '../hooks/useDarkMode';
import api from '../services/api';
import type { ApiError } from '../types';

// Validation schemas
const profileSchema = z.object({
    name: z.string().min(2, 'Tên phải có ít nhất 2 ký tự'),
    email: z.string().email('Email không hợp lệ'),
});

const passwordSchema = z.object({
    currentPassword: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
    newPassword: z.string().min(6, 'Mật khẩu mới phải có ít nhất 6 ký tự'),
    confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

export function Settings() {
    const { user, setUser } = useAuthStore();
    const { darkMode, toggleDarkMode } = useDarkMode();
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);

    // Profile form
    const profileForm = useForm<ProfileFormData>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            name: user?.name || '',
            email: user?.email || '',
        },
    });

    // Password form
    const passwordForm = useForm<PasswordFormData>({
        resolver: zodResolver(passwordSchema),
    });

    // Update profile mutation
    const updateProfileMutation = useMutation({
        mutationFn: async (data: ProfileFormData) => {
            const response = await api.patch('/users/profile', data);
            return response.data;
        },
        onSuccess: (data) => {
            setUser(data.data);
            showToast.success('Cập nhật thông tin thành công');
        },
        onError: () => {
            showToast.error('Không thể cập nhật thông tin');
        },
    });

    // Change password mutation
    const changePasswordMutation = useMutation({
        mutationFn: async (data: PasswordFormData) => {
            const response = await api.patch('/users/change-password', {
                currentPassword: data.currentPassword,
                newPassword: data.newPassword,
            });
            return response.data;
        },
        onSuccess: () => {
            showToast.success('Đổi mật khẩu thành công');
            passwordForm.reset();
        },
        onError: (error: { response?: { data?: ApiError } }) => {
            const message = error.response?.data?.error?.message || 'Không thể đổi mật khẩu';
            showToast.error(message);
        },
    });

    // Upload avatar mutation
    const uploadAvatarMutation = useMutation({
        mutationFn: async (file: File) => {
            const formData = new FormData();
            formData.append('avatar', file);
            const response = await api.post('/users/avatar', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return response.data;
        },
        onSuccess: (data) => {
            setUser(data.data);
            showToast.success('Cập nhật ảnh đại diện thành công');
            setAvatarPreview(null);
            setAvatarFile(null);
        },
        onError: () => {
            showToast.error('Không thể tải ảnh lên');
        },
    });

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                showToast.error('Kích thước ảnh không được vượt quá 5MB');
                return;
            }
            setAvatarFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUploadAvatar = () => {
        if (avatarFile) {
            uploadAvatarMutation.mutate(avatarFile);
        }
    };

    const onProfileSubmit = (data: ProfileFormData) => {
        updateProfileMutation.mutate(data);
    };

    const onPasswordSubmit = (data: PasswordFormData) => {
        changePasswordMutation.mutate(data);
    };

    return (
        <div className="space-y-6 pb-20 md:pb-0">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-[var(--text)]">Cài đặt</h1>
                <p className="text-[var(--text-2)]">
                    Quản lý tài khoản và tùy chỉnh ứng dụng
                </p>
            </div>

            {/* Profile Section */}
            <div className="bg-[var(--surface-1)] border border-[var(--border)] shadow-[var(--shadow-md)] rounded-xl backdrop-blur-xl">
                <div className="p-4 border-b border-[var(--border)]">
                    <h2 className="text-lg font-semibold text-[var(--text)] flex items-center gap-2">
                        <User className="w-5 h-5" />
                        Thông tin cá nhân
                    </h2>
                </div>
                <div className="p-6 space-y-6">
                    {/* Avatar Upload */}
                    <div className="flex items-center gap-6">
                        <div className="relative">
                            {avatarPreview ? (
                                <img
                                    src={avatarPreview}
                                    alt="Avatar preview"
                                    className="w-24 h-24 rounded-full object-cover"
                                />
                            ) : user?.avatar ? (
                                <img
                                    src={user.avatar}
                                    alt={user.name}
                                    className="w-24 h-24 rounded-full object-cover"
                                />
                            ) : (
                                <UserAvatar name={user?.name || 'User'} size="xl" />
                            )}
                            <label
                                htmlFor="avatar-upload"
                                className="absolute bottom-0 right-0 p-2 bg-primary-600 hover:bg-primary-700 text-white rounded-full cursor-pointer shadow-lg transition-colors"
                            >
                                <Camera className="w-4 h-4" />
                                <input
                                    id="avatar-upload"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleAvatarChange}
                                />
                            </label>
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-medium text-[var(--text)]">
                                Ảnh đại diện
                            </h3>
                            <p className="text-sm text-[var(--text-2)] mb-3">
                                JPG, PNG hoặc GIF. Tối đa 5MB.
                            </p>
                            {avatarPreview && (
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        onClick={handleUploadAvatar}
                                        loading={uploadAvatarMutation.isPending}
                                    >
                                        Lưu ảnh
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                            setAvatarPreview(null);
                                            setAvatarFile(null);
                                        }}
                                    >
                                        Hủy
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Profile Form */}
                    <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                        <div>
                            <label className="label">
                                <User className="w-4 h-4 inline mr-1" />
                                Họ và tên
                            </label>
                            <Input
                                {...profileForm.register('name')}
                                placeholder="Nhập họ tên"
                                error={profileForm.formState.errors.name?.message}
                            />
                        </div>

                        <div>
                            <label className="label">
                                <Mail className="w-4 h-4 inline mr-1" />
                                Email
                            </label>
                            <Input
                                {...profileForm.register('email')}
                                type="email"
                                placeholder="Nhập email"
                                error={profileForm.formState.errors.email?.message}
                            />
                        </div>

                        <div className="flex items-center justify-between pt-2">
                            <span className="text-sm text-[var(--text-2)]">
                                Vai trò: <span className="font-medium text-[var(--text)]">{user?.role}</span>
                            </span>
                            <Button
                                type="submit"
                                loading={updateProfileMutation.isPending}
                                disabled={!profileForm.formState.isDirty}
                            >
                                <Save className="w-4 h-4 mr-2" />
                                Lưu thay đổi
                            </Button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Change Password Section */}
            <div className="bg-[var(--surface-1)] border border-[var(--border)] shadow-[var(--shadow-md)] rounded-xl backdrop-blur-xl">
                <div className="p-4 border-b border-[var(--border)]">
                    <h2 className="text-lg font-semibold text-[var(--text)] flex items-center gap-2">
                        <Lock className="w-5 h-5" />
                        Đổi mật khẩu
                    </h2>
                </div>
                <div className="p-6">
                    <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                        <div>
                            <label className="label">Mật khẩu hiện tại</label>
                            <Input
                                {...passwordForm.register('currentPassword')}
                                type="password"
                                placeholder="Nhập mật khẩu hiện tại"
                                error={passwordForm.formState.errors.currentPassword?.message}
                            />
                        </div>

                        <div>
                            <label className="label">Mật khẩu mới</label>
                            <Input
                                {...passwordForm.register('newPassword')}
                                type="password"
                                placeholder="Nhập mật khẩu mới"
                                error={passwordForm.formState.errors.newPassword?.message}
                            />
                        </div>

                        <div>
                            <label className="label">Xác nhận mật khẩu mới</label>
                            <Input
                                {...passwordForm.register('confirmPassword')}
                                type="password"
                                placeholder="Nhập lại mật khẩu mới"
                                error={passwordForm.formState.errors.confirmPassword?.message}
                            />
                        </div>

                        <div className="flex justify-end pt-2">
                            <Button
                                type="submit"
                                loading={changePasswordMutation.isPending}
                                disabled={!passwordForm.formState.isDirty}
                            >
                                <Lock className="w-4 h-4 mr-2" />
                                Đổi mật khẩu
                            </Button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Preferences Section */}
            <div className="bg-[var(--surface-1)] border border-[var(--border)] shadow-[var(--shadow-md)] rounded-xl backdrop-blur-xl">
                <div className="p-4 border-b border-[var(--border)]">
                    <h2 className="text-lg font-semibold text-[var(--text)]">
                        Tùy chỉnh
                    </h2>
                </div>
                <div className="divide-y divide-[var(--border)]">
                    {/* Theme */}
                    <div className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-[var(--surface-2)]">
                                {darkMode ? (
                                    <svg className="w-5 h-5 text-[var(--text-2)]" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5 text-[var(--text-2)]" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                                    </svg>
                                )}
                            </div>
                            <div>
                                <p className="font-medium text-[var(--text)]">
                                    Giao diện
                                </p>
                                <p className="text-sm text-[var(--text-2)]">
                                    {darkMode ? 'Chế độ tối' : 'Chế độ sáng'}
                                </p>
                            </div>
                        </div>
                        <Button variant="secondary" size="sm" onClick={toggleDarkMode}>
                            {darkMode ? 'Chuyển sang sáng' : 'Chuyển sang tối'}
                        </Button>
                    </div>

                    {/* Timezone */}
                    <div className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                                <Globe className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                            </div>
                            <div>
                                <p className="font-medium text-gray-900 dark:text-white">
                                    Múi giờ
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {Intl.DateTimeFormat().resolvedOptions().timeZone}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Week Start */}
                    <div className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                                <CalendarIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                            </div>
                            <div>
                                <p className="font-medium text-gray-900 dark:text-white">
                                    Tuần bắt đầu
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Thứ Hai
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Notifications */}
                    <div className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                                <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                            </div>
                            <div>
                                <p className="font-medium text-gray-900 dark:text-white">
                                    Thông báo
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Nhận thông báo về tasks và reminders
                                </p>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" defaultChecked />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                        </label>
                    </div>
                </div>
            </div>

            {/* Account Info */}
            <div className="bg-[var(--surface-1)] border border-[var(--border)] shadow-[var(--shadow-md)] rounded-xl backdrop-blur-xl">
                <div className="p-4 border-b border-[var(--border)]">
                    <h2 className="text-lg font-semibold text-[var(--text)]">
                        Thông tin tài khoản
                    </h2>
                </div>
                <div className="p-4 space-y-3">
                    <div className="flex justify-between py-2">
                        <span className="text-[var(--text-2)]">ID tài khoản</span>
                        <span className="text-[var(--text)] font-mono text-sm">
                            {user?.id?.slice(0, 8)}...
                        </span>
                    </div>
                    <div className="flex justify-between py-2">
                        <span className="text-[var(--text-2)]">Ngày tạo</span>
                        <span className="text-[var(--text)]">
                            {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : '-'}
                        </span>
                    </div>
                    <div className="flex justify-between py-2">
                        <span className="text-[var(--text-2)]">Lần đăng nhập cuối</span>
                        <span className="text-[var(--text)]">
                            {new Date().toLocaleDateString('vi-VN')}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
