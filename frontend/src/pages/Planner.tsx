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
import type { Task } from '../types';
import { useCalendarAvailability } from '../hooks/useCalendarAvailability';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ScheduleEditor, type ScheduleSelection } from '../components/planner/ScheduleEditor';

type ViewMode = 'week' | 'month' | 'year';

export function Planner() {
    const [viewMode, setViewMode] = useState<ViewMode>('week');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [activeTask, setActiveTask] = useState<Task | null>(null);
    const [showUnscheduled, setShowUnscheduled] = useState(true);
    const [scheduleError, setScheduleError] = useState<string | null>(null);
    const [editing, setEditing] = useState<ScheduleSelection | null>(null);

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
    const rangeEnd = new Date(dates[dates.length - 1]);
    if (viewMode === 'year') rangeEnd.setMonth(rangeEnd.getMonth() + 1);
    else rangeEnd.setDate(rangeEnd.getDate() + 1);
    const calendar = useCalendarAvailability(dates[0].toISOString(), rangeEnd.toISOString());

    const getTasksForDate = (date: Date) => {
        return tasks.filter((task: Task) => {
            if (!task.startAt) return false;
            const taskDate = new Date(task.startAt);
            return viewMode === 'year'
                ? taskDate.getFullYear() === date.getFullYear() && taskDate.getMonth() === date.getMonth()
                : taskDate.toDateString() === date.toDateString();
        });
    };

    const handleDragStart = (event: DragStartEvent) => {
        const task = tasks.find((t: Task) => t.id === event.active.id);
        setActiveTask(task || null);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveTask(null);
        setScheduleError(null);

        if (!over) return;
        if (calendar.isLoading || calendar.isError || updateTask.isPending) {
            setScheduleError('Chưa thể đổi lịch. Hãy chờ tải Lịch hoặc thử tải lại.');
            return;
        }

        const taskId = active.id as string;
        const task = tasks.find((t: Task) => t.id === taskId);
        if (!task) return;

        // A populated day may report its sortable task as the drop target.
        const overTask = tasks.find(t => t.id === over.id);
        const targetIndex = overTask ? dates.findIndex(d => viewMode === 'year'
            ? d.getFullYear() === new Date(overTask.startAt).getFullYear() && d.getMonth() === new Date(overTask.startAt).getMonth()
            : d.toDateString() === new Date(overTask.startAt).toDateString()) : -1;
        if (over.id.toString().startsWith('date-') || targetIndex >= 0) {
            const dateIndex = targetIndex >= 0 ? targetIndex : parseInt(over.id.toString().replace('date-', ''));
            const targetDate = dates[dateIndex];

            if (targetDate) {
                const newStartAt = new Date(targetDate);
                const previousStart = new Date(task.startAt);
                newStartAt.setHours(Number.isFinite(+previousStart) ? previousStart.getHours() : 9, Number.isFinite(+previousStart) ? previousStart.getMinutes() : 0, 0, 0);

                const duration = Math.max(15 * 60000, (Date.parse(task.dueAt) - +previousStart) || 3600000);
                const newDueAt = new Date(+newStartAt + duration);
                const collision = calendar.occupied.find(b => !(b.source === 'TASK' && b.id === taskId) && +newStartAt < Date.parse(b.endAt) && Date.parse(b.startAt) < +newDueAt);
                const nextDay = new Date(targetDate); nextDay.setDate(nextDay.getDate() + 1);
                const busyDay = calendar.occupied.some(b => !(b.source === 'TASK' && b.id === taskId) && Date.parse(b.startAt) < +nextDay && Date.parse(b.endAt) > +targetDate);
                if (collision || busyDay) {
                    setEditing({ task, startAt: newStartAt.toISOString(), endAt: newDueAt.toISOString() });
                    return;
                }

                updateTask.mutate({
                    id: taskId,
                    data: {
                        startAt: newStartAt.toISOString(),
                        dueAt: newDueAt.toISOString(),
                    },
                }, {
                    onSuccess: () => toast.success('Đã cập nhật công việc vào Lịch'),
                    onError: error => {
                        setScheduleError(error.response?.data?.error?.message || 'Không thể đổi lịch. Vui lòng thử lại.');
                        calendar.refetch();
                    },
                });

            }
        }
    };

    const navigateDate = (direction: 'prev' | 'next') => {
        const newDate = new Date(currentDate);

        if (viewMode === 'week') {
            newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        } else if (viewMode === 'month') {
            newDate.setDate(1);
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
            return `${start.toLocaleDateString('vi-VN')} – ${end.toLocaleDateString('vi-VN')}`;
        } else if (viewMode === 'month') {
            return `Tháng ${currentDate.getMonth() + 1}, ${currentDate.getFullYear()}`;
        } else {
            return `Năm ${currentDate.getFullYear()}`;
        }
    };

    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="space-y-6 pb-20 md:pb-0">
                <p className="text-sm text-[var(--text-2)]">Kéo sang ngày khác giữ nguyên giờ và thời lượng. Khung giờ cố định được hiển thị bên dưới và không thể ghi đè. <Link className="underline text-primary-600" to="/app/calendar">Mở Lịch</Link></p>
                {calendar.isLoading && <p role="status">Đang kiểm tra lịch bận…</p>}
                {calendar.isError && <p role="alert">Không tải được Lịch. <button className="underline" onClick={() => calendar.refetch()}>Thử lại</button></p>}
                {scheduleError && <p role="alert" className="rounded-lg border border-red-500 p-3 text-red-600">{scheduleError}</p>}
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
                    <div className={`min-w-0 overflow-x-auto ${showUnscheduled ? 'lg:col-span-3' : 'lg:col-span-4'}`}>
                        <div
                            className={`grid gap-4 ${viewMode === 'week'
                                ? 'grid-cols-1 md:grid-cols-7 md:min-w-[1260px]'
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
                                    blocks={calendar.blocks.filter(b => {
                                        const end = new Date(date);
                                        if (viewMode === 'year') end.setMonth(end.getMonth() + 1);
                                        else end.setDate(end.getDate() + 1);
                                        return Date.parse(b.startAt) < +end && Date.parse(b.endAt) > +date;
                                    })}
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
            {editing && <ScheduleEditor selection={editing} onClose={() => setEditing(null)} />}
        </DndContext>
    );
}
