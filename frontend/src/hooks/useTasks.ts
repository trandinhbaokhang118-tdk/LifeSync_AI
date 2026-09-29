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
        mutationFn: async ({ id, data }: { id: string; data: Partial<Task> }) => {
            const response = await api.patch<ApiResponse<Task>>(`/tasks/${id}`, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            queryClient.invalidateQueries({ queryKey: ['planning'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        },
        onError: (error: { response?: { data?: ApiError } }) => {
            showToast.error('Không thể đổi lịch', error.response?.data?.error?.message || 'Không thể cập nhật công việc');
        },
    });
}
