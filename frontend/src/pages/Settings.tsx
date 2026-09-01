import { useEffect, useState } from 'react';
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
    Languages,
    ChevronDown,
} from 'lucide-react';
import { Button, Input, UserAvatar } from '../components/ui';
import { LanguageToggle } from '../components/ui/LanguageToggle';
import { showToast } from '../components/ui/toast';
import { useAuthStore } from '../store/auth.store';
import { useDarkMode } from '../hooks/useDarkMode';
import { useTranslation } from '../i18n';
import api from '../services/api';
import type { ApiError } from '../types';
import {
    getDevicePermissionState,
    requestDevicePermission,
    showDeviceNotification,
    type DevicePermissionState,
} from '../services/device-permissions.service';

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
    const { t } = useTranslation();
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [notificationPermission, setNotificationPermission] = useState<DevicePermissionState>('prompt');
    const [passwordFormOpen, setPasswordFormOpen] = useState(false);

    useEffect(() => {
        void getDevicePermissionState('notifications').then(setNotificationPermission);
    }, []);

    const enableDeviceNotifications = async () => {
        const state = await requestDevicePermission('notifications');
        setNotificationPermission(state);

        if (state === 'granted') {
            showToast.success('Đã bật thông báo thiết bị', 'Âm thanh do cài đặt thông báo của hệ điều hành điều khiển.');
            await showDeviceNotification('LifeSync AI đã sẵn sàng', 'Bạn sẽ nhận nhắc việc trực tiếp trên thiết bị này.');
        } else if (state === 'denied') {
            showToast.warning('Thông báo đang bị chặn', 'Hãy mở cài đặt quyền của trình duyệt để cho phép LifeSync AI.');
        }
    };

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
            showToast.success(t('settings.toast.profileUpdated'));
        },
        onError: () => {
            showToast.error(t('settings.toast.profileError'));
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
            showToast.success(t('settings.toast.passwordChanged'));
            passwordForm.reset();
            setPasswordFormOpen(false);
        },
        onError: (error: { response?: { data?: ApiError } }) => {
            const message = error.response?.data?.error?.message || t('settings.toast.passwordError');
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
            showToast.success(t('settings.toast.avatarUpdated'));
            setAvatarPreview(null);
            setAvatarFile(null);
        },
        onError: () => {
            showToast.error(t('settings.toast.avatarError'));
        },
    });

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                showToast.error(t('settings.toast.avatarTooLarge'));
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
                <h1 className="text-2xl font-bold text-[var(--text)]">{t('settings.title')}</h1>
                <p className="text-[var(--text-2)]">
                    {t('settings.subtitle')}
                </p>
            </div>

            {/* Profile Section */}
            <div className="bg-[var(--surface-1)] border border-[var(--border)] shadow-[var(--shadow-md)] rounded-xl backdrop-blur-xl">
                <div className="p-4 border-b border-[var(--border)]">
                    <h2 className="text-lg font-semibold text-[var(--text)] flex items-center gap-2">
                        <User className="w-5 h-5" />
                        {t('settings.profile.title')}
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
                                {t('settings.profile.avatar')}
                            </h3>
                            <p className="text-sm text-[var(--text-2)] mb-3">
                                {t('settings.profile.avatarHint')}
                            </p>
                            {avatarPreview && (
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        onClick={handleUploadAvatar}
                                        loading={uploadAvatarMutation.isPending}
                                    >
                                        {t('settings.profile.saveAvatar')}
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                            setAvatarPreview(null);
                                            setAvatarFile(null);
                                        }}
                                    >
                                        {t('common.cancel')}
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
                                {t('settings.profile.name')}
                            </label>
                            <Input
                                {...profileForm.register('name')}
                                placeholder={t('settings.profile.namePlaceholder')}
                                error={profileForm.formState.errors.name?.message}
                            />
                        </div>

                        <div>
                            <label className="label">
                                <Mail className="w-4 h-4 inline mr-1" />
                                {t('settings.profile.email')}
                            </label>
                            <Input
                                {...profileForm.register('email')}
                                type="email"
                                placeholder={t('settings.profile.emailPlaceholder')}
                                error={profileForm.formState.errors.email?.message}
                            />
                        </div>

                        <div className="flex items-center justify-between pt-2">
                            <span className="text-sm text-[var(--text-2)]">
                                {t('settings.profile.role')}: <span className="font-medium text-[var(--text)]">{user?.role}</span>
                            </span>
                            <Button
                                type="submit"
                                loading={updateProfileMutation.isPending}
                                disabled={!profileForm.formState.isDirty}
                            >
                                <Save className="w-4 h-4 mr-2" />
                                {t('common.saveChanges')}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Change Password Section */}
            <div className="bg-[var(--surface-1)] border border-[var(--border)] shadow-[var(--shadow-md)] rounded-xl backdrop-blur-xl">
                <button
                    type="button"
                    aria-expanded={passwordFormOpen}
                    aria-controls="change-password-form"
                    disabled={changePasswordMutation.isPending}
                    onClick={() => {
                        setPasswordFormOpen((isOpen) => {
                            if (isOpen) passwordForm.reset();
                            return !isOpen;
                        });
                    }}
                    className="flex w-full items-center justify-between gap-4 rounded-xl p-4 text-left transition-colors hover:bg-[var(--surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                    <span className="flex items-center gap-2 text-lg font-semibold text-[var(--text)]">
                        <Lock className="w-5 h-5" />
                        {t('settings.password.title')}
                    </span>
                    <ChevronDown
                        aria-hidden="true"
                        className={`h-5 w-5 flex-shrink-0 text-[var(--text-2)] transition-transform duration-200 ${passwordFormOpen ? 'rotate-180' : ''}`}
                    />
                </button>

                {passwordFormOpen && (
                    <div id="change-password-form" className="border-t border-[var(--border)] p-6">
                        <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                            <div>
                                <label className="label">{t('settings.password.current')}</label>
                                <Input
                                    {...passwordForm.register('currentPassword')}
                                    type="password"
                                    autoComplete="current-password"
                                    placeholder={t('settings.password.currentPlaceholder')}
                                    error={passwordForm.formState.errors.currentPassword?.message}
                                />
                            </div>

                            <div>
                                <label className="label">{t('settings.password.new')}</label>
                                <Input
                                    {...passwordForm.register('newPassword')}
                                    type="password"
                                    autoComplete="new-password"
                                    placeholder={t('settings.password.newPlaceholder')}
                                    error={passwordForm.formState.errors.newPassword?.message}
                                />
                            </div>

                            <div>
                                <label className="label">{t('settings.password.confirm')}</label>
                                <Input
                                    {...passwordForm.register('confirmPassword')}
                                    type="password"
                                    autoComplete="new-password"
                                    placeholder={t('settings.password.confirmPlaceholder')}
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
                                    {t('settings.password.submit')}
                                </Button>
                            </div>
                        </form>
                    </div>
                )}
            </div>

            {/* Preferences Section */}
            <div className="bg-[var(--surface-1)] border border-[var(--border)] shadow-[var(--shadow-md)] rounded-xl backdrop-blur-xl">
                <div className="p-4 border-b border-[var(--border)]">
                    <h2 className="text-lg font-semibold text-[var(--text)]">
                        {t('settings.preferences.title')}
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
                                    {t('settings.preferences.theme')}
                                </p>
                                <p className="text-sm text-[var(--text-2)]">
                                    {darkMode ? t('settings.preferences.darkMode') : t('settings.preferences.lightMode')}
                                </p>
                            </div>
                        </div>
                        <Button variant="secondary" size="sm" onClick={toggleDarkMode}>
                            {darkMode ? t('settings.preferences.switchToLight') : t('settings.preferences.switchToDark')}
                        </Button>
                    </div>

                    {/* Language */}
                    <div className="p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-[var(--surface-2)]">
                                <Languages className="w-5 h-5 text-[var(--text-2)]" />
                            </div>
                            <div>
                                <p className="font-medium text-[var(--text)]">
                                    {t('settings.preferences.language')}
                                </p>
                                <p className="text-sm text-[var(--text-2)]">
                                    {t('settings.preferences.languageHint')}
                                </p>
                            </div>
                        </div>
                        <LanguageToggle />
                    </div>

                    {/* Timezone */}
                    <div className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-[var(--surface-2)]">
                                <Globe className="w-5 h-5 text-[var(--text-2)]" />
                            </div>
                            <div>
                                <p className="font-medium text-[var(--text)]">
                                    {t('settings.preferences.timezone')}
                                </p>
                                <p className="text-sm text-[var(--text-2)]">
                                    {Intl.DateTimeFormat().resolvedOptions().timeZone}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Week Start */}
                    <div className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-[var(--surface-2)]">
                                <CalendarIcon className="w-5 h-5 text-[var(--text-2)]" />
                            </div>
                            <div>
                                <p className="font-medium text-[var(--text)]">
                                    {t('settings.preferences.weekStart')}
                                </p>
                                <p className="text-sm text-[var(--text-2)]">
                                    {t('settings.preferences.monday')}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Notifications */}
                    <div className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-[var(--surface-2)]">
                                <Bell className="w-5 h-5 text-[var(--text-2)]" />
                            </div>
                            <div>
                                <p className="font-medium text-[var(--text)]">
                                    {t('settings.preferences.notifications')}
                                </p>
                                <p className="text-sm text-[var(--text-2)]">
                                    {t('settings.preferences.notificationsHint')}
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => void enableDeviceNotifications()}
                            disabled={notificationPermission === 'granted' || notificationPermission === 'unsupported'}
                            className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-xs font-semibold text-[var(--text)] transition-colors hover:bg-[var(--surface-3)] disabled:cursor-default disabled:opacity-70"
                        >
                            {notificationPermission === 'granted' ? 'Đã bật' : notificationPermission === 'denied' ? 'Mở cài đặt' : 'Cho phép'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Account Info */}
            <div className="bg-[var(--surface-1)] border border-[var(--border)] shadow-[var(--shadow-md)] rounded-xl backdrop-blur-xl">
                <div className="p-4 border-b border-[var(--border)]">
                    <h2 className="text-lg font-semibold text-[var(--text)]">
                        {t('settings.account.title')}
                    </h2>
                </div>
                <div className="p-4 space-y-3">
                    <div className="flex justify-between py-2">
                        <span className="text-[var(--text-2)]">{t('settings.account.id')}</span>
                        <span className="text-[var(--text)] font-mono text-sm">
                            {user?.id?.slice(0, 8)}...
                        </span>
                    </div>
                    <div className="flex justify-between py-2">
                        <span className="text-[var(--text-2)]">{t('settings.account.createdAt')}</span>
                        <span className="text-[var(--text)]">
                            {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : '-'}
                        </span>
                    </div>
                    <div className="flex justify-between py-2">
                        <span className="text-[var(--text-2)]">{t('settings.account.lastLogin')}</span>
                        <span className="text-[var(--text)]">
                            {new Date().toLocaleDateString('vi-VN')}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
