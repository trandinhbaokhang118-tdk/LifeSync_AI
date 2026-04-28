import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Sparkles, Clock, Calendar, Zap, CheckCircle2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';
import { showToast } from '../ui/toast';
import { tasksService } from '../../services/tasks.service';
import type { Task } from '../../types';

interface AIScheduleModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

interface SchedulePreferences {
    wakeUpTime: string;
    sleepTime: string;
    workStartTime: string;
    workEndTime: string;
    lunchTime: string;
    bestFocusTime: 'morning' | 'afternoon' | 'evening';
    breakDuration: number;
}

interface ScheduleSuggestion {
    taskId: string;
    title: string;
    suggestedStart: string;
    suggestedEnd: string;
    reason: string;
    confidence: number;
}

export function AIScheduleModal({ open, onOpenChange }: AIScheduleModalProps) {
    const [step, setStep] = useState<'form' | 'analyzing' | 'results'>('form');
    const [preferences, setPreferences] = useState<SchedulePreferences>({
        wakeUpTime: '06:00',
        sleepTime: '23:00',
        workStartTime: '08:00',
        workEndTime: '17:00',
        lunchTime: '12:00',
        bestFocusTime: 'morning',
        breakDuration: 15,
    });

    const [suggestions, setSuggestions] = useState<ScheduleSuggestion[]>([]);

    const { data: tasks } = useQuery({
        queryKey: ['tasks', { status: 'TODO', limit: 50 }],
        queryFn: () => tasksService.getAll({ status: 'TODO', limit: 50 }),
    });

    const analyzeMutation = useMutation({
        mutationFn: async () => {
            // Simulate AI analysis
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Simple scheduling algorithm
            const todoTasks = tasks?.data || [];
            const scheduled = scheduleTasksSimple(todoTasks, preferences);
            return scheduled;
        },
        onSuccess: (scheduled) => {
            setSuggestions(scheduled);
            setStep('results');
            showToast.success('Phân tích hoàn tất', 'Đã tạo lịch trình tối ưu cho bạn!');
        },
        onError: () => {
            showToast.error('Lỗi', 'Không thể phân tích lịch trình');
            setStep('form');
        },
    });

    const handleAnalyze = () => {
        setStep('analyzing');
        analyzeMutation.mutate();
    };

    const handleApply = async () => {
        try {
            // Apply suggestions to tasks
            for (const suggestion of suggestions) {
                await tasksService.update(suggestion.taskId, {
                    startAt: suggestion.suggestedStart,
                    dueAt: suggestion.suggestedEnd,
                });
            }
            showToast.success('Đã áp dụng', 'Lịch trình đã được cập nhật!');
            onOpenChange(false);
        } catch {
            showToast.error('Lỗi', 'Không thể áp dụng lịch trình');
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        Sắp xếp lịch bằng AI
                    </DialogTitle>
                </DialogHeader>

                {step === 'form' && (
                    <div className="space-y-6 py-4">
                        <div className="space-y-4">
                            <h3 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                Thời gian sinh hoạt
                            </h3>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label">Giờ thức dậy</label>
                                    <Input
                                        type="time"
                                        value={preferences.wakeUpTime}
                                        onChange={(e) => setPreferences({ ...preferences, wakeUpTime: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="label">Giờ đi ngủ</label>
                                    <Input
                                        type="time"
                                        value={preferences.sleepTime}
                                        onChange={(e) => setPreferences({ ...preferences, sleepTime: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                Lịch làm việc/học tập
                            </h3>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label">Bắt đầu</label>
                                    <Input
                                        type="time"
                                        value={preferences.workStartTime}
                                        onChange={(e) => setPreferences({ ...preferences, workStartTime: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="label">Kết thúc</label>
                                    <Input
                                        type="time"
                                        value={preferences.workEndTime}
                                        onChange={(e) => setPreferences({ ...preferences, workEndTime: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="label">Giờ ăn trưa</label>
                                <Input
                                    type="time"
                                    value={preferences.lunchTime}
                                    onChange={(e) => setPreferences({ ...preferences, lunchTime: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                <Zap className="w-4 h-4" />
                                Sở thích cá nhân
                            </h3>

                            <div>
                                <label className="label">Thời gian tập trung tốt nhất</label>
                                <Select
                                    value={preferences.bestFocusTime}
                                    onValueChange={(value) =>
                                        setPreferences({
                                            ...preferences,
                                            bestFocusTime: value as SchedulePreferences['bestFocusTime'],
                                        })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="morning">Buổi sáng (6h-12h)</SelectItem>
                                        <SelectItem value="afternoon">Buổi chiều (12h-18h)</SelectItem>
                                        <SelectItem value="evening">Buổi tối (18h-23h)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <label className="label">Thời gian nghỉ giữa các task (phút)</label>
                                <Input
                                    type="number"
                                    min="5"
                                    max="60"
                                    value={preferences.breakDuration}
                                    onChange={(e) => setPreferences({ ...preferences, breakDuration: parseInt(e.target.value) })}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <Button variant="outline" onClick={() => onOpenChange(false)}>
                                Hủy
                            </Button>
                            <Button onClick={handleAnalyze} className="bg-gradient-to-r from-purple-500 to-pink-500">
                                <Sparkles className="w-4 h-4 mr-2" />
                                Phân tích & Sắp xếp
                            </Button>
                        </div>
                    </div>
                )}

                {step === 'analyzing' && (
                    <div className="py-12 text-center space-y-4">
                        <div className="inline-flex p-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 animate-pulse">
                            <Sparkles className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                            Đang phân tích lịch trình...
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            AI đang tối ưu hóa thời gian của bạn
                        </p>
                    </div>
                )}

                {step === 'results' && (
                    <div className="space-y-4 py-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-medium text-gray-900 dark:text-white">
                                Lịch trình được đề xuất
                            </h3>
                            <span className="text-sm text-gray-500">
                                {suggestions.length} công việc
                            </span>
                        </div>

                        <div className="space-y-2 max-h-[400px] overflow-y-auto">
                            {suggestions.map((suggestion, index) => (
                                <div
                                    key={index}
                                    className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-purple-300 dark:hover:border-purple-600 transition-colors"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h4 className="font-medium text-gray-900 dark:text-white">
                                                {suggestion.title}
                                            </h4>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                {new Date(suggestion.suggestedStart).toLocaleString('vi-VN', {
                                                    weekday: 'short',
                                                    day: 'numeric',
                                                    month: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                                {' → '}
                                                {new Date(suggestion.suggestedEnd).toLocaleTimeString('vi-VN', {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </p>
                                            <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                                                {suggestion.reason}
                                            </p>
                                        </div>
                                        <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <Button variant="outline" onClick={() => setStep('form')}>
                                Quay lại
                            </Button>
                            <Button onClick={handleApply} className="bg-gradient-to-r from-purple-500 to-pink-500">
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                Áp dụng lịch trình
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

// Simple scheduling algorithm
function scheduleTasksSimple(tasks: Task[], preferences: SchedulePreferences): ScheduleSuggestion[] {
    const suggestions: ScheduleSuggestion[] = [];
    const now = new Date();
    let currentDate = new Date(now);
    currentDate.setHours(parseInt(preferences.workStartTime.split(':')[0]), parseInt(preferences.workStartTime.split(':')[1]), 0, 0);

    // Sort tasks by priority and due date
    const sortedTasks = [...tasks].sort((a, b) => {
        const priorityWeight = { HIGH: 3, MEDIUM: 2, LOW: 1 };
        const aPriority = priorityWeight[a.priority as keyof typeof priorityWeight] || 1;
        const bPriority = priorityWeight[b.priority as keyof typeof priorityWeight] || 1;

        if (aPriority !== bPriority) return bPriority - aPriority;
        return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
    });

    for (const task of sortedTasks.slice(0, 10)) {
        // Skip if past work hours
        const currentHour = currentDate.getHours();
        const workEndHour = parseInt(preferences.workEndTime.split(':')[0]);

        if (currentHour >= workEndHour) {
            // Move to next day
            currentDate.setDate(currentDate.getDate() + 1);
            currentDate.setHours(parseInt(preferences.workStartTime.split(':')[0]), 0, 0, 0);
        }

        // Skip lunch time
        const lunchHour = parseInt(preferences.lunchTime.split(':')[0]);
        if (currentHour === lunchHour) {
            currentDate.setHours(lunchHour + 1, 0, 0, 0);
        }

        const duration = 60; // Default 1 hour
        const endTime = new Date(currentDate.getTime() + duration * 60000);

        suggestions.push({
            taskId: task.id,
            title: task.title,
            suggestedStart: currentDate.toISOString(),
            suggestedEnd: endTime.toISOString(),
            reason: `Sắp xếp theo độ ưu tiên ${task.priority} và deadline`,
            confidence: 85,
        });

        // Add break time
        currentDate = new Date(endTime.getTime() + preferences.breakDuration * 60000);
    }

    return suggestions;
}
