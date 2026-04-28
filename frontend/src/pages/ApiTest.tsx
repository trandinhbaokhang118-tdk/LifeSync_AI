import { useState } from 'react';
import type { AxiosError } from 'axios';
import { Button } from '../components/ui';
import { dashboardService } from '../services/dashboard.service';
import { tasksService } from '../services/tasks.service';
import { notificationsService } from '../services/notifications.service';

interface TestResult {
    success: boolean;
    data?: unknown;
    error?: string;
    details?: unknown;
}

export function ApiTest() {
    const [testResults, setTestResults] = useState<Record<string, TestResult>>({});

    const testEndpoint = async (name: string, fn: () => Promise<unknown>) => {
        try {
            const result = await fn();
            setTestResults(prev => ({
                ...prev,
                [name]: { success: true, data: result }
            }));
        } catch (error) {
            const axiosError = error as AxiosError;
            setTestResults(prev => ({
                ...prev,
                [name]: {
                    success: false,
                    error: axiosError.message,
                    details: axiosError.response?.data,
                }
            }));
        }
    };

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-2xl font-bold">API Test Page</h1>

            <div className="space-y-2">
                <Button onClick={() => testEndpoint('dashboard-stats', dashboardService.getStats)}>
                    Test Dashboard Stats
                </Button>
                <Button onClick={() => testEndpoint('tasks', () => tasksService.getAll({ limit: 5 }))}>
                    Test Tasks
                </Button>
                <Button onClick={() => testEndpoint('notifications', () => notificationsService.getAll(1, 10))}>
                    Test Notifications
                </Button>
            </div>

            <div className="space-y-4">
                {Object.entries(testResults).map(([name, result]) => (
                    <div key={name} className="card p-4">
                        <h3 className="font-bold mb-2">{name}</h3>
                        <div className={`p-2 rounded ${result.success ? 'bg-green-100' : 'bg-red-100'}`}>
                            <pre className="text-xs overflow-auto">
                                {JSON.stringify(result, null, 2)}
                            </pre>
                        </div>
                    </div>
                ))}
            </div>

            <div className="card p-4">
                <h3 className="font-bold mb-2">Auth Info</h3>
                <pre className="text-xs overflow-auto">
                    {JSON.stringify({
                        hasAccessToken: !!localStorage.getItem('accessToken'),
                        hasRefreshToken: !!localStorage.getItem('refreshToken'),
                        authStorage: localStorage.getItem('auth-storage'),
                    }, null, 2)}
                </pre>
            </div>
        </div>
    );
}
