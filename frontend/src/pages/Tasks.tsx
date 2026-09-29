import {
    useEffect,
    useMemo,
    useState,
    type CSSProperties,
} from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    AnimatePresence,
    motion,
} from 'framer-motion';
import type { DragEndEvent } from '@dnd-kit/core';
import {
    closestCenter,
    DndContext,
    KeyboardSensor,
    MouseSensor,
    TouchSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    Plus,
    Search,
    MoreVertical,
    Edit,
    Trash2,
    CheckCircle,
    X,
    Sparkles,
    Loader2,
} from 'lucide-react';
import {
    Button,
    Input,
    Badge,
    StatusBadge,
    PriorityBadge,
    SkeletonList,
    EmptyTasks,
    ErrorState,
} from '../components/ui';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '../components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../components/ui/Select';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { AIScheduleModal } from '../components/ai-schedule/AIScheduleModal';
import { showToast } from '../components/ui/toast';
import { tasksService } from '../services/tasks.service';
import { fadeInUp, staggerContainer } from '../lib/animations';
import { cn, formatDate, isOverdue } from '../lib/utils';
import { DateTimePicker } from '../components/ui/DateTimePicker';
import { useAuthStore } from '../store/auth.store';
import './tasks-interactions.css';
import type {
    Task,
    TaskStatus,
    TaskPriority,
    CreateTaskRequest,
} from '../types';

const taskSchema = z
    .object({
        title: z.string().min(1, 'Tiêu đề không được để trống'),
        description: z.string().optional(),
        status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']),
        priority: z.enum(['LOW', 'MEDIUM', 'HIGH']),
        cardColor: z.enum(['AUTO', 'CYAN', 'VIOLET', 'AMBER', 'ROSE', 'GREEN']).optional(),
        startAt: z.string().min(1, 'Vui lòng chọn thời gian bắt đầu'),
        dueAt: z.string().min(1, 'Vui lòng chọn thời gian kết thúc'),
        reminderMinutes: z.number().min(5).max(1440).optional(),
    })
    .refine(
        (data) => {
            // dueAt must be after startAt
            return new Date(data.dueAt) > new Date(data.startAt);
        },
        {
            message: 'Thời gian kết thúc phải sau thời gian bắt đầu',
            path: ['dueAt'],
        },
    );

type TaskForm = z.infer<typeof taskSchema>;
type SortableHookResult = ReturnType<typeof useSortable>;

const cardColors = [
    { value: 'AUTO', label: 'Theo mức ưu tiên' },
    { value: 'CYAN', label: 'Xanh biển' },
    { value: 'VIOLET', label: 'Tím' },
    { value: 'AMBER', label: 'Hổ phách' },
    { value: 'ROSE', label: 'Hồng' },
    { value: 'GREEN', label: 'Xanh lá' },
] as const;

function getTaskOrderStorageKey(userId?: string) {
    return `tasks-order:${userId ?? 'guest'}`;
}

function readTaskOrder(storageKey: string) {
    if (typeof window === 'undefined') {
        return [];
    }

    try {
        const raw = localStorage.getItem(storageKey);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed)
            ? parsed.filter((item): item is string => typeof item === 'string')
            : [];
    } catch {
        return [];
    }
}

function persistTaskOrder(storageKey: string, order: string[]) {
    if (typeof window === 'undefined') {
        return;
    }

    localStorage.setItem(storageKey, JSON.stringify(order));
}

function mergeTaskOrder(currentOrder: string[], incomingIds: string[]) {
    const seen = new Set<string>();
    const next: string[] = [];

    for (const id of currentOrder) {
        if (!seen.has(id)) {
            seen.add(id);
            next.push(id);
        }
    }

    for (const id of incomingIds) {
        if (!seen.has(id)) {
            seen.add(id);
            next.push(id);
        }
    }

    return next;
}

function sameOrder(left: string[], right: string[]) {
    return (
        left.length === right.length &&
        left.every((id, index) => id === right[index])
    );
}

function applyTaskOrder(tasks: Task[], taskOrder: string[]) {
    const taskMap = new Map(tasks.map((task) => [task.id, task]));
    const ordered = taskOrder
        .map((id) => taskMap.get(id))
        .filter((task): task is Task => Boolean(task));
    const orderedIds = new Set(ordered.map((task) => task.id));
    const remaining = tasks.filter((task) => !orderedIds.has(task.id));

    return [...ordered, ...remaining];
}

