import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

interface ErrorStateProps {
    onRetry?: () => void;
}

export function ErrorState({ onRetry }: ErrorStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
            <h3 className="text-lg font-medium text-[var(--text)] mb-2">
                Something went wrong
            </h3>
            <p className="text-sm text-[var(--text-2)] max-w-sm mb-4">
                An error occurred while loading data. Please try again.
            </p>
            {onRetry && (
                <Button onClick={onRetry} variant="secondary">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again
                </Button>
            )}
        </div>
    );
}
