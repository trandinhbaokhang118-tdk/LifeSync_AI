import { Bell } from 'lucide-react';

export function EmptyNotifications() {
    return (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <Bell className="w-12 h-12 text-[var(--text-3)] mb-4" />
            <h3 className="text-lg font-medium text-[var(--text)] mb-2">
                No notifications
            </h3>
            <p className="text-sm text-[var(--text-2)] max-w-sm">
                You're all caught up!
            </p>
        </div>
    );
}
