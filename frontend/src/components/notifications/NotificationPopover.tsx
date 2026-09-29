import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import * as Dialog from '@radix-ui/react-dialog';
import { Bell, X } from 'lucide-react';
import { Notifications } from '../../pages/Notifications';

export function NotificationPopover({ unreadCount }: { unreadCount: number }) {
    const [searchParams, setSearchParams] = useSearchParams();
    const [open, setOpen] = useState(false);
    const fromLegacyLink = searchParams.get('notifications') === 'open';
    const onOpenChange = (next: boolean) => {
        setOpen(next);
        if (fromLegacyLink) {
            setSearchParams(current => {
                const updated = new URLSearchParams(current);
                updated.delete('notifications');
                return updated;
            }, { replace: true });
        }
    };
    return (
        <Dialog.Root modal={false} open={open || fromLegacyLink} onOpenChange={onOpenChange}>
            <Dialog.Trigger asChild>
                <button type="button" aria-label={`Thông báo${unreadCount ? `, ${unreadCount} chưa đọc` : ''}`} className="relative grid h-11 w-11 shrink-0 place-items-center rounded-full text-[var(--text-2)] transition-colors hover:bg-[var(--surface-3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && <span aria-hidden="true" className="absolute right-0 top-0 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--danger)] px-1 text-xs font-semibold text-white">{unreadCount > 99 ? '99+' : unreadCount}</span>}
                </button>
            </Dialog.Trigger>
            <Dialog.Portal>
                <Dialog.Content aria-describedby={undefined} className="fixed right-3 top-[72px] z-[105] flex max-h-[calc(100dvh-88px)] w-[calc(100%-24px)] max-w-xl flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] text-[var(--text)] shadow-[var(--shadow-lg)] focus:outline-none sm:right-4">
                    <div className="flex shrink-0 items-center justify-between border-b border-[var(--border)] px-4 py-3">
                        <Dialog.Title className="!text-lg font-semibold">Thông báo</Dialog.Title>
                        <Dialog.Close aria-label="Đóng thông báo" className="grid h-9 w-9 place-items-center rounded-full text-[var(--text-2)] hover:bg-[var(--surface-3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"><X className="h-5 w-5" /></Dialog.Close>
                    </div>
                    <div className="min-h-0 overflow-y-auto overscroll-contain p-4"><Notifications embedded /></div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
