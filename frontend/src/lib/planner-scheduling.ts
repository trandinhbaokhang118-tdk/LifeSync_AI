import type { Task } from '../types';

export function localDayKey(date: Date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function moveTaskToDay(task: Pick<Task, 'startAt' | 'dueAt'>, day: Date, now: Date): { start: Date; end: Date } | { error: string } {
    const start = new Date(day.getFullYear(), day.getMonth(), day.getDate());
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (+start < +today) return { error: 'Ngày đã qua không phù hợp để lên lịch công việc mới.' };
    const previous = new Date(task.startAt);
    start.setHours(Number.isFinite(+previous) ? previous.getHours() : 9, Number.isFinite(+previous) ? previous.getMinutes() : 0, 0, 0);
    if (+start <= +now) return { error: 'Giờ bắt đầu trong ngày này đã qua. Hãy chọn một thời điểm trong tương lai.' };
    const oldDuration = Date.parse(task.dueAt) - +previous;
    const duration = Number.isFinite(oldDuration) && oldDuration > 0 ? oldDuration : 3600000;
    return { start, end: new Date(+start + duration) };
}
