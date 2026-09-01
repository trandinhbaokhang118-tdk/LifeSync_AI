import { useEffect, useMemo, useState } from 'react';
import { Filter, Download, Activity, Clock, User, FileText, Shield } from 'lucide-react';
import '../../admin-theme.css';
import api from '../../services/api';
import { showToast } from '../../components/ui/toast';
import { includesNormalizedVietnamese, normalizeVietnameseText } from '../../lib/utils';

interface Log {
    id: string;
    userId: string;
    userName: string;
    action: string;
    details: string;
    timestamp: string;
    ipAddress: string;
}

export function ActivityLogs() {
    const [logs, setLogs] = useState<Log[]>([]);
    const [filter, setFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        const loadLogs = async () => {
            try {
                const response = await api.get('/admin/activity-logs');
                if (mounted) {
                    setLogs(response.data.data);
                }
            } catch {
                showToast.error('Lỗi', 'Không thể tải nhật ký hoạt động');
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        void loadLogs();

        return () => {
            mounted = false;
        };
    }, []);

    const filteredLogs = useMemo(() => {
        const normalizedQuery = normalizeVietnameseText(searchQuery);

        return logs.filter((log) => {
            const matchesFilter =
                filter === 'all' ||
                (filter === 'login' && log.action.includes('LOGIN')) ||
                (filter === 'task' && log.action.includes('TASK')) ||
                (filter === 'profile' && log.action.includes('PROFILE'));

            const matchesSearch =
                includesNormalizedVietnamese(log.userName, normalizedQuery) ||
                includesNormalizedVietnamese(log.action, normalizedQuery) ||
                includesNormalizedVietnamese(log.details, normalizedQuery);

            return matchesFilter && matchesSearch;
        });
    }, [filter, logs, searchQuery]);

    const handleExport = () => {
        const csvRows = [
            ['timestamp', 'userName', 'action', 'details', 'ipAddress'].join(','),
            ...filteredLogs.map((log) =>
                [
                    log.timestamp,
                    log.userName,
                    log.action,
                    `"${log.details.replaceAll('"', '""')}"`,
                    log.ipAddress,
                ].join(','),
            ),
        ];

        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'activity-logs.csv';
        link.click();
        URL.revokeObjectURL(url);
    };

    const getActionIcon = (action: string) => {
        switch (action) {
            case 'LOGIN':
            case 'REGISTER':
                return <Shield className="w-4 h-4" />;
            case 'CREATE_TASK':
            case 'UPDATE_TASK':
                return <FileText className="w-4 h-4" />;
            case 'UPDATE_PROFILE':
                return <User className="w-4 h-4" />;
            case 'DELETE_TASK':
                return <Activity className="w-4 h-4" />;
            default:
                return <Activity className="w-4 h-4" />;
        }
    };

    const getActionColor = (action: string) => {
        switch (action) {
            case 'LOGIN':
            case 'REGISTER':
                return 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400 border-green-200 dark:border-green-500/30';
            case 'CREATE_TASK':
            case 'UPDATE_TASK':
                return 'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-400 border-cyan-200 dark:border-cyan-500/30';
            case 'UPDATE_PROFILE':
                return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400 border-yellow-200 dark:border-yellow-500/30';
            case 'DELETE_TASK':
                return 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 border-red-200 dark:border-red-500/30';
            default:
                return 'bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-400 border-gray-200 dark:border-gray-500/30';
        }
    };

    return (
        <div className="admin-theme admin-container p-6 md:p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="admin-title mb-2">Nhật ký hoạt động</h1>
                    <p className="admin-title-sub">Theo dõi mọi hoạt động trong hệ thống</p>
                </div>
                <button className="admin-btn admin-btn-primary" onClick={handleExport}>
                    <Download className="w-5 h-5" />
                    Xuất báo cáo
                </button>
            </div>

            <div className="admin-glass-card p-4 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <input
                            type="text"
                            placeholder="Tìm kiếm..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="admin-input"
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <Filter className="w-5 h-5" style={{ color: 'var(--admin-text-muted)' }} />
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="admin-select"
                        >
                            <option value="all">Tất cả hoạt động</option>
                            <option value="login">Đăng nhập</option>
                            <option value="task">Công việc</option>
                            <option value="profile">Hồ sơ</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="admin-glass-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Thời gian</th>
                                <th>Người dùng</th>
                                <th>Hành động</th>
                                <th>Chi tiết</th>
                                <th>IP Address</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-sm opacity-70">
                                        Đang tải dữ liệu...
                                    </td>
                                </tr>
                            )}
                            {!loading && filteredLogs.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-sm opacity-70">
                                        Không có hoạt động phù hợp.
                                    </td>
                                </tr>
                            )}
                            {!loading &&
                                filteredLogs.map((log) => (
                                    <tr key={log.id}>
                                        <td>
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-4 h-4" style={{ color: 'var(--admin-neon-primary)', opacity: 0.5 }} />
                                                {new Date(log.timestamp).toLocaleString('vi-VN')}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-3">
                                                <div className="admin-avatar">
                                                    {log.userName.charAt(0).toUpperCase()}
                                                </div>
                                                <span>{log.userName}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span
                                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${getActionColor(log.action)}`}
                                            >
                                                {getActionIcon(log.action)}
                                                {log.action}
                                            </span>
                                        </td>
                                        <td>{log.details}</td>
                                        <td>
                                            <span className="font-mono">{log.ipAddress}</span>
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
