import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ReminderSettings {
    enabledUsers: Record<string, boolean>;
    lastSync: string | null;
    error: string;
    scheduled: number;
    setEnabled: (userId: string, enabled: boolean) => void;
    report: (scheduled: number, error?: string) => void;
}
export const useTaskReminderStore = create<ReminderSettings>()(persist((set) => ({
    enabledUsers: {}, lastSync: null, error: '', scheduled: 0,
    setEnabled: (userId, enabled) => set(s => ({ enabledUsers: { ...s.enabledUsers, [userId]: enabled }, error: '', lastSync: null, scheduled: 0 })),
    report: (scheduled, error = '') => set({ scheduled, error, lastSync: error ? null : new Date().toISOString() }),
}), { name: 'lifesync-task-reminders', partialize: s => ({ enabledUsers: s.enabledUsers }) }));
