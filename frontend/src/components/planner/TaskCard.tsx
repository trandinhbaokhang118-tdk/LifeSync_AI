import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Clock, Flag } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { Task } from '../../types';

interface TaskCardProps {
    task: Task;
    /** When true, renders the static visual used inside the DragOverlay. */
    isDragging?: boolean;
}

const priorityColors = {
    LOW: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    MEDIUM: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
    HIGH: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
};

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
                'bg-[var(--surface-1)] border border-[var(--border)] rounded-lg p-3',
                'hover:shadow-[var(--shadow-md)] transition-shadow border-l-4',
                statusColors[task.status],
                isDragging ? 'shadow-[var(--shadow-lg)] rotate-2 cursor-grabbing' : 'cursor-grab'
            )}
        >
            <div className="flex items-start gap-2">
                <GripVertical className="w-4 h-4 text-[var(--text-3)] flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-[var(--text)] truncate">{task.title}</h4>
                    {task.description && (
                        <p className="text-xs text-[var(--text-3)] mt-1 line-clamp-2">{task.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span
                            className={cn(
                                'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                                priorityColors[task.priority]
                            )}
                        >
                            <Flag className="w-3 h-3 mr-1" />
                            {task.priority}
                        </span>
                        {task.startAt && (
                            <span className="inline-flex items-center text-xs text-[var(--text-3)]">
                                <Clock className="w-3 h-3 mr-1" />
                                {new Date(task.startAt).toLocaleTimeString('vi-VN', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
                            </span>
                        )}
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
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <TaskCardContent task={task} />
        </div>
    );
}
