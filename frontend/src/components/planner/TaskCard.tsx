import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Clock, Flag } from 'lucide-react';
import './planner-task-card.css';
import { cn } from '../../lib/utils';
import type { Task } from '../../types';

interface TaskCardProps {
    task: Task;
    /** When true, renders the static visual used inside the DragOverlay. */
    isDragging?: boolean;
}

const statusColors = {
    TODO: 'border-l-gray-400',
    IN_PROGRESS: 'border-l-blue-500',
    DONE: 'border-l-green-500',
};

/**
 * Pure presentational card. No dnd hooks, so it can be rendered safely inside
 * a DragOverlay without applying a second (offsetting) transform.
 */
function TaskCardContent({ task, isDragging }: TaskCardProps) {
    return (
        <div
            className={cn(
                'min-w-0 max-w-full bg-[var(--surface-1)] border border-[var(--border)] rounded-lg p-3 [overflow-wrap:anywhere]',
                'hover:shadow-[var(--shadow-md)] transition-shadow border-l-4',
                statusColors[task.status],
                isDragging ? 'shadow-[var(--shadow-lg)] rotate-2 cursor-grabbing' : 'cursor-grab'
            )}
        >
            <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-[var(--text)] break-words">{task.title}</h4>
                    {task.description && (
                        <p className="text-xs text-[var(--text-3)] mt-1 line-clamp-2">{task.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span
                            className="planner-priority" data-priority={task.priority}
                        >
                            <Flag className="w-3 h-3 mr-1 shrink-0" />
                            <span className="whitespace-nowrap">{{ LOW: 'Thấp', MEDIUM: 'Trung bình', HIGH: 'Cao' }[task.priority]}</span>
                        </span>
                        {task.startAt && <div className="planner-task-times">
                            <span><Clock size={12} aria-hidden="true" />Bắt đầu <time dateTime={task.startAt}>{new Date(task.startAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</time></span>
                            <span>Kết thúc <time dateTime={task.dueAt}>{new Date(task.dueAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}{new Date(task.startAt).toDateString() !== new Date(task.dueAt).toDateString() ? ` · ${new Date(task.dueAt).toLocaleDateString('vi-VN')}` : ''}</time></span>
                        </div>}
                    </div>
                </div>
            </div>
        </div>
    );
}

export function TaskCard({ task, isDragging }: TaskCardProps) {
    // Overlay variant: render the static content only (DragOverlay handles motion).
    if (isDragging) {
        return <TaskCardContent task={task} isDragging />;
    }

    return <SortableTaskCard task={task} />;
}

function SortableTaskCard({ task }: { task: Task }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: task.id,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        // Hide the original while it is being dragged; the DragOverlay shows the clone.
        opacity: isDragging ? 0 : 1,
    };

    return (
        <div className="min-w-0 max-w-full" ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <TaskCardContent task={task} />
        </div>
    );
}
