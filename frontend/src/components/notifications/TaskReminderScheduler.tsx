import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Capacitor } from '@capacitor/core';
import { useAuthStore } from '../../store/auth.store';
import { useTaskReminderStore } from '../../store/task-reminders.store';
import { tasksService } from '../../services/tasks.service';
import { taskRemindersService } from '../../services/task-reminders.service';

export function TaskReminderScheduler() {
    const userId = useAuthStore(s => s.user?.id);
    const enabled = useTaskReminderStore(s => !!userId && !!s.enabledUsers[userId]);
    const active = enabled && Capacitor.isNativePlatform();
    const tasks = useQuery({ queryKey: ['tasks', 'device-reminders', userId], queryFn: tasksService.getCalendarTasks, enabled: active, staleTime: 30000, refetchInterval: 60000, refetchOnWindowFocus: 'always', retry: false });
    useEffect(() => () => { void taskRemindersService.cancel().catch(() => undefined); }, [userId, active]);
    useEffect(() => {
        if (!active || !userId) { void taskRemindersService.cancel().catch(() => useTaskReminderStore.getState().report(0, 'Không hủy được nhắc việc trên thiết bị.')); return; }
        if (tasks.isError) { useTaskReminderStore.getState().report(0, 'Không tải được task mới. Nhắc việc trên máy chưa được cập nhật.'); return; }
        if (!tasks.data) return;
        let current = true;
        const stillCurrent = () => current && useAuthStore.getState().user?.id === userId && !!useTaskReminderStore.getState().enabledUsers[userId];
        void taskRemindersService.sync(userId, tasks.data, stillCurrent).then(count => { if (stillCurrent()) useTaskReminderStore.getState().report(count); })
            .catch(() => { if (stillCurrent()) useTaskReminderStore.getState().report(0, 'Không đặt được nhắc việc. Kiểm tra quyền thông báo và thử đồng bộ lại.'); });
        return () => { current = false; };
    }, [active, userId, tasks.data, tasks.dataUpdatedAt, tasks.isError]);
    return null;
}
