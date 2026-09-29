import { Capacitor } from '@capacitor/core';
import type { Task } from '../types';

// A reserved ID band keeps task reminders separate from instant device notifications.
const FIRST_ID = 1_500_000_000;
const LIMIT = 60; // Leave space below iOS's 64 pending-notification limit.
let queue: Promise<unknown> = Promise.resolve();

export function reminderCandidates(tasks: Task[], now = Date.now()) {
    return tasks.filter(t => t.status !== 'DONE').map(t => ({ task: t, at: Date.parse(t.startAt) - (t.reminderMinutes ?? 15) * 60000 }))
        .filter(t => Number.isFinite(t.at) && t.at > now && t.at <= now + 30 * 86400000)
        .sort((a, b) => a.at - b.at);
}

function serialize<T>(work: () => Promise<T>): Promise<T> {
    const next = queue.catch(() => undefined).then(work);
    queue = next;
    return next;
}
export const taskRemindersService = {
    async enablePermission() {
        if (!Capacitor.isNativePlatform()) throw new Error('Nhắc việc nền chỉ có trên ứng dụng Android/iOS.');
        const { LocalNotifications } = await import('@capacitor/local-notifications');
        if ((await LocalNotifications.requestPermissions()).display !== 'granted') throw new Error('Bạn chưa cấp quyền thông báo. Hãy bật trong cài đặt thiết bị.');
    },
    cancel: () => serialize(async () => {
        if (!Capacitor.isNativePlatform()) return;
        const { LocalNotifications } = await import('@capacitor/local-notifications');
        const pending = await LocalNotifications.getPending();
        const own = pending.notifications.filter(n => n.extra?.lifesyncTaskReminder === true);
        if (own.length) await LocalNotifications.cancel({ notifications: own.map(n => ({ id: n.id })) });
    }),
    sync: (userId: string, tasks: Task[], stillCurrent: () => boolean) => serialize(async () => {
        if (!Capacitor.isNativePlatform() || !stillCurrent()) return 0;
        const { LocalNotifications } = await import('@capacitor/local-notifications');
        if ((await LocalNotifications.checkPermissions()).display !== 'granted') throw new Error('Quyền thông báo đang tắt. Hãy bật lại để nhận nhắc việc.');
        const pending = await LocalNotifications.getPending();
        const own = pending.notifications.filter(n => n.extra?.lifesyncTaskReminder === true);
        const otherIds = new Set(pending.notifications.filter(n => n.extra?.lifesyncTaskReminder !== true).map(n => n.id));
        if (own.length) await LocalNotifications.cancel({ notifications: own.map(n => ({ id: n.id })) });
        if (!stillCurrent()) return 0;
        const available = Math.max(0, LIMIT - otherIds.size);
        let nextId = FIRST_ID;
        const notifications = reminderCandidates(tasks).slice(0, available).map(({ task, at }) => {
            while (otherIds.has(nextId)) nextId++;
            return { id: nextId++, title: 'Sắp đến giờ', body: task.title, schedule: { at: new Date(at), allowWhileIdle: true }, extra: { lifesyncTaskReminder: true, userId, taskId: task.id } };
        });
        if (notifications.length) await LocalNotifications.schedule({ notifications });
        return notifications.length;
    }),
};
