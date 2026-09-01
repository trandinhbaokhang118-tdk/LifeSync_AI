import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, Clock, Bell, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';
import { PageHeader } from '../components/layout';
import { Button, Input, Modal, ConfirmDialog, EmptyState, ListSkeleton } from '../components/ui';
import { remindersService } from '../services/reminders.service';
import type { Reminder, CreateReminderRequest } from '../types';

const reminderSchema = z.object({
    message: z.string().min(1, 'Message is required'),
    date: z.string().min(1, 'Date is required'),
    time: z.string().min(1, 'Time is required'),
});

type ReminderForm = z.infer<typeof reminderSchema>;

export function Reminders() {
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [deleteReminder, setDeleteReminder] = useState<Reminder | null>(null);

    const { data: reminders, isLoading, isError, refetch } = useQuery({
        queryKey: ['reminders'],
        queryFn: remindersService.getAll,
    });

    const createMutation = useMutation({
        mutationFn: remindersService.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['reminders'] });
            toast.success('Reminder created');
            closeModal();
        },
        onError: () => toast.error('Failed to create reminder'),
    });

    const deleteMutation = useMutation({
        mutationFn: remindersService.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['reminders'] });
            toast.success('Reminder deleted');
            setDeleteReminder(null);
        },
        onError: () => toast.error('Failed to delete reminder'),
    });

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<ReminderForm>({
        resolver: zodResolver(reminderSchema),
    });

    const openModal = () => {
        reset({ message: '', date: '', time: '' });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        reset();
    };

    const onSubmit = (data: ReminderForm) => {
        const payload: CreateReminderRequest = {
            message: data.message,
            triggerAt: new Date(`${data.date}T${data.time}`).toISOString(),
        };
        createMutation.mutate(payload);
    };

    const upcomingReminders = reminders?.filter((r) => !r.triggered) || [];
    const triggeredReminders = reminders?.filter((r) => r.triggered) || [];

    return (
        <div>
            <PageHeader
                title="Reminders"
                description="Set reminders for important tasks"
                actions={
                    <Button onClick={openModal}>
                        <Plus className="w-4 h-4" />
                        New Reminder
                    </Button>
                }
            />

            {isLoading ? (
                <ListSkeleton count={3} />
            ) : isError ? (
                <div className="card p-8 text-center">
                    <p className="text-red-600 mb-4">Failed to load reminders</p>
                    <Button onClick={() => refetch()}>Retry</Button>
                </div>
            ) : reminders?.length === 0 ? (
                <EmptyState
                    icon={<Bell className="w-full h-full" />}
                    title="No reminders"
                    description="Create a reminder to stay on track"
                    action={{ label: 'Create Reminder', onClick: openModal }}
                />
            ) : (
                <div className="space-y-6">
                    {/* Upcoming Reminders */}
                    {upcomingReminders.length > 0 && (
                        <div>
                            <h2 className="text-lg font-semibold text-[var(--text)] mb-3">
                                Upcoming
                            </h2>
                            <div className="space-y-3">
                                {upcomingReminders.map((reminder) => (
                                    <ReminderCard
                                        key={reminder.id}
                                        reminder={reminder}
                                        onDelete={() => setDeleteReminder(reminder)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Triggered Reminders */}
                    {triggeredReminders.length > 0 && (
                        <div>
                            <h2 className="text-lg font-semibold text-[var(--text-2)] mb-3">
                                Triggered
                            </h2>
                            <div className="space-y-3 opacity-60">
                                {triggeredReminders.map((reminder) => (
                                    <ReminderCard
                                        key={reminder.id}
                                        reminder={reminder}
                                        onDelete={() => setDeleteReminder(reminder)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Create Modal */}
            <Modal isOpen={isModalOpen} onClose={closeModal} title="New Reminder">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <label className="label">Message</label>
                        <textarea
                            {...register('message')}
                            className="input min-h-[100px] resize-none"
                            placeholder="What do you want to be reminded about?"
                        />
                        {errors.message && (
                            <p className="mt-1 text-sm text-red-600">{errors.message.message}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label">Date</label>
                            <Input
                                type="date"
                                {...register('date')}
                                error={errors.date?.message}
                            />
                        </div>
                        <div>
                            <label className="label">Time</label>
                            <Input
                                type="time"
                                {...register('time')}
                                error={errors.time?.message}
                            />
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
                open={!!deleteReminder}
                onClose={() => setDeleteReminder(null)}
                onConfirm={() => deleteReminder && deleteMutation.mutate(deleteReminder.id)}
                title="Delete Reminder"
                message="Are you sure you want to delete this reminder?"
                confirmText="Delete"
                loading={deleteMutation.isPending}
            />
        </div>
    );
}

function ReminderCard({ reminder, onDelete }: { reminder: Reminder; onDelete: () => void }) {
    const isPast = new Date(reminder.triggerAt) < new Date();

    return (
        <div className="card p-4">
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                    <div className={clsx(
                        'p-2 rounded-lg',
                        reminder.triggered
                            ? 'bg-green-100 dark:bg-green-900/30'
                            : 'bg-primary-100 dark:bg-primary-900/30'
                    )}>
                        {reminder.triggered ? (
                            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                        ) : (
                            <Clock className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                        )}
                    </div>
                    <div>
                        <p className="font-medium text-[var(--text)]">
                            {reminder.message}
                        </p>
                        <p className={clsx(
                            'text-sm',
                            isPast && !reminder.triggered
                                ? 'text-red-600 dark:text-red-400'
                                : 'text-[var(--text-2)]'
                        )}>
                            {new Date(reminder.triggerAt).toLocaleString()}
                            {reminder.triggered && ' (triggered)'}
                        </p>
                    </div>
                </div>
                <button
                    onClick={onDelete}
                    className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-600 transition-colors"
                    aria-label="Delete reminder"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
