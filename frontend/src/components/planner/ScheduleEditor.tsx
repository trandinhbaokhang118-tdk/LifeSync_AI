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

export function ScheduleEditor({ selection, onClose, futureOnly = false }: { selection: ScheduleSelection; onClose: () => void; futureOnly?: boolean }) {
    const item = selection.task || selection.block;
    const [start, setStart] = useState(localInput(selection.startAt || item.startAt));
    const [end, setEnd] = useState(localInput(selection.endAt || (selection.task ? selection.task.dueAt : selection.block.endAt)));
    const [confirmedConflict, setConfirmedConflict] = useState('');
    const [error, setError] = useState('');
    const client = useQueryClient();
    const startMs = Date.parse(start), endMs = Date.parse(end);
    const valid = Number.isFinite(startMs) && Number.isFinite(endMs) && startMs < endMs;
    const pastStart = futureOnly && Number.isFinite(startMs) && startMs <= Date.now();
    const rangeStart = new Date(startMs); rangeStart.setHours(0, 0, 0, 0);
    const rangeEnd = new Date(endMs); rangeEnd.setHours(24, 0, 0, 0);
    const calendar = useCalendarAvailability(valid ? rangeStart.toISOString() : undefined, valid ? rangeEnd.toISOString() : undefined);
    const others = calendar.occupied.filter(e => !(e.id === item.id && e.source === (selection.task ? 'TASK' : 'BLOCK')));
    const conflicts = others.filter(e => startMs < Date.parse(e.endAt) && Date.parse(e.startAt) < endMs);
    const conflictKey = `${start}|${end}|${conflicts.map(e => `${e.source}:${e.id}:${e.startAt}:${e.endAt}`).sort().join('|')}`;
    const taskOverlap = !!selection.task && conflicts.length > 0 && conflicts.every(e => e.source === 'TASK');
    const confirmed = taskOverlap && confirmedConflict === conflictKey;
    const blocked = conflicts.length > 0 && !confirmed;
    const mutation = useMutation({
        mutationFn: async () => {
            if (futureOnly && Date.parse(start) <= Date.now()) throw new Error('PAST_SCHEDULE');
            const startAt = new Date(start).toISOString(), endAt = new Date(end).toISOString();
            if (selection.task) return tasksService.update(item.id, { startAt, dueAt: endAt, allowTaskOverlap: confirmed });
            return timeBlocksService.update(item.id, { startAt, endAt });
        },
        onSuccess: () => {
            void Promise.all(['tasks', 'time-blocks', 'planning', 'dashboard'].map(key => client.invalidateQueries({ queryKey: [key] })));
            toast.success('Đã cập nhật thời gian vào Lịch');
            onClose();
        },
        onError: (err: { response?: { data?: ApiError } }) => {
            setError(err.response?.data?.error?.message || 'Không lưu được lịch. Vui lòng thử lại.');
            void calendar.refetch();
        },
    });
    return <Modal isOpen onClose={() => { if (!mutation.isPending) onClose(); }} title="Chỉnh thời gian">
        <form className="max-h-[70dvh] overflow-y-auto space-y-4" onSubmit={e => { e.preventDefault(); if (valid && !pastStart && !mutation.isPending && !calendar.isLoading && !calendar.isError && !blocked) mutation.mutate(); }}>
            <p className="font-semibold break-words">{item.title}</p>
            <p className="text-sm text-[var(--text-2)]">Thay đổi sẽ cập nhật cả Công việc, Lên kế hoạch và Lịch. Múi giờ: {Intl.DateTimeFormat().resolvedOptions().timeZone}.</p>
            <label className="block text-sm">Bắt đầu<Input type="datetime-local" value={start} required onChange={e => { setStart(e.target.value); setError(''); }} /></label>
            <label className="block text-sm">Kết thúc<Input type="datetime-local" value={end} required onChange={e => { setEnd(e.target.value); setError(''); }} /></label>
            {pastStart && <p role="alert">Ngày hoặc giờ không phù hợp. Hãy chọn thời gian bắt đầu trong tương lai.</p>}
            {!valid && <p role="alert">Giờ kết thúc phải sau giờ bắt đầu.</p>}
            {calendar.isLoading && <p role="status">Đang kiểm tra thời gian bận…</p>}
            {calendar.isError && <p role="alert">Không kiểm tra được lịch. <button type="button" className="underline" onClick={() => calendar.refetch()}>Thử lại</button></p>}
            {others.length > 0 && <div className="rounded-lg border border-[var(--border)] p-3 space-y-2 text-sm">
                <p role={conflicts.length ? 'alert' : 'status'} className={conflicts.length ? 'text-red-600 font-semibold' : ''}>{conflicts.length ? (taskOverlap ? 'Các công việc trùng giờ. Bạn có thực sự làm chúng cùng lúc?' : 'Trùng khung giờ cố định. Hãy chọn giờ khác.') : 'Ngày này đã có lịch. Khung giờ bạn chọn hiện không bị trùng.'}</p>
                <ul className="max-h-48 overflow-auto space-y-2">{(conflicts.length ? conflicts : others).map(e => <li key={`${e.source}-${e.id}`} className="break-words">{e.title} · {new Date(e.startAt).toLocaleString('vi-VN')} – {new Date(e.endAt).toLocaleString('vi-VN')}</li>)}</ul>
            </div>}
            {taskOverlap && <label className="flex items-start gap-3 rounded-lg border border-[var(--border)] p-3 text-sm">
                <input type="checkbox" className="mt-1 h-5 w-5 shrink-0" checked={confirmed} onChange={e => setConfirmedConflict(e.target.checked ? conflictKey : '')} />
                <span>Tôi xác nhận làm các công việc này cùng lúc. Giữ nguyên thời gian trùng nhau.</span>
            </label>}
            {error && <p role="alert" className="text-red-600">{error}</p>}
            <div className="flex justify-end gap-2"><Button type="button" variant="secondary" disabled={mutation.isPending} onClick={onClose}>Hủy</Button><Button type="submit" loading={mutation.isPending} disabled={!valid || pastStart || calendar.isLoading || calendar.isError || blocked}>Lưu thời gian</Button></div>
        </form>
    </Modal>;
}
