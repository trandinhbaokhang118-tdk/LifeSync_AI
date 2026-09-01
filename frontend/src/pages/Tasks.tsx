import {
    useEffect,
    useMemo,
    useState,
    type CSSProperties,
    type PointerEvent as ReactPointerEvent,
} from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    AnimatePresence,
    motion,
    useDragControls,
    type PanInfo,
} from 'framer-motion';
import type { DragEndEvent } from '@dnd-kit/core';
import {
    closestCenter,
    DndContext,
    KeyboardSensor,
    PointerSensor,
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
    GripVertical,
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
import { fadeInUp, staggerContainer, staggerItem } from '../lib/animations';
import { cn, formatDate, isOverdue } from '../lib/utils';
import { DateTimePicker } from '../components/ui/DateTimePicker';
import { useAuthStore } from '../store/auth.store';
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

const SWIPE_DELETE_THRESHOLD = -96;
const SWIPE_DELETE_VELOCITY = -650;

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
        useSensor(PointerSensor, {
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
            startAt: task.startAt
                ? new Date(task.startAt).toISOString().slice(0, 16)
                : '',
            dueAt: task.dueAt
                ? new Date(task.dueAt).toISOString().slice(0, 16)
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
        };
        if (editingTask) {
            updateMutation.mutate({ id: editingTask.id, data: payload });
        } else {
            createMutation.mutate(payload);
        }
    };

    const markAsDone = (task: Task) => {
        updateMutation.mutate({ id: task.id, data: { status: 'DONE' } });
    };

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
                        Quản lý và theo dõi công việc của bạn
                    </p>
                </div>
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    className="flex gap-2"
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
                    <div className="flex gap-2">
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
                                {orderedTasks.map((task, index) => (
                                    <SortableTaskCard
                                        key={task.id}
                                        task={task}
                                        index={index}
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
                <DialogContent>
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
                                className="input min-h-[100px] resize-none"
                                placeholder="Mô tả (tùy chọn)"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="label">Trạng thái</label>
                                <Select
                                    value={watch('status')}
                                    onValueChange={(v) =>
                                        setValue('status', v as TaskStatus)
                                    }
                                >
                                    <SelectTrigger>
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
                                    <SelectTrigger>
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
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <DateTimePicker
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
                                <DateTimePicker
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
                                <SelectTrigger>
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
    index,
    onEdit,
    onDelete,
    onMarkDone,
}: {
    task: Task;
    index: number;
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
    } = useSortable({ id: task.id });

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
            index={index}
            isSorting={isDragging}
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
    index,
    isSorting,
    onEdit,
    onDelete,
    onMarkDone,
    refCallback,
    style,
    task,
}: {
    dragAttributes: SortableHookResult['attributes'];
    dragListeners: SortableHookResult['listeners'];
    index: number;
    isSorting: boolean;
    onEdit: () => void;
    onDelete: () => void;
    onMarkDone: () => void;
    refCallback: (node: HTMLElement | null) => void;
    style: CSSProperties;
    task: Task;
}) {
    const overdue = task.status !== 'DONE' && isOverdue(task.dueAt);
    const swipeControls = useDragControls();
    const handleSwipePointerDown = (
        event: ReactPointerEvent<HTMLDivElement>,
    ) => {
        if (!event.isPrimary) {
            return;
        }

        const target = event.target as HTMLElement;

        if (
            target.closest('[data-task-sort-handle="true"]') ||
            target.closest('button, a, input, textarea, select, [role="button"]')
        ) {
            return;
        }

        swipeControls.start(event);
    };
    const handleSwipeEnd = (
        _event: MouseEvent | TouchEvent | PointerEvent,
        info: PanInfo,
    ) => {
        if (
            info.offset.x <= SWIPE_DELETE_THRESHOLD ||
            info.velocity.x <= SWIPE_DELETE_VELOCITY
        ) {
            onDelete();
        }
    };

    return (
        <motion.div
            ref={refCallback}
            style={style}
            variants={staggerItem}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, x: -120, transition: { duration: 0.2 } }}
            layout
            transition={{ delay: index * 0.05 }}
            className={cn(
                'relative overflow-hidden rounded-xl',
                isSorting && 'shadow-[var(--shadow-lg)]',
            )}
        >
            <div className="absolute inset-y-0 right-0 flex w-28 items-center justify-end rounded-xl bg-red-600 pr-5 text-white">
                <Trash2 className="h-5 w-5" />
            </div>
            <motion.div
                drag="x"
                dragControls={swipeControls}
                dragListener={false}
                dragConstraints={{ left: -112, right: 0 }}
                dragDirectionLock
                dragElastic={0.08}
                dragMomentum={false}
                onPointerDown={handleSwipePointerDown}
                onDragEnd={handleSwipeEnd}
                whileHover={{ y: -2, scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className={cn(
                    'card relative select-none p-4 transition-all hover:shadow-md [touch-action:pan-y]',
                    isSorting && 'cursor-grabbing opacity-80',
                    overdue && 'border-red-200 dark:border-red-800',
                )}
            >
                <div className="flex items-start gap-3">
                    <button
                        type="button"
                        className="mt-0.5 flex h-11 w-11 flex-shrink-0 cursor-grab items-center justify-center rounded-lg text-[var(--text-3)] transition-colors hover:bg-[var(--surface-3)] hover:text-[var(--text)] active:cursor-grabbing sm:h-9 sm:w-9 [touch-action:none]"
                        aria-label="Sắp xếp công việc"
                        data-task-sort-handle="true"
                        style={{ touchAction: 'none' }}
                        {...dragAttributes}
                        {...dragListeners}
                    >
                        <GripVertical className="h-5 w-5" />
                    </button>
                    <motion.button
                        type="button"
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(event) => {
                            event.stopPropagation();
                            if (task.status !== 'DONE') {
                                onMarkDone();
                            }
                        }}
                        className={cn(
                            'w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 transition-colors',
                            task.status === 'DONE'
                                ? 'bg-green-500 border-green-500'
                                : overdue
                                  ? 'border-red-500 hover:bg-red-50'
                                  : 'border-gray-300 hover:border-primary-500',
                        )}
                    >
                        {task.status === 'DONE' && (
                            <CheckCircle className="w-full h-full text-white p-0.5" />
                        )}
                    </motion.button>
                    <div className="flex-1 min-w-0">
                        <h3
                            className={cn(
                                'font-medium',
                                task.status === 'DONE'
                                    ? 'text-[var(--text-3)] line-through'
                                    : 'text-[var(--text)]',
                            )}
                        >
                            {task.title}
                        </h3>
                        {task.description && (
                            <p className="text-sm text-[var(--text-2)] line-clamp-2 mt-1">
                                {task.description}
                            </p>
                        )}
                        <div className="flex flex-wrap items-center gap-2 mt-2">
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
                    <motion.div whileHover={{ scale: 1.1 }}>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    onClick={(event) => event.stopPropagation()}
                                >
                                    <MoreVertical className="w-4 h-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                {task.status !== 'DONE' && (
                                    <DropdownMenuItem onClick={onMarkDone}>
                                        <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                                        Hoàn thành
                                    </DropdownMenuItem>
                                )}
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
            </motion.div>
        </motion.div>
    );
}
