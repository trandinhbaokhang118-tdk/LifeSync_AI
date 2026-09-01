import { CheckSquare } from 'lucide-react';
import { Button } from './Button';

interface EmptyTasksProps {
    onAdd?: () => void;
}

export function EmptyTasks({ onAdd }: EmptyTasksProps) {
    return (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <CheckSquare className="w-12 h-12 text-[var(--text-3)] mb-4" />
            <h3 className="text-lg font-medium text-[var(--text)] mb-2">
                No tasks yet
            </h3>
            <p className="text-sm text-[var(--text-2)] max-w-sm mb-4">
                Create your first task to get started
            </p>
            {onAdd && (
                <Button onClick={onAdd}>
                    Add Task
                </Button>
            )}
        </div>
    );
}
