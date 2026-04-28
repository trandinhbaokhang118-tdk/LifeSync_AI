import { useEffect, useState } from 'react';
import { UserPlus, Edit, Trash2, Shield, Users, Crown } from 'lucide-react';
import '../../admin-theme.css';
import { showToast } from '../../components/ui/toast';
import api from '../../services/api';

interface User {
    id: string;
    name: string;
    email: string;
    phone?: string;
    role: 'USER' | 'ADMIN';
    createdAt: string;
    updatedAt: string;
}

export function UserManagement() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

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

    const handleToggleRole = async (userId: string, currentRole: string) => {
        const newRole = currentRole === 'ADMIN' ? 'USER' : 'ADMIN';

        try {
            await api.patch(`/admin/users/${userId}/role`, { role: newRole });
            setUsers((currentUsers) =>
                currentUsers.map((u) => (u.id === userId ? { ...u, role: newRole as 'USER' | 'ADMIN' } : u)),
            );
            showToast.success('Thành công', `Đã cập nhật quyền thành ${newRole}`);
        } catch {
            showToast.error('Lỗi', 'Không thể cập nhật quyền');
        }
    };

    const filteredUsers = users.filter(
        (user) =>
            user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase()),
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
                                        <span className={`admin-badge ${user.role === 'ADMIN' ? 'admin-badge-purple' : ''}`}>
                                            {user.role === 'ADMIN' ? <Crown className="w-3 h-3" /> : <Users className="w-3 h-3" />}
                                            {user.role === 'ADMIN' ? 'Admin' : 'User'}
                                        </span>
                                    </td>
                                    <td>{new Date(user.createdAt).toLocaleDateString('vi-VN')}</td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                                            <button
                                                onClick={() => handleToggleRole(user.id, user.role)}
                                                className="admin-btn admin-btn-secondary"
                                            >
                                                <Shield className="w-4 h-4" />
                                            </button>
                                            <button className="admin-btn admin-btn-secondary">
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteUser(user.id)}
                                                className="admin-btn admin-btn-danger"
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
        </div>
    );
}
