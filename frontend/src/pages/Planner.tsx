import { useState } from 'react';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import {
    DndContext,
    DragOverlay,
    closestCenter,
    PointerSensor,
    TouchSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, List, Grid3x3 } from 'lucide-react';
import { Button } from '../components/ui';
import { TaskCard } from '../components/planner/TaskCard';
import { DroppableDay } from '../components/planner/DroppableDay';
import { TaskList } from '../components/planner/TaskList';
import { useTasksQuery, useUpdateTaskMutation } from '../hooks/useTasks';
import { showToast } from '../components/ui/toast';
import type { Task } from '../types';

type ViewMode = 'week' | 'month' | 'year';

export function Planner() {
    const [viewMode, setViewMode] = useState<ViewMode>('week');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [activeTask, setActiveTask] = useState<Task | null>(null);
    const [showUnscheduled, setShowUnscheduled] = useState(true);

    const { data: tasksData } = useTasksQuery();
    const updateTask = useUpdateTaskMutation();

    // Require a small movement before a drag starts so taps/clicks still work,
    // and so the overlay tracks the pointer cleanly from the grab point.
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 8 },
        }),
        useSensor(TouchSensor, {
            activationConstraint: { delay: 150, tolerance: 8 },
        }),
    );

    const tasks = tasksData?.data || [];

    // Get unscheduled tasks (no startAt or in the past)
    const unscheduledTasks = tasks.filter((task: Task) => {
        if (!task.startAt) return true;
        const taskDate = new Date(task.startAt);
        return taskDate < new Date(new Date().setHours(0, 0, 0, 0));
    });

    // Get dates for current view
    const getDatesForView = () => {
        const dates: Date[] = [];
        const start = new Date(currentDate);

        if (viewMode === 'week') {
            // Get start of week (Monday)
            const day = start.getDay();
            const diff = start.getDate() - day + (day === 0 ? -6 : 1);
            start.setDate(diff);
            start.setHours(0, 0, 0, 0);

            for (let i = 0; i < 7; i++) {
                const date = new Date(start);
                date.setDate(start.getDate() + i);
                dates.push(date);
            }
        } else if (viewMode === 'month') {
            start.setDate(1);
            start.setHours(0, 0, 0, 0);
            const daysInMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();

            for (let i = 0; i < daysInMonth; i++) {
                const date = new Date(start);
                date.setDate(i + 1);
                dates.push(date);
            }
        } else {
            // Year view - show 12 months
            for (let i = 0; i < 12; i++) {
                const date = new Date(start.getFullYear(), i, 1);
                dates.push(date);
            }
        }

        return dates;
    };

    const dates = getDatesForView();

    const getTasksForDate = (date: Date) => {
        const dateStr = date.toISOString().split('T')[0];
        return tasks.filter((task: Task) => {
            if (!task.startAt) return false;
            const taskDateStr = new Date(task.startAt).toISOString().split('T')[0];
            return taskDateStr === dateStr;
        });
    };

    const handleDragStart = (event: DragStartEvent) => {
        const task = tasks.find((t: Task) => t.id === event.active.id);
        setActiveTask(task || null);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveTask(null);

        if (!over) return;

        const taskId = active.id as string;
        const task = tasks.find((t: Task) => t.id === taskId);
        if (!task) return;

        // If dropped on a date
        if (over.id.toString().startsWith('date-')) {
            const dateIndex = parseInt(over.id.toString().replace('date-', ''));
            const targetDate = dates[dateIndex];

            if (targetDate) {
                const newStartAt = new Date(targetDate);
                newStartAt.setHours(9, 0, 0, 0); // Default to 9 AM

                const newDueAt = new Date(newStartAt);
                newDueAt.setHours(newStartAt.getHours() + 1); // 1 hour duration

                updateTask.mutate({
                    id: taskId,
                    data: {
                        startAt: newStartAt.toISOString(),
                        dueAt: newDueAt.toISOString(),
                    },
                });

                showToast.success('Đã cập nhật', 'Công việc đã được lên lịch');
            }
        }
    };

    const navigateDate = (direction: 'prev' | 'next') => {
        const newDate = new Date(currentDate);

        if (viewMode === 'week') {
            newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        } else if (viewMode === 'month') {
            newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
        } else {
            newDate.setFullYear(newDate.getFullYear() + (direction === 'next' ? 1 : -1));
        }

        setCurrentDate(newDate);
    };

    const getViewTitle = () => {
        if (viewMode === 'week') {
            const start = dates[0];
            const end = dates[6];
            return `${start.getDate()} - ${end.getDate()} Tháng ${end.getMonth() + 1}, ${end.getFullYear()}`;
        } else if (viewMode === 'month') {
            return `Tháng ${currentDate.getMonth() + 1}, ${currentDate.getFullYear()}`;
        } else {
            return `Năm ${currentDate.getFullYear()}`;
        }
    };

    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="space-y-6 pb-20 md:pb-0">
                {/* Header */}
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-[var(--text)]">Lập kế hoạch</h1>
                        <p className="text-[var(--text-2)] mt-1">Sắp xếp công việc theo thời gian</p>
                    </div>

                    {/* View Mode Selector */}
                    <div className="flex items-center gap-2 p-1 bg-[var(--surface-1)] border border-[var(--border)] rounded-lg">
                        <button
                            onClick={() => setViewMode('week')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'week'
                                ? 'bg-[var(--surface-2)] text-[var(--text)] shadow-sm'
                                : 'text-[var(--text-2)] hover:text-[var(--text)]'
                                }`}
                        >
                            Tuần
                        </button>
                        <button
                            onClick={() => setViewMode('month')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'month'
                                ? 'bg-[var(--surface-2)] text-[var(--text)] shadow-sm'
                                : 'text-[var(--text-2)] hover:text-[var(--text)]'
                                }`}
                        >
                            Tháng
                        </button>
                        <button
                            onClick={() => setViewMode('year')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'year'
                                ? 'bg-[var(--surface-2)] text-[var(--text)] shadow-sm'
                                : 'text-[var(--text-2)] hover:text-[var(--text)]'
                                }`}
                        >
                            Năm
                        </button>
                    </div>
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between bg-[var(--surface-1)] border border-[var(--border)] rounded-xl p-4">
                    <Button variant="ghost" size="sm" onClick={() => navigateDate('prev')}>
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <div className="flex items-center gap-2">
                        <CalendarIcon className="w-5 h-5 text-[var(--text-2)]" />
                        <h2 className="text-lg font-semibold text-[var(--text)]">{getViewTitle()}</h2>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => navigateDate('next')}>
                        <ChevronRight className="w-5 h-5" />
                    </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Unscheduled Tasks Sidebar */}
                    {showUnscheduled && (
                        <div className="lg:col-span-1">
                            <TaskList tasks={unscheduledTasks} />
                        </div>
                    )}

                    {/* Calendar Grid */}
                    <div className={showUnscheduled ? 'lg:col-span-3' : 'lg:col-span-4'}>
                        <div
                            className={`grid gap-4 ${viewMode === 'week'
                                ? 'grid-cols-1 md:grid-cols-7'
                                : viewMode === 'month'
                                    ? 'grid-cols-2 md:grid-cols-4 lg:grid-cols-7'
                                    : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
                                }`}
                        >
                            {dates.map((date, index) => (
                                <DroppableDay
                                    key={index}
                                    id={`date-${index}`}
                                    date={date}
                                    tasks={getTasksForDate(date)}
                                    viewMode={viewMode}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Toggle Unscheduled */}
                <button
                    onClick={() => setShowUnscheduled(!showUnscheduled)}
                    className="fixed bottom-24 md:bottom-8 right-8 w-14 h-14 rounded-full bg-primary-600 text-white shadow-lg hover:bg-primary-700 transition-all flex items-center justify-center z-40"
                >
                    {showUnscheduled ? <Grid3x3 className="w-6 h-6" /> : <List className="w-6 h-6" />}
                </button>
            </div>

            {/* Drag Overlay */}
            <DragOverlay>{activeTask ? <TaskCard task={activeTask} isDragging /> : null}</DragOverlay>
        </DndContext>
    );
}
