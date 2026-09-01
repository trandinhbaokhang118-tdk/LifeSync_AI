import { useEffect, useState, type FormEvent } from 'react';
import type { AxiosError } from 'axios';
import { UserPlus, Edit, Trash2, Shield, Users, Crown, Save, X } from 'lucide-react';
import '../../admin-theme.css';
import { showToast } from '../../components/ui/toast';
import api from '../../services/api';
import { includesNormalizedVietnamese } from '../../lib/utils';
import { useAuthStore } from '../../store/auth.store';
import type { ApiResponse, UserRole } from '../../types';

interface User {
    id: string;
    name: string;
    email: string;
    phone?: string;
    role: UserRole;
    createdAt: string;
    updatedAt: string;
}

interface EditUserForm {
    name: string;
    email: string;
    phone: string;
}

interface ApiErrorBody {
    error?: {
        message?: string;
    };
    message?: string | string[];
}

const emptyEditForm: EditUserForm = {
    name: '',
    email: '',
    phone: '',
};

function getApiErrorMessage(error: unknown, fallback: string) {
    const axiosError = error as AxiosError<ApiErrorBody>;
    const message = axiosError.response?.data?.error?.message ?? axiosError.response?.data?.message;

    if (Array.isArray(message)) {
        return message.join(', ');
    }

    return message || fallback;
}

