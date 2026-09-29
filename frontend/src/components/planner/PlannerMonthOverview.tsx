import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Task } from '../../types';
import { localDayKey } from '../../lib/planner-scheduling';
import './planner-month-overview.css';

export function PlannerMonthOverview({ date, tasks, onSelect }: {
    date: Date; tasks: Task[]; onSelect: (date: Date) => void;
}) {
    const [offset, setOffset] = useState(0);
    const month = new Date(date.getFullYear(), date.getMonth() + offset, 1);
    const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const leading = (month.getDay() + 6) % 7;
    const today = localDayKey(new Date());
    return <section className="planner-month" aria-label="Tổng quan công việc trong tháng">
        <div className="planner-month__heading">
            <button type="button" aria-label="Tháng trước trong tổng quan" onClick={() => setOffset(v => v - 1)}><ChevronLeft size={16} /></button>
            <h2>Tháng {month.getMonth() + 1}/{month.getFullYear()}</h2>
            <button type="button" aria-label="Tháng sau trong tổng quan" onClick={() => setOffset(v => v + 1)}><ChevronRight size={16} /></button>
        </div>
        <div className="planner-month__grid">
            {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(name => <span className="planner-month__weekday" key={name}>{name}</span>)}
            {Array.from({ length: leading }, (_, i) => <span key={`blank-${i}`} />)}
            {Array.from({ length: count }, (_, i) => {
                const day = new Date(month.getFullYear(), month.getMonth(), i + 1);
                const key = localDayKey(day);
                const items = tasks.filter(task => task.startAt && localDayKey(new Date(task.startAt)) === key);
                return <button type="button" className="planner-month__day" key={key} data-date={key}
                    aria-current={key === today ? 'date' : undefined}
                    aria-label={`${day.toLocaleDateString('vi-VN')}: ${items.length} công việc`}
                    onClick={() => { setOffset(0); onSelect(day); }}>
                    <span>{i + 1}</span>
                    <span className="planner-month__dots" aria-hidden="true">{items.map(task => <i key={task.id} data-priority={task.priority} title={task.title} />)}</span>
                </button>;
            })}
        </div>
        <p className="planner-month__legend"><span><i data-priority="HIGH" />Cao</span><span><i data-priority="MEDIUM" />Trung bình</span><span><i data-priority="LOW" />Thấp</span></p>
        <p className="planner-month__hint">Mỗi chấm là một công việc. Chọn ngày để xem tuần tương ứng.</p>
    </section>;
}
