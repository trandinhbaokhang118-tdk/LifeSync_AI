import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { TaskCard } from './TaskCard';
import { cn } from '../../lib/utils';
import type { Task, TimeBlock } from '../../types';

interface DroppableDayProps {
    id: string;
    date: Date;
    tasks: Task[];
    blocks?: TimeBlock[];
    viewMode: 'week' | 'month' | 'year';
}

export function DroppableDay({ id, date, tasks, blocks = [], viewMode }: DroppableDayProps) {
    const { setNodeRef, isOver } = useDroppable({ id });

    const isToday = date.toDateString() === new Date().toDateString();
    const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));

    const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    const monthNames = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];

    const getDateLabel = () => {
        if (viewMode === 'year') {
            return monthNames[date.getMonth()];
        }
        return date.getDate().toString();
    };

    const getDayLabel = () => {
        if (viewMode === 'year') {
            return `Tháng ${date.getMonth() + 1}`;
        }
        return dayNames[date.getDay()];
    };

    return (
        <div
            ref={setNodeRef}
            role="region"
            aria-label={`Lịch ${date.toLocaleDateString('vi-VN')}`}
            className={cn(
                'min-w-0 bg-[var(--surface-1)] border border-[var(--border)] rounded-xl p-3 min-h-[120px] transition-all',
                isOver && 'ring-2 ring-primary-500 bg-primary-50 dark:bg-primary-900/10',
                isToday && 'ring-2 ring-primary-400',
                isPast && 'opacity-60',
                viewMode === 'week' && 'min-h-[200px]'
            )}
        >
            {/* Date Header */}
            <div className="mb-3 pb-2 border-b border-[var(--border)]">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-[var(--text-2)]">{getDayLabel()}</span>
                    <span
                        className={cn(
                            'text-lg font-bold',
                            isToday ? 'text-primary-600' : 'text-[var(--text)]'
                        )}
                    >
                        {getDateLabel()}
                    </span>
                </div>
                {tasks.length > 0 && (
                    <div className="mt-1">
                        <span className="text-xs text-[var(--text-3)]">{tasks.length} công việc</span>
                    </div>
                )}
            </div>

            {/* Tasks */}
            <div className="space-y-2 mb-2">
                {blocks.map(block => <div key={block.id} className="min-w-0 rounded-lg border border-blue-300 p-2 text-xs [overflow-wrap:anywhere]">
                    <p className="font-semibold">Cố định · {block.title}</p>
                    <p>{new Date(block.startAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} – {new Date(block.endAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>)}
            </div>
            <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                    {tasks.map((task) => (
                        <TaskCard key={task.id} task={task} />
                    ))}
                </div>
            </SortableContext>

            {/* Drop Zone Indicator */}
            {isOver && tasks.length === 0 && (
                <div className="flex items-center justify-center h-20 border-2 border-dashed border-primary-400 rounded-lg">
                    <p className="text-sm text-primary-600 font-medium">Thả công việc vào đây</p>
                </div>
            )}
        </div>
    );
}
