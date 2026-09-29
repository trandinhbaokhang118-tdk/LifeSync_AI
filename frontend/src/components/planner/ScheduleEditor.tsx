import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Button, Input, Modal } from '../ui';
import { useCalendarAvailability } from '../../hooks/useCalendarAvailability';
import { tasksService } from '../../services/tasks.service';
import { timeBlocksService } from '../../services/time-blocks.service';
import type { ApiError, Task, TimeBlock } from '../../types';

export type ScheduleTarget = { task: Task; block?: never } | { task?: never; block: TimeBlock };
export type ScheduleSelection = ScheduleTarget & { startAt?: string; endAt?: string };

function localInput(iso: string) {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function ScheduleEditor({ selection, onClose }: { selection: ScheduleSelection; onClose: () => void }) {
    const item = selection.task || selection.block;
    const [start, setStart] = useState(localInput(selection.startAt || item.startAt));
    const [end, setEnd] = useState(localInput(selection.endAt || (selection.task ? selection.task.dueAt : selection.block.endAt)));
    const [error, setError] = useState('');
    const client = useQueryClient();
    const startMs = Date.parse(start), endMs = Date.parse(end);
    const valid = Number.isFinite(startMs) && Number.isFinite(endMs) && startMs < endMs;
    const rangeStart = new Date(startMs); rangeStart.setHours(0, 0, 0, 0);
    const rangeEnd = new Date(endMs); rangeEnd.setHours(24, 0, 0, 0);
    const calendar = useCalendarAvailability(valid ? rangeStart.toISOString() : undefined, valid ? rangeEnd.toISOString() : undefined);
    const others = calendar.occupied.filter(e => !(e.id === item.id && e.source === (selection.task ? 'TASK' : 'BLOCK')));
    const conflicts = others.filter(e => startMs < Date.parse(e.endAt) && Date.parse(e.startAt) < endMs);
    const mutation = useMutation({
        mutationFn: async () => {
            const startAt = new Date(start).toISOString(), endAt = new Date(end).toISOString();
            if (selection.task) return tasksService.update(item.id, { startAt, dueAt: endAt });
            return timeBlocksService.update(item.id, { startAt, endAt });
        },
        onSuccess: async () => {
            await Promise.all(['tasks', 'time-blocks', 'planning', 'dashboard'].map(key => client.invalidateQueries({ queryKey: [key] })));
            toast.success('Đã cập nhật thời gian vào Lịch');
            onClose();
        },
        onError: (err: { response?: { data?: ApiError } }) => {
            setError(err.response?.data?.error?.message || 'Không lưu được lịch. Vui lòng thử lại.');
            void calendar.refetch();
        },
    });
    return <Modal isOpen onClose={() => { if (!mutation.isPending) onClose(); }} title="Chỉnh thời gian">
        <form className="max-h-[70dvh] overflow-y-auto space-y-4" onSubmit={e => { e.preventDefault(); if (valid && !mutation.isPending && !calendar.isLoading && !calendar.isError && !conflicts.length) mutation.mutate(); }}>
            <p className="font-semibold break-words">{item.title}</p>
            <p className="text-sm text-[var(--text-2)]">Thay đổi sẽ cập nhật cả Công việc, Lên kế hoạch và Lịch. Múi giờ: {Intl.DateTimeFormat().resolvedOptions().timeZone}.</p>
            <label className="block text-sm">Bắt đầu<Input type="datetime-local" value={start} required onChange={e => { setStart(e.target.value); setError(''); }} /></label>
            <label className="block text-sm">Kết thúc<Input type="datetime-local" value={end} required onChange={e => { setEnd(e.target.value); setError(''); }} /></label>
            {!valid && <p role="alert">Giờ kết thúc phải sau giờ bắt đầu.</p>}
            {calendar.isLoading && <p role="status">Đang kiểm tra thời gian bận…</p>}
            {calendar.isError && <p role="alert">Không kiểm tra được lịch. <button type="button" className="underline" onClick={() => calendar.refetch()}>Thử lại</button></p>}
            {others.length > 0 && <div className="rounded-lg border border-[var(--border)] p-3 space-y-2 text-sm">
                <p role={conflicts.length ? 'alert' : 'status'} className={conflicts.length ? 'text-red-600 font-semibold' : ''}>{conflicts.length ? 'Trùng thời gian. Hãy chỉnh giờ của công việc trước khi lưu.' : 'Ngày này đã có lịch. Khung giờ bạn chọn hiện không bị trùng.'}</p>
                <ul className="max-h-48 overflow-auto space-y-2">{others.map(e => <li key={`${e.source}-${e.id}`} className="break-words">{e.title} · {new Date(e.startAt).toLocaleString('vi-VN')} – {new Date(e.endAt).toLocaleString('vi-VN')}</li>)}</ul>
            </div>}
            {error && <p role="alert" className="text-red-600">{error}</p>}
            <div className="flex justify-end gap-2"><Button type="button" variant="secondary" disabled={mutation.isPending} onClick={onClose}>Hủy</Button><Button type="submit" loading={mutation.isPending} disabled={!valid || calendar.isLoading || calendar.isError || conflicts.length > 0}>Lưu thời gian</Button></div>
        </form>
    </Modal>;
}
