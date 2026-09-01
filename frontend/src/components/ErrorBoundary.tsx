import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from './ui';

interface Props {
    children: React.ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] p-4 text-[var(--text)]">
                    <div className="max-w-md w-full text-center">
                        <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle className="w-8 h-8 text-red-500" />
                        </div>
                        <h1 className="text-2xl font-bold text-[var(--text)] mb-2">
                            Đã xảy ra lỗi
                        </h1>
                        <p className="text-[var(--text-2)] mb-6">
                            {this.state.error?.message || 'Có lỗi không mong muốn xảy ra'}
                        </p>
                        <div className="space-y-2">
                            <Button
                                onClick={() => {
                                    this.setState({ hasError: false, error: null });
                                    window.location.reload();
                                }}
                                className="w-full"
                            >
                                Tải lại trang
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    this.setState({ hasError: false, error: null });
                                    window.location.href = '/';
                                }}
                                className="w-full"
                            >
                                Về trang chủ
                            </Button>
                        </div>
                        {import.meta.env.DEV && this.state.error && (
                            <details className="mt-6 text-left">
                                <summary className="cursor-pointer text-sm text-[var(--text-2)] hover:text-[var(--text)]">
                                    Chi tiết lỗi (Development)
                                </summary>
                                <pre className="mt-2 rounded-lg bg-[var(--surface-2)] p-4 text-xs text-[var(--text)] overflow-auto">
                                    {this.state.error.stack}
                                </pre>
                            </details>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
