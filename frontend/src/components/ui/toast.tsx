import toast, { Toaster as HotToaster } from 'react-hot-toast';
import { CheckCircle2, XCircle, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '../../lib/utils';

// Custom toast component
interface ToastProps {
    t: { id: string; visible: boolean };
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    description?: string;
}

function CustomToast({ t, type, title, description }: ToastProps) {
    const icons = {
        success: <CheckCircle2 className="w-5 h-5 text-green-500" />,
        error: <XCircle className="w-5 h-5 text-red-500" />,
        warning: <AlertCircle className="w-5 h-5 text-amber-500" />,
        info: <Info className="w-5 h-5 text-blue-500" />,
    };

    const bgColors = {
        success: 'border-green-200 dark:border-green-800 bg-blue-400',
        error: 'border-red-200 dark:border-red-800',
        warning: 'border-amber-200 dark:border-amber-800',
        info: 'border-blue-200 dark:border-blue-800',
    };

    return (
        <div
            className={cn(
                'max-w-md w-full bg-[var(--surface-1)] text-[var(--text)] border border-[var(--border)] shadow-lg rounded-xl pointer-events-auto',
                'border-l-4 p-4 flex items-start gap-3 select-none',
                bgColors[type],
                t.visible ? 'animate-slide-up' : 'animate-fade-out'
            )}
        >
            <div className="flex-shrink-0">{icons[type]}</div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white select-none">{title}</p>
                {description && (
                    <p className="mt-1 text-sm font-medium text-[var(--text-2)] select-none">{description}</p>
                )}
            </div>
            <button
                onClick={() => toast.dismiss(t.id)}
                className="flex-shrink-0 text-[var(--text-3)] hover:text-[var(--text)]"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
}

// Toast functions
export const showToast = {
    success: (title: string, description?: string) => {
        toast.custom((t) => <CustomToast t={t} type="success" title={title} description={description} />);
    },
    error: (title: string, description?: string) => {
        toast.custom((t) => <CustomToast t={t} type="error" title={title} description={description} />);
    },
    warning: (title: string, description?: string) => {
        toast.custom((t) => <CustomToast t={t} type="warning" title={title} description={description} />);
    },
    info: (title: string, description?: string) => {
        toast.custom((t) => <CustomToast t={t} type="info" title={title} description={description} />);
    },
};

// Toaster provider
export function Toaster() {
    return (
        <HotToaster
            position="top-right"
            toastOptions={{
                duration: 4000,
            }}
            containerStyle={{
                top: '80px', // Dịch xuống để không bị che bởi header
                
            }}
        />
    );
}

export { toast };
