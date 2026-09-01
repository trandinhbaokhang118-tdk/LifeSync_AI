import { useEffect, useState } from 'react';
import { Bell, Camera, Check, FolderOpen, Loader2, MapPin, ShieldCheck } from 'lucide-react';
import { Button, Modal } from '../ui';
import { useAuthStore } from '../../store/auth.store';
import {
    getDevicePermissionState,
    requestDevicePermission,
    type DevicePermission,
    type DevicePermissionState,
} from '../../services/device-permissions.service';
import { cn } from '../../lib/utils';

const permissionItems: Array<{
    id: DevicePermission;
    title: string;
    description: string;
    icon: typeof Bell;
}> = [
    { id: 'notifications', title: 'Thông báo thiết bị', description: 'Nhắc task qua hệ thống và âm thanh của laptop/điện thoại.', icon: Bell },
    { id: 'location', title: 'Vị trí', description: 'Chỉ dùng khi Track Lab ghi GPS hoặc tìm tuyến đường.', icon: MapPin },
    { id: 'camera', title: 'Camera', description: 'Chỉ bật khi bạn chụp ảnh hồ sơ hoặc hoạt động.', icon: Camera },
    { id: 'storage', title: 'Ảnh và tệp', description: 'Chỉ đọc đúng tệp bạn chủ động chọn, không đọc toàn bộ bộ nhớ.', icon: FolderOpen },
];

const stateLabels: Record<DevicePermissionState, string> = {
    granted: 'Đã cho phép',
    denied: 'Đã chặn',
    prompt: 'Chưa thiết lập',
    unsupported: 'Không hỗ trợ',
    contextual: 'Hỏi khi sử dụng',
};

export function DevicePermissionCenter() {
    const userId = useAuthStore((state) => state.user?.id);
    const [open, setOpen] = useState(false);
    const [states, setStates] = useState<Record<DevicePermission, DevicePermissionState>>({
        notifications: 'prompt',
        location: 'prompt',
        camera: 'prompt',
        storage: 'contextual',
    });
    const [requesting, setRequesting] = useState<DevicePermission | null>(null);

    useEffect(() => {
        if (!userId) {
            return;
        }

        const storageKey = `lifesync-permissions-intro:${userId}`;
        setOpen(localStorage.getItem(storageKey) !== 'seen');

        void Promise.all(permissionItems.map(async ({ id }) => [id, await getDevicePermissionState(id)] as const))
            .then((entries) => setStates(Object.fromEntries(entries) as Record<DevicePermission, DevicePermissionState>));
    }, [userId]);

    const close = () => {
        if (userId) {
            localStorage.setItem(`lifesync-permissions-intro:${userId}`, 'seen');
        }
        setOpen(false);
    };

    const request = async (permission: DevicePermission) => {
        if (permission === 'storage') {
            return;
        }

        setRequesting(permission);
        try {
            const state = await requestDevicePermission(permission);
            setStates((current) => ({ ...current, [permission]: state }));
        } finally {
            setRequesting(null);
        }
    };

    return (
        <Modal isOpen={open} onClose={close} title="Quyền riêng tư trên thiết bị" size="lg">
            <div className="space-y-4">
                <div className="flex gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-3">
                    <ShieldCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-[var(--primary)]" />
                    <p className="text-sm leading-6 text-[var(--text-2)]">
                        LifeSync chỉ xin quyền khi có lý do rõ ràng. Bạn có thể bỏ qua và ứng dụng sẽ hỏi lại khi mở đúng tính năng cần quyền.
                    </p>
                </div>

                <div className="space-y-2">
                    {permissionItems.map((item) => {
                        const Icon = item.icon;
                        const state = states[item.id];
                        const canRequest = state === 'prompt';

                        return (
                            <div key={item.id} className="flex items-center gap-3 rounded-xl border border-[var(--border)] p-3">
                                <div className="rounded-lg bg-[var(--surface-3)] p-2 text-[var(--text-2)]">
                                    <Icon className="h-5 w-5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="font-medium text-[var(--text)]">{item.title}</p>
                                    <p className="text-xs leading-5 text-[var(--text-2)]">{item.description}</p>
                                </div>
                                <button
                                    type="button"
                                    disabled={!canRequest || requesting !== null}
                                    onClick={() => void request(item.id)}
                                    className={cn(
                                        'flex min-w-24 items-center justify-center gap-1 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors',
                                        canRequest
                                            ? 'bg-[var(--primary)] text-white hover:opacity-90'
                                            : 'bg-[var(--surface-3)] text-[var(--text-2)]',
                                    )}
                                >
                                    {requesting === item.id && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                    {state === 'granted' && <Check className="h-3.5 w-3.5" />}
                                    {stateLabels[state]}
                                </button>
                            </div>
                        );
                    })}
                </div>

                <div className="flex justify-end">
                    <Button type="button" onClick={close}>Tiếp tục vào LifeSync</Button>
                </div>
            </div>
        </Modal>
    );
}