function patchVisibleOrder(currentOrder: string[], visibleOrder: string[]) {
    const visibleIds = new Set(visibleOrder);
    let visibleIndex = 0;

    return currentOrder.map((id) => {
        if (!visibleIds.has(id)) {
            return id;
        }

        const nextVisibleId = visibleOrder[visibleIndex];
        visibleIndex += 1;
        return nextVisibleId ?? id;
    });
}

export function Tasks() {
    const queryClient = useQueryClient();
    const [searchParams, setSearchParams] = useSearchParams();
    const { user } = useAuthStore();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [priorityFilter, setPriorityFilter] = useState<string>('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAIModalOpen, setIsAIModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [deleteTask, setDeleteTask] = useState<Task | null>(null);
    const [taskOrder, setTaskOrder] = useState<string[]>([]);
    const taskOrderStorageKey = getTaskOrderStorageKey(user?.id);

    const sensors = useSensors(
        useSensor(MouseSensor, {
            activationConstraint: { distance: 6 },
        }),
        useSensor(TouchSensor, {
            activationConstraint: { delay: 320, tolerance: 10 },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
    );

    const {
        data: tasksData,
        isLoading,
        isError,
        refetch,
    } = useQuery({
        queryKey: [
            'tasks',
            { search, status: statusFilter, priority: priorityFilter },
        ],
        queryFn: () =>
            tasksService.getAll({
                search: search || undefined,
                status:
                    statusFilter !== 'all'
                        ? (statusFilter as TaskStatus)
                        : undefined,
                priority:
                    priorityFilter !== 'all'
                        ? (priorityFilter as TaskPriority)
                        : undefined,
            }),
    });

    const tasks = useMemo(() => tasksData?.data ?? [], [tasksData?.data]);
    const taskIds = useMemo(() => tasks.map((task) => task.id), [tasks]);
    const orderedTasks = useMemo(
        () => applyTaskOrder(tasks, taskOrder),
        [tasks, taskOrder],
    );

    useEffect(() => {
        setTaskOrder(readTaskOrder(taskOrderStorageKey));
    }, [taskOrderStorageKey]);

    useEffect(() => {
        if (taskIds.length === 0) {
            return;
        }

        setTaskOrder((currentOrder) => {
            const nextOrder = mergeTaskOrder(currentOrder, taskIds);

            if (sameOrder(currentOrder, nextOrder)) {
                return currentOrder;
            }

            persistTaskOrder(taskOrderStorageKey, nextOrder);
            return nextOrder;
        });
    }, [taskIds, taskOrderStorageKey]);

    const createMutation = useMutation({
        mutationFn: tasksService.create,
        onSuccess: (createdTask) => {
            setTaskOrder((currentOrder) => {
                const nextOrder = [
                    createdTask.id,
                    ...currentOrder.filter((id) => id !== createdTask.id),
                ];
                persistTaskOrder(taskOrderStorageKey, nextOrder);
                return nextOrder;
            });
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            showToast.success('Tạo công việc thành công');
            closeModal();
        },
        onError: () => showToast.error('Không thể tạo công việc'),
    });

    const updateMutation = useMutation({
        mutationFn: ({
            id,
            data,
        }: {
            id: string;
            data: Partial<CreateTaskRequest>;
        }) => tasksService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            showToast.success('Cập nhật thành công');
            closeModal();
        },
        onError: () => showToast.error('Không thể cập nhật'),
    });

    const deleteMutation = useMutation({
        mutationFn: tasksService.delete,
        onSuccess: (_result, deletedId) => {
            setTaskOrder((currentOrder) => {
                const nextOrder = currentOrder.filter((id) => id !== deletedId);
                persistTaskOrder(taskOrderStorageKey, nextOrder);
                return nextOrder;
            });
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            showToast.success('Đã xóa công việc');
            setDeleteTask(null);
        },
        onError: () => showToast.error('Không thể xóa'),
    });

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors },
    } = useForm<TaskForm>({
        resolver: zodResolver(taskSchema),
        defaultValues: { status: 'TODO', priority: 'MEDIUM' },
    });

    useEffect(() => {
        if (searchParams.get('new') !== 'true') {
            return;
        }

        setEditingTask(null);
        reset({
            status: 'TODO',
            priority: 'MEDIUM',
            title: '',
            description: '',
            dueAt: '',
        });
        setIsModalOpen(true);

        const nextParams = new URLSearchParams(searchParams);
        nextParams.delete('new');
        setSearchParams(nextParams, { replace: true });
    }, [reset, searchParams, setSearchParams]);

    const openCreateModal = () => {
        setEditingTask(null);
        reset({
            status: 'TODO',
            priority: 'MEDIUM',
            title: '',
            description: '',
            dueAt: '',
        });
        setIsModalOpen(true);
    };

    const openEditModal = (task: Task) => {
        setEditingTask(task);
        reset({
            title: task.title,
            description: task.description || '',
            status: task.status,
            priority: task.priority,
            cardColor: task.cardColor ?? 'AUTO',
            startAt: task.startAt
                ? new Date(task.startAt).toISOString()
                : '',
            dueAt: task.dueAt
                ? new Date(task.dueAt).toISOString()
                : '',
            reminderMinutes: task.reminderMinutes || 15,
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingTask(null);
        reset({ status: 'TODO', priority: 'MEDIUM', reminderMinutes: 15 });
    };

    const onSubmit = (data: TaskForm) => {
        const payload: CreateTaskRequest = {
            ...data,
            startAt: new Date(data.startAt).toISOString(),
            dueAt: new Date(data.dueAt).toISOString(),
            reminderMinutes: data.reminderMinutes || 15,
            cardColor: data.cardColor ?? 'AUTO',
        };
        if (editingTask) {
            updateMutation.mutate({ id: editingTask.id, data: payload });
        } else {
            createMutation.mutate(payload);
        }
    };

    const statusMutation = useMutation({
        mutationFn: (task: Task) => tasksService.update(task.id, {
            status: task.status === 'DONE' ? 'TODO' : 'DONE',
        }),
        onSuccess: (_updated, task) => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
            showToast.success(task.status === 'DONE' ? 'Đã mở lại công việc' : 'Đã hoàn thành công việc');
        },
        onError: () => showToast.error('Chưa cập nhật được trạng thái. Hãy thử lại.'),
    });
    const markAsDone = (task: Task) => statusMutation.mutate(task);

    const handleSortEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over || active.id === over.id) {
            return;
        }

        const activeId = String(active.id);
        const overId = String(over.id);
        const oldIndex = orderedTasks.findIndex((task) => task.id === activeId);
        const newIndex = orderedTasks.findIndex((task) => task.id === overId);

        if (oldIndex < 0 || newIndex < 0) {
            return;
        }

        const nextVisibleOrder = arrayMove(
            orderedTasks.map((task) => task.id),
            oldIndex,
            newIndex,
        );

        setTaskOrder((currentOrder) => {
            const mergedOrder = mergeTaskOrder(currentOrder, taskIds);
            const nextOrder = patchVisibleOrder(mergedOrder, nextVisibleOrder);
            persistTaskOrder(taskOrderStorageKey, nextOrder);
            return nextOrder;
        });
    };

    const hasFilters =
        statusFilter !== 'all' || priorityFilter !== 'all' || search;

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="space-y-6 pb-20 md:pb-0 "
        >
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
            >
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text)]">
                        Công việc
                    </h1>
                    <p className="text-[var(--text-2)]">
                        Tạo task, đặt ưu tiên và theo dõi tiến độ. Công việc có thời gian sẽ tự hiển thị trên Lịch.
                    </p>
                </div>
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    className="flex flex-wrap gap-2"
                >
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <Button
                            variant="outline"
                            onClick={() => setIsAIModalOpen(true)}
                            className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-700"
                        >
                            <Sparkles className="w-4 h-4 mr-2 text-purple-600 dark:text-purple-400" />
                            <span className="text-purple-700 dark:text-purple-300">
                                Sắp xếp bằng AI
                            </span>
                        </Button>
                    </motion.div>
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <Button onClick={openCreateModal}>
                            <Plus className="w-4 h-4 mr-2" />
                            Tạo mới
                        </Button>
                    </motion.div>
                </motion.div>
            </motion.div>

            {/* Filters */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="bg-[var(--surface-1)] border border-[var(--border)] shadow-[var(--shadow-md)] rounded-xl backdrop-blur-xl p-4"
            >
                <div className="flex flex-col gap-3 rounded-lg bg-[var(--surface-3)] p-2 sm:flex-row">
                    <div className="flex-1">
                        <Input
                            placeholder="Tìm kiếm công việc..."
                            icon={
                                <div className="w-5 h-5 justify-center">
                                    <Search
                                        className="w-4 h-4 text-[var(--text-2)]"
                                        strokeWidth={2}
                                    />
                                </div>
                            }
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Select
                            value={statusFilter}
                            onValueChange={setStatusFilter}
                        >
                            <SelectTrigger className="w-[140px] bg-[var(--input-bg)] text-[var(--input-text)]">
                                <SelectValue placeholder="Trạng thái" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tất cả</SelectItem>
                                <SelectItem value="TODO">Chưa làm</SelectItem>
                                <SelectItem value="IN_PROGRESS">
                                    Đang làm
                                </SelectItem>
                                <SelectItem value="DONE">Hoàn thành</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select
                            value={priorityFilter}
                            onValueChange={setPriorityFilter}
                        >
                            <SelectTrigger className="w-[140px] bg-[var(--input-bg)] text-[var(--input-text)]">
                                <SelectValue placeholder="Độ ưu tiên" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tất cả</SelectItem>
                                <SelectItem value="HIGH">Cao</SelectItem>
                                <SelectItem value="MEDIUM">
                                    Trung bình
                                </SelectItem>
                                <SelectItem value="LOW">Thấp</SelectItem>
                            </SelectContent>
                        </Select>
                        {hasFilters && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                    setSearch('');
                                    setStatusFilter('all');
                                    setPriorityFilter('all');
                                }}
                            >
                                <X className="w-4 h-4 " />
                            </Button>
                        )}
                    </div>
                </div>
            </motion.div>

            {/* Task List */}
            {isLoading ? (
                <SkeletonList count={5} />
            ) : isError ? (
                <ErrorState onRetry={refetch} />
            ) : tasks.length === 0 ? (
                <EmptyTasks onAdd={openCreateModal} />
            ) : (
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleSortEnd}
                >
                    <SortableContext
                        items={orderedTasks.map((task) => task.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        <motion.div
                            variants={staggerContainer}
                            initial="hidden"
                            animate="visible"
                            className="space-y-3"
                        >
                            <AnimatePresence mode="popLayout">
                                {orderedTasks.map((task) => (
                                    <SortableTaskCard
                                        key={task.id}
                                        task={task}
                                        isUpdating={statusMutation.isPending && statusMutation.variables?.id === task.id}
                                        onEdit={() => openEditModal(task)}
                                        onDelete={() => setDeleteTask(task)}
                                        onMarkDone={() => markAsDone(task)}
                                    />
                                ))}
                            </AnimatePresence>
                        </motion.div>
                    </SortableContext>
                </DndContext>
            )}

            {/* Create/Edit Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="task-edit-dialog max-h-[90svh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {editingTask
                                ? 'Chỉnh sửa công việc'
                                : 'Tạo công việc mới'}
                        </DialogTitle>
                        <DialogDescription>
                            {editingTask
                                ? 'Cập nhật thông tin chi tiết cho công việc của bạn.'
                                : 'Điền thông tin để tạo một công việc mới.'}
                        </DialogDescription>
                    </DialogHeader>
                    <form
                        onSubmit={handleSubmit(onSubmit)}
                        className="space-y-4"
                    >
                        <div>
                            <label className="label">Tiêu đề</label>
                            <Input
                                {...register('title')}
                                placeholder="Nhập tiêu đề"
                                error={!!errors.title}
                            />
                            {errors.title && (
                                <p className="mt-1 text-sm text-red-500">
                                    {errors.title.message}
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="label">Mô tả</label>
                            <textarea
                                {...register('description')}
                                className="task-description-input"
                                aria-label="Mô tả"
                                placeholder="Mô tả (tùy chọn)"
                            />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="label">Trạng thái</label>
                                <Select
                                    value={watch('status')}
                                    onValueChange={(v) =>
                                        setValue('status', v as TaskStatus)
                                    }
                                >
                                    <SelectTrigger aria-label="Trạng thái">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="TODO">
                                            Chưa làm
                                        </SelectItem>
                                        <SelectItem value="IN_PROGRESS">
                                            Đang làm
                                        </SelectItem>
                                        <SelectItem value="DONE">
                                            Hoàn thành
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="label">Độ ưu tiên</label>
                                <Select
                                    value={watch('priority')}
                                    onValueChange={(v) =>
                                        setValue('priority', v as TaskPriority)
                                    }
                                >
                                    <SelectTrigger aria-label="Độ ưu tiên">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="HIGH">
                                            Cao
                                        </SelectItem>
                                        <SelectItem value="MEDIUM">
                                            Trung bình
                                        </SelectItem>
                                        <SelectItem value="LOW">
                                            Thấp
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <fieldset className="task-color-picker">
                            <legend className="label">Màu thẻ</legend>
                            <div className="task-color-options">
                                {cardColors.map(({ value, label }) => (
                                    <button key={value} type="button" data-color={value}
                                        aria-pressed={(watch('cardColor') ?? 'AUTO') === value}
                                        onClick={() => setValue('cardColor', value, { shouldDirty: true })}>
                                        <span className="task-color-dot" aria-hidden="true" />{label}
                                    </button>
                                ))}
                            </div>
                            <p className="text-xs text-[var(--text-2)] mt-2">Màu chỉ áp dụng cho nền và viền thẻ; chữ giữ màu theo chế độ sáng/tối.</p>
                        </fieldset>
                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <DateTimePicker className="task-datetime-field"
                                    label={
                                        <>
                                            Thời gian bắt đầu{' '}
                                            <span className="text-red-500">
                                                *
                                            </span>
                                        </>
                                    }
                                    value={
                                        watch('startAt')
                                            ? new Date(watch('startAt'))
                                            : undefined
                                    }
                                    onChange={(date) =>
                                        setValue('startAt', date.toISOString())
                                    }
                                />
                                {errors.startAt && (
                                    <p className="mt-1 text-sm text-red-500">
                                        {errors.startAt.message}
                                    </p>
                                )}
                            </div>
                            <div>
                                <DateTimePicker className="task-datetime-field"
                                    label={
                                        <>
                                            Thời gian kết thúc{' '}
                                            <span className="text-red-500">
                                                *
                                            </span>
                                        </>
                                    }
                                    value={
                                        watch('dueAt')
                                            ? new Date(watch('dueAt'))
                                            : undefined
                                    }
                                    onChange={(date) =>
                                        setValue('dueAt', date.toISOString())
                                    }
                                />
                                {errors.dueAt && (
                                    <p className="mt-1 text-sm text-red-500">
                                        {errors.dueAt.message}
                                    </p>
                                )}
                            </div>
                        </div>
                        <div>
                            <label className="label">Nhắc trước (phút)</label>
                            <Select
                                value={
                                    watch('reminderMinutes')?.toString() || '15'
                                }
                                onValueChange={(v) =>
                                    setValue('reminderMinutes', parseInt(v))
                                }
                            >
                                <SelectTrigger aria-label="Nhắc trước">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="5">5 phút</SelectItem>
                                    <SelectItem value="10">10 phút</SelectItem>
                                    <SelectItem value="15">15 phút</SelectItem>
                                    <SelectItem value="30">30 phút</SelectItem>
                                    <SelectItem value="60">1 giờ</SelectItem>
                                    <SelectItem value="120">2 giờ</SelectItem>
                                    <SelectItem value="1440">1 ngày</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-[var(--text-2)] mt-1">
                                Hệ thống sẽ gửi thông báo nhắc nhở trước khi
                                công việc bắt đầu
                            </p>
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={closeModal}
                            >
                                Hủy
                            </Button>
                            <Button
                                type="submit"
                                loading={
                                    createMutation.isPending ||
                                    updateMutation.isPending
                                }
                            >
                                {editingTask ? 'Cập nhật' : 'Tạo'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <ConfirmDialog
                open={!!deleteTask}
                onClose={() => setDeleteTask(null)}
                title="Xóa công việc"
                message={`Bạn có chắc muốn xóa "${deleteTask?.title}"? Hành động này không thể hoàn tác.`}
                confirmText="Xóa"
                variant="danger"
                loading={deleteMutation.isPending}
                onConfirm={() =>
                    deleteTask && deleteMutation.mutate(deleteTask.id)
                }
            />

            {/* AI Schedule Modal */}
            <AIScheduleModal
                open={isAIModalOpen}
                onOpenChange={setIsAIModalOpen}
            />
        </motion.div>
    );
}

