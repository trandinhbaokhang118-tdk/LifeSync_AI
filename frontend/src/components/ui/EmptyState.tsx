import type { ReactNode } from 'react';
import { Button } from './Button';

interface EmptyStateProps {
    icon?: ReactNode;
    title: string;
    description?: string;
    action?: {
        label: string;
        onClick: () => void;
    };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            {icon && (
                <div className="w-16 h-16 mb-4 text-[var(--text-3)]">
                    {icon}
                </div>
            )}
            <h3 className="text-lg font-medium text-[var(--text)] mb-1">
                {title}
            </h3>
            {description && (
                <p className="text-sm text-[var(--text-2)] max-w-sm mb-4">
                    {description}
                </p>
            )}
            {action && (
                <Button onClick={action.onClick}>
                    {action.label}
                </Button>
            )}
        </div>
    );
}
