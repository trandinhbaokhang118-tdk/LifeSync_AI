import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';
import { PageHeader } from '../components/layout';
import { Button, Input, Modal } from '../components/ui';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { timeBlocksService } from '../services/time-blocks.service';
import type { ApiError, CreateTimeBlockRequest, TimeBlock } from '../types';

const timeBlockSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    date: z.string().min(1, 'Date is required'),
    startTime: z.string().min(1, 'Start time is required'),
    endTime: z.string().min(1, 'End time is required'),
}).refine((data) => data.startTime < data.endTime, {
    message: 'End time must be after start time',
    path: ['endTime'],
});

type TimeBlockForm = z.infer<typeof timeBlockSchema>;

function getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
}

function formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatDateInputValue(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

export function Calendar() {
    const queryClient = useQueryClient();
    const [searchParams, setSearchParams] = useSearchParams();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [deleteBlock, setDeleteBlock] = useState<TimeBlock | null>(null);

    const weekStart = getWeekStart(currentDate);
    const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);

    const { data: timeBlocks, isLoading } = useQuery({
        queryKey: ['time-blocks', weekStart.toISOString()],
        queryFn: () => timeBlocksService.getAll({
            startDate: weekStart.toISOString(),
            endDate: weekEnd.toISOString(),
        }),
    });

    const createMutation = useMutation({
        mutationFn: timeBlocksService.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['time-blocks'] });
            toast.success('Time block created');
            closeModal();
        },
        onError: (error: { response?: { data?: ApiError } }) => {
            const message = error.response?.data?.error?.message || 'Failed to create time block';
            toast.error(message);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: timeBlocksService.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['time-blocks'] });
            toast.success('Time block deleted');
            setDeleteBlock(null);
        },
        onError: () => toast.error('Failed to delete time block'),
    });

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<TimeBlockForm>({
        resolver: zodResolver(timeBlockSchema),
    });

    useEffect(() => {
        if (searchParams.get('new') !== 'true') {
            return;
        }

        reset({
            date: formatDateInputValue(new Date()),
            title: '',
            description: '',
            startTime: '09:00',
            endTime: '10:00',
        });
        setIsModalOpen(true);

        const nextParams = new URLSearchParams(searchParams);
        nextParams.delete('new');
        setSearchParams(nextParams, { replace: true });
    }, [reset, searchParams, setSearchParams]);

    const days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(weekStart);
        date.setDate(date.getDate() + i);
        return date;
    });

    const navigateWeek = (direction: 'prev' | 'next') => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        setCurrentDate(newDate);
    };

    const goToToday = () => setCurrentDate(new Date());

    const openCreateModal = (date = new Date()) => {
        reset({
            date: formatDateInputValue(date),
            title: '',
            description: '',
            startTime: '09:00',
            endTime: '10:00',
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        reset();
    };

    const onSubmit = (data: TimeBlockForm) => {
        const payload: CreateTimeBlockRequest = {
            title: data.title,
            description: data.description,
            startAt: new Date(`${data.date}T${data.startTime}`).toISOString(),
            endAt: new Date(`${data.date}T${data.endTime}`).toISOString(),
        };
        createMutation.mutate(payload);
    };

    const getBlocksForDay = (day: Date) => {
        return timeBlocks?.filter((block) => {
            const blockDate = new Date(block.startAt);
            return blockDate.toDateString() === day.toDateString();
        }) || [];
    };

    const isToday = (date: Date) => date.toDateString() === new Date().toDateString();

    return (
        <div>
            <PageHeader
                title="Calendar"
                description="Schedule your time blocks"
                actions={
                    <Button onClick={() => openCreateModal()}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Time Block
                    </Button>
                }
            />

            {/* Calendar Header */}
            <div className="bg-[var(--surface-1)] border border-[var(--border)] shadow-[var(--shadow-md)] rounded-xl backdrop-blur-xl mb-6">
                <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => navigateWeek('prev')}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                            aria-label="Previous week"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => navigateWeek('next')}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                            aria-label="Next week"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                        <h2 className="text-lg font-semibold text-[var(--text)] ml-2">
                            {formatDate(weekStart)} - {formatDate(new Date(weekEnd.getTime() - 1))}
                        </h2>
                    </div>
                    <Button variant="secondary" size="sm" onClick={goToToday}>
                        Today
                    </Button>
                </div>

                {/* Calendar Grid */}
                {isLoading ? (
                    <div className="p-4">
                        <div className="grid grid-cols-7 gap-2">
                            {Array.from({ length: 7 }).map((_, i) => (
                                <div key={i} className="h-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-7 divide-x divide-[var(--border)]">
                        {days.map((day) => {
                            const dayBlocks = getBlocksForDay(day);
                            const today = isToday(day);

                            return (
                                <div
                                    key={day.toISOString()}
                                    className={clsx(
                                        'min-h-[200px] p-2',
                                        today && 'bg-primary-50 dark:bg-primary-900/10'
                                    )}
                                >
                                    {/* Day Header */}
                                    <div className="text-center mb-2">
                                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">
                                            {day.toLocaleDateString('en-US', { weekday: 'short' })}
                                        </p>
                                        <p
                                            className={clsx(
                                                'text-lg font-semibold',
                                                today
                                                    ? 'text-primary-600 dark:text-primary-400'
                                                    : 'text-gray-900 dark:text-white'
                                            )}
                                        >
                                            {day.getDate()}
                                        </p>
                                    </div>

                                    {/* Time Blocks */}
                                    <div className="space-y-1">
                                        {dayBlocks.length === 0 ? (
                                            <button
                                                onClick={() => openCreateModal(day)}
                                                className="w-full p-2 text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                                            >
                                                + Add block
                                            </button>
                                        ) : (
                                            dayBlocks.map((block) => (
                                                <div
                                                    key={block.id}
                                                    className="group relative p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg text-xs"
                                                >
                                                    <p className="font-medium text-primary-800 dark:text-primary-300 truncate">
                                                        {block.title}
                                                    </p>
                                                    <p className="text-primary-600 dark:text-primary-400">
                                                        {new Date(block.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        {' - '}
                                                        {new Date(block.endAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                    <button
                                                        onClick={() => setDeleteBlock(block)}
                                                        className="absolute top-1 right-1 p-1 opacity-0 group-hover:opacity-100 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-opacity"
                                                        aria-label="Delete time block"
                                                    >
                                                        <Trash2 className="w-3 h-3 text-red-600" />
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Create Modal */}
            <Modal isOpen={isModalOpen} onClose={closeModal} title="Add Time Block">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <label className="label">Title</label>
                        <Input
                            {...register('title')}
                            error={errors.title?.message}
                            placeholder="e.g., Focus time, Meeting"
                        />
                        {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title.message}</p>}
                    </div>

                    <div>
                        <label className="label">Description</label>
                        <textarea
                            {...register('description')}
                            className="input min-h-[80px] resize-none"
                            placeholder="Optional description"
                        />
                    </div>

                    <div>
                        <label className="label">Date</label>
                        <Input
                            type="date"
                            {...register('date')}
                            error={errors.date?.message}
                        />
                        {errors.date && <p className="mt-1 text-sm text-red-500">{errors.date.message}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label">Start Time</label>
                            <Input
                                type="time"
                                {...register('startTime')}
                                error={errors.startTime?.message}
                            />
                            {errors.startTime && <p className="mt-1 text-sm text-red-500">{errors.startTime.message}</p>}
                        </div>
                        <div>
                            <label className="label">End Time</label>
                            <Input
                                type="time"
                                {...register('endTime')}
                                error={errors.endTime?.message}
                            />
                            {errors.endTime && <p className="mt-1 text-sm text-red-500">{errors.endTime.message}</p>}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="secondary" onClick={closeModal}>
                            Cancel
                        </Button>
                        <Button type="submit" loading={createMutation.isPending}>
                            Create
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation */}
            <ConfirmDialog
                open={!!deleteBlock}
                onClose={() => setDeleteBlock(null)}
                onConfirm={() => deleteBlock && deleteMutation.mutate(deleteBlock.id)}
                title="Delete Time Block"
                message={`Are you sure you want to delete "${deleteBlock?.title}"? This action cannot be undone.`}
                confirmText="Delete"
                variant="danger"
                loading={deleteMutation.isPending}
            />
        </div>
    );
}