// Task Card Component
function SortableTaskCard({
    task,
    isUpdating,
    onEdit,
    onDelete,
    onMarkDone,
}: {
    task: Task;
    isUpdating: boolean;
    onEdit: () => void;
    onDelete: () => void;
    onMarkDone: () => void;
}) {
    const {
        attributes,
        isDragging,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: task.id, disabled: isUpdating });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 20 : undefined,
    };

    return (
        <TaskCard
            refCallback={setNodeRef}
            style={style}
            task={task}
            isSorting={isDragging}
            isUpdating={isUpdating}
            dragAttributes={attributes}
            dragListeners={listeners}
            onEdit={onEdit}
            onDelete={onDelete}
            onMarkDone={onMarkDone}
        />
    );
}

function TaskCard({
    dragAttributes,
    dragListeners,
    isSorting,
    isUpdating,
    onEdit,
    onDelete,
    onMarkDone,
    refCallback,
    style,
    task,
}: {
    dragAttributes: SortableHookResult['attributes'];
    dragListeners: SortableHookResult['listeners'];
    isSorting: boolean;
    isUpdating: boolean;
    onEdit: () => void;
    onDelete: () => void;
    onMarkDone: () => void;
    refCallback: (node: HTMLElement | null) => void;
    style: CSSProperties;
    task: Task;
}) {
    const overdue = task.status !== 'DONE' && isOverdue(task.dueAt);
    const ignoreControl = (target: EventTarget | null) => target instanceof Element &&
        Boolean(target.closest('button, a, input, textarea, select, [role="menuitem"]'));

    return (
        <div ref={refCallback} style={style} className="task-sort-wrapper">
            <div
                {...dragAttributes}
                {...dragListeners}
                role="group"
                aria-roledescription="thẻ công việc có thể sắp xếp"
                aria-label={`${task.title}. Nhấn phím cách rồi dùng mũi tên để di chuyển.`}
                aria-busy={isUpdating}
                onMouseDown={(event) => { if (!ignoreControl(event.target)) dragListeners?.onMouseDown?.(event); }}
                onTouchStart={(event) => { if (!ignoreControl(event.target)) dragListeners?.onTouchStart?.(event); }}
                onKeyDown={(event) => { if (!ignoreControl(event.target)) dragListeners?.onKeyDown?.(event); }}
                data-status={task.status}
                data-priority={task.priority}
                data-color={task.cardColor ?? 'AUTO'}
                data-sorting={isSorting}
                data-task-id={task.id}
                className="task-interactive-card"
            >
                <div className="task-card-layout flex items-start gap-3">
                    <motion.button
                        type="button"
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(event) => { event.stopPropagation(); onMarkDone(); }}
                        disabled={isUpdating}
                        aria-label={task.status === 'DONE' ? `Mở lại ${task.title}` : `Hoàn thành ${task.title}`}
                        aria-pressed={task.status === 'DONE'}
                        className="task-completion-toggle"
                    >
                        {isUpdating ? <Loader2 className="animate-spin" size={20} /> :
                            task.status === 'DONE' ? <CheckCircle size={24} /> : <span className="task-completion-ring" />}
                    </motion.button>
                    <div className="task-card-content flex-1 min-w-0">
                        <h3 className="task-title font-medium">{task.title}</h3>
                        {task.description && (
                            <p className="text-sm text-[var(--text-2)] line-clamp-2 mt-1">
                                {task.description}
                            </p>
                        )}
                        <div className="task-card-meta flex flex-wrap items-center gap-2 mt-2">
                            <StatusBadge status={task.status} />
                            <PriorityBadge priority={task.priority} />
                            {task.startAt && (
                                <span className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
                                    <svg
                                        className="w-3 h-3"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                    </svg>
                                    Bắt đầu:{' '}
                                    {formatDate(task.startAt, {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </span>
                            )}
                            {task.dueAt && (
                                <span
                                    className={cn(
                                        'text-xs',
                                        overdue
                                            ? 'text-red-500 font-medium'
                                            : 'text-[var(--text-2)]',
                                    )}
                                >
                                    {overdue ? '⚠️ ' : '📅 '}
                                    Hạn:{' '}
                                    {formatDate(task.dueAt, {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </span>
                            )}
                            {task.tags?.map((tag) => (
                                <Badge
                                    key={tag.id}
                                    style={{ backgroundColor: tag.color }}
                                    className="text-white text-xs"
                                >
                                    {tag.name}
                                </Badge>
                            ))}
                        </div>
                    </div>
                    <motion.div className="task-card-menu" whileHover={{ scale: 1.1 }}>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    aria-label={`Tùy chọn ${task.title}`}
                                    onClick={(event) => event.stopPropagation()}
                                >
                                    <MoreVertical className="w-4 h-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={onMarkDone} disabled={isUpdating}>
                                        <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                                        {task.status === 'DONE' ? 'Mở lại công việc' : 'Hoàn thành'}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={onEdit}>
                                    <Edit className="w-4 h-4 mr-2" />
                                    Chỉnh sửa
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={onDelete}
                                    className="text-red-600"
                                >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Xóa
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
