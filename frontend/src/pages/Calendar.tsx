import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { CalendarBoard } from '../components/planner/CalendarBoard';
import { GoogleCalendarConnection } from '../components/planner/GoogleCalendarConnection';
import { CalendarWeather } from '../components/planner/CalendarWeather';
import { TaskReminderSettings } from '../components/planner/TaskReminderSettings';
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

function formatDateInputValue(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

export function Calendar() {
    const queryClient = useQueryClient();
    const [searchParams, setSearchParams] = useSearchParams();
    const [integrationsOpen, setIntegrationsOpen] = useState(() => searchParams.has('state'));
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [deleteBlock, setDeleteBlock] = useState<TimeBlock | null>(null);
    const [createError, setCreateError] = useState<string | null>(null);

    const createMutation = useMutation({
        mutationFn: timeBlocksService.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['time-blocks'] });
            queryClient.invalidateQueries({ queryKey: ['planning'] });
            toast.success('Time block created');
            closeModal();
        },
        onError: (error: { response?: { data?: ApiError } }) => {
            const apiError = error.response?.data?.error;
            const message = apiError?.code === 'TIME_BLOCK_OVERLAP'
                ? 'Khung giờ này trùng với một block đã có. Hãy chọn giờ bắt đầu hoặc kết thúc khác.'
                : apiError?.message || 'Không thể tạo block. Vui lòng thử lại.';
            setCreateError(message);
            toast.error(message);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: timeBlocksService.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['time-blocks'] });
            queryClient.invalidateQueries({ queryKey: ['planning'] });
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

    const openCreateModal = (date = new Date()) => {
        setCreateError(null);
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
        setCreateError(null);
        reset();
    };

    const onSubmit = (data: TimeBlockForm) => {
        setCreateError(null);
        const payload: CreateTimeBlockRequest = {
            title: data.title,
            description: data.description,
            startAt: new Date(`${data.date}T${data.startTime}`).toISOString(),
            endAt: new Date(`${data.date}T${data.endTime}`).toISOString(),
        };
        createMutation.mutate(payload);
    };

    return (
        <div>
            <PageHeader
                title="Lịch công việc"
                description="Thời khóa biểu thống nhất cho task, project và các khối thời gian của bạn."
                actions={
                    <Button onClick={() => openCreateModal()}>
                        <Plus className="w-4 h-4 mr-2" />
                        Thêm khối thời gian
                    </Button>
                }
            />

            <details open={integrationsOpen} onToggle={e => setIntegrationsOpen(e.currentTarget.open)} className="mb-5 rounded-xl border border-[var(--border)] p-4">
                <summary className="cursor-pointer font-semibold">Kết nối lịch, nhắc việc và thời tiết</summary>
                <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4"><GoogleCalendarConnection /><TaskReminderSettings /><div className="lg:col-span-2 min-w-0"><CalendarWeather /></div></div>
            </details>
            <CalendarBoard onCreate={openCreateModal} onDelete={setDeleteBlock} />

            {/* Create Modal */}
            <Modal isOpen={isModalOpen} onClose={closeModal} title="Thêm khối thời gian">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {createError && <p role="alert" className="text-sm text-red-500">{createError}</p>}
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
