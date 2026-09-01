import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Check, CheckCheck, Clock } from 'lucide-react';
import { Button, Badge, SkeletonList, EmptyNotifications, ErrorState } from '../components/ui';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { useNotificationStore } from '../store/notification.store';
import { notificationsService } from '../services/notifications.service';
import { showToast } from '../components/ui/toast';
import { cn, formatDateTime } from '../lib/utils';
import type { Notification } from '../types';

export function Notifications() {
    const queryClient = useQueryClient();
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotificationStore();

    const { isLoading, isError, refetch } = useQuery({
        queryKey: ['notifications'],
        queryFn: () => notificationsService.getAll(1, 50),
    });

    const markAsReadMutation = useMutation({
        mutationFn: notificationsService.markAsRead,
        onSuccess: (_, id) => {
            markAsRead(id);
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
        onError: () => showToast.error('Không thể đánh dấu đã đọc'),
    });

    const markAllAsReadMutation = useMutation({
        mutationFn: notificationsService.markAllAsRead,
        onSuccess: () => {
            markAllAsRead();
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            showToast.success('Đã đánh dấu tất cả là đã đọc');
        },
        onError: () => showToast.error('Không thể đánh dấu tất cả'),
    });

    const unreadNotifications = notifications.filter(n => !n.readAt);

    if (isError) {
        return <ErrorState onRetry={refetch} />;
    }

    return (
        <div className="space-y-6 pb-20 md:pb-0">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text)]">Thông báo</h1>
                    <div className="mt-1 flex items-center gap-2">
                        <p className="text-[var(--text-2)]">
                            {unreadCount > 0 ? 'Bạn có thông báo mới cần xem' : 'Bạn đã xem hết thông báo'}
                        </p>
                        {unreadCount > 0 && (
                            <Badge variant="primary" className="px-2.5 py-0.5 shadow-[var(--shadow-sm)]">
                                {unreadCount} chưa đọc
                            </Badge>
                        )}
                    </div>
                </div>
                {unreadCount > 0 && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => markAllAsReadMutation.mutate()}
                        loading={markAllAsReadMutation.isPending}
                    >
                        <CheckCheck className="w-4 h-4 mr-2" />
                        Đánh dấu tất cả
                    </Button>
                )}
            </div>

            {/* Tabs */}
            <Tabs defaultValue="all" className="w-full">
                <TabsList>
                    <TabsTrigger value="all">
                        Tất cả
                        {notifications.length > 0 && (
                            <Badge variant="default" className="ml-2 px-2 py-0.5">
                                {notifications.length}
                            </Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="unread">
                        Chưa đọc
                        {unreadCount > 0 && (
                            <Badge variant="primary" className="ml-2 px-2 py-0.5 shadow-[var(--shadow-sm)]">
                                {unreadCount}
                            </Badge>
                        )}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="mt-6">
                    {isLoading ? (
                        <SkeletonList count={5} />
                    ) : notifications.length === 0 ? (
                        <EmptyNotifications />
                    ) : (
                        <div className="space-y-2">
                            {notifications.map((notification) => (
                                <NotificationCard
                                    key={notification.id}
                                    notification={notification}
                                    onMarkAsRead={() => markAsReadMutation.mutate(notification.id)}
                                />
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="unread" className="mt-6">
                    {isLoading ? (
                        <SkeletonList count={5} />
                    ) : unreadNotifications.length === 0 ? (
                        <EmptyNotifications />
                    ) : (
                        <div className="space-y-2">
                            {unreadNotifications.map((notification) => (
                                <NotificationCard
                                    key={notification.id}
                                    notification={notification}
                                    onMarkAsRead={() => markAsReadMutation.mutate(notification.id)}
                                />
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}

// Notification Card Component
interface NotificationCardProps {
    notification: Notification;
    onMarkAsRead: () => void;
}

function NotificationCard({ notification, onMarkAsRead }: NotificationCardProps) {
    const isUnread = !notification.readAt;

    return (
        <div
            className={cn(
                'relative overflow-hidden rounded-2xl border p-4 backdrop-blur-xl transition-all duration-200',
                isUnread
                    ? 'border-[var(--surface-highlight-border)] bg-[linear-gradient(135deg,var(--surface-highlight),var(--surface-1)_65%)] shadow-[var(--shadow-md)] hover:-translate-y-0.5 hover:border-[var(--primary)] hover:shadow-[var(--shadow-lg)]'
                    : 'border-[var(--border)] bg-[var(--surface-1)] opacity-90 shadow-[var(--shadow-sm)] hover:opacity-100 hover:shadow-[var(--shadow-md)]'
            )}
        >
            {isUnread && (
                <span className="absolute inset-y-0 left-0 w-1 bg-[var(--primary)]" aria-hidden="true" />
            )}
            <div className="flex items-start gap-4">
                <div
                    className={cn(
                        'flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border',
                        isUnread
                            ? 'border-[var(--surface-highlight-border)] bg-[var(--surface-highlight)] text-[var(--primary)] shadow-[var(--shadow-sm)]'
                            : 'border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-3)]'
                    )}
                >
                    <Bell
                        className="h-5 w-5"
                    />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="mb-1 flex items-start justify-between gap-3">
                        <h3
                            className={cn(
                                'leading-6',
                                isUnread
                                    ? 'font-semibold text-[var(--text)]'
                                    : 'text-[var(--text-2)]'
                            )}
                        >
                            {notification.title}
                        </h3>
                        <Badge
                            variant={isUnread ? 'primary' : 'default'}
                            className="flex-shrink-0 px-2.5 py-0.5"
                        >
                            {isUnread ? 'Chưa đọc' : 'Đã đọc'}
                        </Badge>
                    </div>

                    <p className={cn('mb-3 text-sm leading-6', isUnread ? 'text-[var(--text-2)]' : 'text-[var(--text-3)]')}>
                        {notification.message}
                    </p>

                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border)] pt-3">
                        <div className="flex items-center gap-1 text-xs text-[var(--text-3)]">
                            <Clock className="w-3 h-3" />
                            {formatDateTime(notification.createdAt)}
                        </div>

                        {isUnread && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onMarkAsRead}
                                className="h-8 border border-[var(--surface-highlight-border)] bg-[var(--surface-highlight)] px-3 text-xs font-semibold text-[var(--primary)] hover:border-[var(--primary)]"
                            >
                                <Check className="w-3 h-3 mr-1" />
                                Đánh dấu đã đọc
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
