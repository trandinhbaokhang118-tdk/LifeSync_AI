import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { Button } from '../ui';
import { googleCalendarService } from '../../services/google-calendar.service';
import { useAuthStore } from '../../store/auth.store';
import type { ApiError } from '../../types';

export function GoogleCalendarConnection() {
    const userId = useAuthStore(s => s.user?.id);
    const [params, setParams] = useSearchParams();
    const started = useRef(false);
    const client = useQueryClient();
    const [message, setMessage] = useState('');
    const [finishing, setFinishing] = useState(false);
    const status = useQuery({ queryKey: ['google-calendar', 'status', userId], queryFn: googleCalendarService.status, enabled: !!userId, retry: false });
    const refresh = () => client.invalidateQueries({ queryKey: ['google-calendar'] });
    const errorMessage = (e: { response?: { data?: ApiError } }) => setMessage(e.response?.data?.error.message || 'Không kết nối được Google Calendar. Hãy thử lại.');
    const connect = useMutation({ mutationFn: googleCalendarService.connect, onSuccess: result => { window.location.assign(result.url); }, onError: errorMessage });
    const disconnect = useMutation({ mutationFn: googleCalendarService.disconnect, onSuccess: result => {
        setMessage(result.revoked ? 'Đã ngắt kết nối Google Calendar.' : 'Đã gỡ kết nối trong LifeSync. Bạn có thể thu hồi quyền còn lại tại myaccount.google.com/permissions.');
        void refresh();
    }, onError: errorMessage });
    useEffect(() => {
        const state = params.get('state'), code = params.get('code'), denied = params.get('error');
        if (started.current || !state || (!code && !denied) || !userId) return;
        started.current = true;
        const clean = new URLSearchParams(params);
        ['state', 'code', 'scope', 'authuser', 'prompt', 'error', 'error_description'].forEach(k => clean.delete(k));
        setParams(clean, { replace: true });
        if (denied) { setMessage('Bạn chưa cấp quyền Google Calendar. Lịch LifeSync vẫn hoạt động.'); return; }
        setFinishing(true);
        void googleCalendarService.complete({ code: code!, state }).then(() => {
            setMessage('Đã kết nối lịch chính Google. Giờ bận sẽ được kiểm tra khi lên kế hoạch.');
            return client.invalidateQueries({ queryKey: ['google-calendar'] });
        }).catch(errorMessage).finally(() => setFinishing(false));
    }, [params, setParams, userId, client]);
    return <section className="rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-4 space-y-3">
        <h2 className="font-semibold">Google Calendar cá nhân</h2>
        <p className="text-sm text-[var(--text-2)]">Kiểm tra giờ bận trong lịch chính để tránh xếp trùng task. Chỉ đọc giờ bận; không lấy tên cuộc họp hoặc chỉnh sửa lịch Google.</p>
        {status.isPending ? <p role="status">Đang kiểm tra kết nối…</p> : status.isError ? <p role="alert">Không tải được kết nối. <button onClick={() => status.refetch()} className="underline">Thử lại</button></p> : <>
            {!status.data.configured && <p role="status" className="text-sm">Quản trị viên chưa cấu hình OAuth Google Calendar.</p>}
            {status.data.connected && <p className="text-sm">{status.data.needsReconnect ? 'Quyền truy cập đã hết hạn. Vui lòng kết nối lại.' : 'Đã kết nối · Lịch chính Google'}</p>}
            {Capacitor.isNativePlatform() ? <p className="text-sm">Kết nối Google từ bản web LifeSync bằng cùng tài khoản; ứng dụng sẽ sử dụng kết nối đó.</p> : <Button disabled={!status.data.configured || finishing || disconnect.isPending} loading={connect.isPending} onClick={() => { setMessage(''); connect.mutate(); }}>{status.data.connected ? 'Kết nối lại Google' : 'Kết nối Google Calendar'}</Button>}
            {status.data.connected && <Button variant="secondary" loading={disconnect.isPending} disabled={finishing || connect.isPending} onClick={() => disconnect.mutate()}>Ngắt kết nối</Button>}
        </>}
        {finishing && <p role="status">Đang hoàn tất kết nối…</p>}
        {message && <p role="status" className="text-sm break-words">{message}</p>}
    </section>;
}