export function UserManagement() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [editForm, setEditForm] = useState<EditUserForm>(emptyEditForm);
    const [savingEdit, setSavingEdit] = useState(false);
    const { user: currentUser, setUser: setCurrentUser } = useAuthStore();

    useEffect(() => {
        void fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await api.get('/admin/users');
            setUsers(response.data.data);
        } catch {
            showToast.error('Lỗi', 'Không thể tải danh sách người dùng');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (!confirm('Bạn có chắc muốn xóa người dùng này?')) return;

        try {
            await api.delete(`/admin/users/${userId}`);
            setUsers((currentUsers) => currentUsers.filter((u) => u.id !== userId));
            showToast.success('Thành công', 'Đã xóa người dùng');
        } catch {
            showToast.error('Lỗi', 'Không thể xóa người dùng');
        }
    };

    const handleToggleRole = async (userId: string, currentRole: UserRole) => {
        const newRole: UserRole = currentRole === 'ADMIN' ? 'USER' : 'ADMIN';

        try {
            await api.patch(`/admin/users/${userId}/role`, { role: newRole });
            setUsers((currentUsers) =>
                currentUsers.map((u) => (u.id === userId ? { ...u, role: newRole } : u)),
            );
            showToast.success('Thành công', `Đã cập nhật quyền thành ${newRole}`);
        } catch {
            showToast.error('Lỗi', 'Không thể cập nhật quyền');
        }
    };

    const openEditUser = (user: User) => {
        setEditingUser(user);
        setEditForm({
            name: user.name,
            email: user.email,
            phone: user.phone ?? '',
        });
    };

    const closeEditUser = () => {
        if (savingEdit) return;

        setEditingUser(null);
        setEditForm(emptyEditForm);
    };

    const updateEditForm = (field: keyof EditUserForm, value: string) => {
        setEditForm((currentForm) => ({
            ...currentForm,
            [field]: value,
        }));
    };

    const handleUpdateUser = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!editingUser || savingEdit) return;

        const payload = {
            name: editForm.name.trim(),
            email: editForm.email.trim().toLowerCase(),
            phone: editForm.phone.trim(),
        };

        if (!payload.name || !payload.email) {
            showToast.error('Lỗi', 'Vui lòng nhập đầy đủ tên và email');
            return;
        }

        setSavingEdit(true);

        try {
            const response = await api.patch<ApiResponse<User>>(`/admin/users/${editingUser.id}`, payload);
            const updatedUser = response.data.data;

            setUsers((currentUsers) =>
                currentUsers.map((user) => (user.id === updatedUser.id ? updatedUser : user)),
            );

            if (currentUser?.id === updatedUser.id) {
                setCurrentUser({
                    ...currentUser,
                    name: updatedUser.name,
                    email: updatedUser.email,
                    phone: updatedUser.phone,
                    role: updatedUser.role,
                    updatedAt: updatedUser.updatedAt,
                });
            }

            setEditingUser(null);
            setEditForm(emptyEditForm);
            showToast.success('Thành công', 'Đã cập nhật tài khoản');
        } catch (error) {
            showToast.error('Lỗi', getApiErrorMessage(error, 'Không thể cập nhật tài khoản'));
        } finally {
            setSavingEdit(false);
        }
    };

    const getRoleBadgeClass = (role: UserRole) => {
        if (role === 'ADMIN') return 'admin-badge-purple';
        if (role === 'MODERATOR') return 'admin-badge-warning';
        return '';
    };

    const getRoleIcon = (role: UserRole) => {
        if (role === 'ADMIN') return <Crown className="w-3 h-3" />;
        if (role === 'MODERATOR') return <Shield className="w-3 h-3" />;
        return <Users className="w-3 h-3" />;
    };

    const getRoleLabel = (role: UserRole) => {
        if (role === 'ADMIN') return 'Admin';
        if (role === 'MODERATOR') return 'Moderator';
        return 'User';
    };

    const filteredUsers = users.filter(
        (user) =>
            includesNormalizedVietnamese(user.name, searchQuery) ||
            includesNormalizedVietnamese(user.email, searchQuery),
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gradient-to-br dark:from-[#0C1929] dark:via-[#0F2744] dark:to-[#0C1929] flex items-center justify-center">
                <div className="relative">
                    <div className="w-12 h-12 border-4 border-cyan-500/20 rounded-full animate-spin"></div>
                    <div className="absolute top-0 left-0 w-12 h-12 border-4 border-cyan-500 rounded-full border-t-transparent"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-theme admin-container p-6 md:p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="admin-title mb-2">Quản lý người dùng</h1>
                    <p className="admin-title-sub">{users.length} người dùng trong hệ thống</p>
                </div>
                <button className="admin-btn admin-btn-primary">
                    <UserPlus className="w-5 h-5" />
                    Thêm người dùng
                </button>
            </div>

            <div className="admin-glass-card p-4 mb-6">
                <input
                    className="admin-input"
                    placeholder="Tìm kiếm theo tên hoặc email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            <div className="admin-glass-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Người dùng</th>
                                <th>Email</th>
                                <th>Số điện thoại</th>
                                <th>Quyền</th>
                                <th>Ngày tạo</th>
                                <th>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map((user) => (
                                <tr key={user.id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div className="admin-avatar">
                                                {user.name.charAt(0).toUpperCase()}
                                            </div>
                                            <span style={{ fontWeight: 500 }}>{user.name}</span>
                                        </div>
                                    </td>
                                    <td>{user.email}</td>
                                    <td>{user.phone || '-'}</td>
                                    <td>
                                        <span className={`admin-badge ${getRoleBadgeClass(user.role)}`}>
                                            {getRoleIcon(user.role)}
                                            {getRoleLabel(user.role)}
                                        </span>
                                    </td>
                                    <td>{new Date(user.createdAt).toLocaleDateString('vi-VN')}</td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                                            <button
                                                type="button"
                                                onClick={() => handleToggleRole(user.id, user.role)}
                                                className="admin-btn admin-btn-secondary"
                                                aria-label={`Đổi quyền ${user.name}`}
                                                title="Đổi quyền"
                                            >
                                                <Shield className="w-4 h-4" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => openEditUser(user)}
                                                className="admin-btn admin-btn-secondary"
                                                aria-label={`Sửa ${user.name}`}
                                                title="Sửa tài khoản"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteUser(user.id)}
                                                className="admin-btn admin-btn-danger"
                                                aria-label={`Xóa ${user.name}`}
                                                title="Xóa tài khoản"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {editingUser && (
                <div
                    className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="edit-user-title"
                >
                    <form onSubmit={handleUpdateUser} className="admin-glass-card w-full max-w-lg p-6 shadow-2xl">
                        <div className="mb-6 flex items-start justify-between gap-4">
                            <div>
                                <h2 id="edit-user-title" className="text-xl font-semibold text-white">
                                    Chỉnh sửa tài khoản
                                </h2>
                                <p className="mt-1 text-sm text-[var(--admin-text-muted)]">{editingUser.email}</p>
                            </div>
                            <button
                                type="button"
                                onClick={closeEditUser}
                                disabled={savingEdit}
                                className="admin-btn admin-btn-secondary !px-3 !py-3 disabled:cursor-not-allowed disabled:opacity-60"
                                aria-label="Đóng"
                                title="Đóng"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <label className="block">
                                <span className="mb-2 block text-sm font-semibold text-[var(--admin-text-secondary)]">
                                    Tên người dùng
                                </span>
                                <input
                                    className="admin-input"
                                    value={editForm.name}
                                    onChange={(event) => updateEditForm('name', event.target.value)}
                                    minLength={2}
                                    maxLength={120}
                                    required
                                    autoFocus
                                    autoComplete="name"
                                />
                            </label>

                            <label className="block">
                                <span className="mb-2 block text-sm font-semibold text-[var(--admin-text-secondary)]">
                                    Email
                                </span>
                                <input
                                    className="admin-input"
                                    type="email"
                                    value={editForm.email}
                                    onChange={(event) => updateEditForm('email', event.target.value)}
                                    maxLength={191}
                                    required
                                    autoComplete="email"
                                />
                            </label>

                            <label className="block">
                                <span className="mb-2 block text-sm font-semibold text-[var(--admin-text-secondary)]">
                                    Số điện thoại
                                </span>
                                <input
                                    className="admin-input"
                                    value={editForm.phone}
                                    onChange={(event) => updateEditForm('phone', event.target.value)}
                                    maxLength={32}
                                    autoComplete="tel"
                                />
                            </label>
                        </div>

                        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                            <button
                                type="button"
                                onClick={closeEditUser}
                                disabled={savingEdit}
                                className="admin-btn admin-btn-secondary disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                Hủy
                            </button>
                            <button
                                type="submit"
                                disabled={savingEdit}
                                className="admin-btn admin-btn-primary disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <Save className="h-4 w-4" />
                                {savingEdit ? 'Đang lưu...' : 'Lưu thay đổi'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
