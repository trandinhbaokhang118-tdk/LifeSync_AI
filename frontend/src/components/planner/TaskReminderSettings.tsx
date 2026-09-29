import { useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '../ui';
import { useAuthStore } from '../../store/auth.store';
import { useTaskReminderStore } from '../../store/task-reminders.store';
import { taskRemindersService } from '../../services/task-reminders.service';

export function TaskReminderSettings() {
    const userId = useAuthStore(s => s.user?.id);
    const settings = useTaskReminderStore();
    const client = useQueryClient();
    const [working, setWorking] = useState(false);
    const [message, setMessage] = useState('');
    const enabled = !!userId && !!settings.enabledUsers[userId];
    const toggle = async () => {
        if (!userId) return;
        setWorking(true); setMessage('');
        try {
            if (enabled) { await taskRemindersService.cancel(); settings.setEnabled(userId, false); }
            else { await taskRemindersService.enablePermission(); settings.setEnabled(userId, true); }
        } catch (e) { setMessage(e instanceof Error ? e.message : 'Không thay đổi được nhắc việc.'); }
        finally { setWorking(false); }
    };
    return <section className="rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-4 space-y-3">
        <h2 className="font-semibold">Nhắc việc trên thiết bị</h2>
        <p className="text-sm text-[var(--text-2)]">Dùng thời gian nhắc trước của từng task (mặc định 15 phút). Khi sửa giờ, hoàn thành hoặc xóa task, nhắc việc sẽ được cập nhật khi ứng dụng đồng bộ.</p>
        {Capacitor.isNativePlatform() ? <>
            <Button loading={working} onClick={toggle}>{enabled ? 'Tắt nhắc việc' : 'Bật nhắc việc'}</Button>
            {enabled && <Button variant="secondary" onClick={() => client.invalidateQueries({ queryKey: ['tasks', 'device-reminders', userId] })}>Đồng bộ lại</Button>}
            {enabled && <p className="text-sm" role="status">{settings.error || (settings.lastSync ? `Đã đặt ${settings.scheduled} lời nhắc · ${new Date(settings.lastSync).toLocaleTimeString('vi-VN')}` : 'Đang đồng bộ nhắc việc…')}</p>}
            <p className="text-xs text-[var(--text-2)]">Tối đa 60 lịch nhắc gần nhất trong 30 ngày. Mở ứng dụng để cập nhật sau khi sửa task trên thiết bị khác. Giờ thông báo có thể trễ do chế độ tiết kiệm pin hoặc quyền báo thức của hệ điều hành.</p>
        </> : <p className="text-sm">Mở ứng dụng Android/iOS để bật lời nhắc đã hẹn trên thiết bị. Bản web tiếp tục hiển thị thông báo khi đang mở ứng dụng.</p>}
        {message && <p role="alert" className="text-sm">{message}</p>}
    </section>;
}
