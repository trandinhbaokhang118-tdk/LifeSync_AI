import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { showToast } from '../components/ui/toast';
import type { Task, ApiResponse, ApiError } from '../types';
import { tasksService } from '../services/tasks.service';

export function useTasksQuery() {
    return useQuery({
        queryKey: ['tasks'],
        queryFn: async () => {
            return { data: await tasksService.getCalendarTasks() };
        },
    });
}

export function useUpdateTaskMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationKey: ['task-schedule'],
        mutationFn: async ({ id, data }: { id: string; data: Partial<Task> }) => {
            const response = await api.patch<ApiResponse<Task>>(`/tasks/${id}`, data);
            return response.data;
        },
        onMutate: async ({ id, data }) => {
            await queryClient.cancelQueries({ queryKey: ['tasks'] });
            const snapshots = queryClient.getQueriesData<Task[] | { data: Task[] }>({ queryKey: ['tasks'] });
            const patch = (old: Task[] | { data: Task[] } | undefined) => {
                if (!old) return old;
                const list = Array.isArray(old) ? old : old.data;
                if (!Array.isArray(list)) return old;
                const updated = list.map(task => task.id === id ? { ...task, ...data } : task);
                return Array.isArray(old) ? updated : { ...old, data: updated };
            };
            queryClient.setQueriesData({ queryKey: ['tasks'] }, patch);
            return { snapshots };
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            queryClient.invalidateQueries({ queryKey: ['planning'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        },
        onError: (error: { response?: { data?: ApiError } }, { id }, context) => {
            for (const [key, snapshot] of context?.snapshots ?? []) {
                const previous = (Array.isArray(snapshot) ? snapshot : snapshot?.data)?.find(task => task.id === id);
                if (!previous) continue;
                queryClient.setQueryData<Task[] | { data: Task[] }>(key, old => {
                    if (!old) return old;
                    const list = Array.isArray(old) ? old : old.data;
                    if (!Array.isArray(list)) return old;
                    const restored = list.map(task => task.id === id ? previous : task);
                    return Array.isArray(old) ? restored : { ...old, data: restored };
                });
            }
            showToast.error('Không thể đổi lịch', error.response?.data?.error?.message || 'Không thể cập nhật công việc');
        },
    });
}
