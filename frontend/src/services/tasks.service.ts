import api from './api';
import type { Task, CreateTaskRequest, UpdateTaskRequest, TaskQueryParams, ApiResponse, PaginationMeta } from '../types';

export const tasksService = {
    async getCalendarTasks(): Promise<Task[]> {
        const all: Task[] = [];
        let page = 1;
        let totalPages = 1;
        do {
            const result = await tasksService.getAll({ page, limit: 100, sortBy: 'dueAt', sortOrder: 'asc' });
            all.push(...result.data);
            totalPages = result.meta.totalPages;
            page++;
        } while (page <= totalPages);
        return all;
    },
    async getAll(params?: TaskQueryParams): Promise<{ data: Task[]; meta: PaginationMeta }> {
        const response = await api.get<ApiResponse<Task[]>>('/tasks', { params });
        return response.data as { data: Task[]; meta: PaginationMeta };
    },

    async getById(id: string): Promise<Task> {
        const response = await api.get<ApiResponse<Task>>(`/tasks/${id}`);
        return response.data.data;
    },

    async create(data: CreateTaskRequest): Promise<Task> {
        const response = await api.post<ApiResponse<Task>>('/tasks', data);
        return response.data.data;
    },

    async update(id: string, data: UpdateTaskRequest): Promise<Task> {
        const response = await api.patch<ApiResponse<Task>>(`/tasks/${id}`, data);
        return response.data.data;
    },

    async delete(id: string): Promise<void> {
        await api.delete(`/tasks/${id}`);
    },

    async addTags(taskId: string, tagIds: string[]): Promise<Task> {
        const response = await api.post<ApiResponse<Task>>(`/tasks/${taskId}/tags`, { tagIds });
        return response.data.data;
    },

    async removeTag(taskId: string, tagId: string): Promise<Task> {
        const response = await api.delete<ApiResponse<Task>>(`/tasks/${taskId}/tags/${tagId}`);
        return response.data.data;
    },
};
