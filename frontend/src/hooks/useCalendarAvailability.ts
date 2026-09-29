import { useQuery } from '@tanstack/react-query';
import { tasksService } from '../services/tasks.service';
import { timeBlocksService } from '../services/time-blocks.service';

export function useCalendarAvailability(startDate?: string, endDate?: string) {
    const enabled = !!startDate && !!endDate;
    const tasks = useQuery({
        queryKey: ['tasks', 'calendar'],
        queryFn: tasksService.getCalendarTasks,
        enabled,
        staleTime: 0,
        refetchOnWindowFocus: 'always',
    });
    const blocks = useQuery({
        queryKey: ['time-blocks', startDate, endDate],
        queryFn: () => timeBlocksService.getAll({ startDate: startDate!, endDate: endDate! }),
        enabled,
        staleTime: 0,
        refetchOnWindowFocus: 'always',
    });
    const occupied = [
        ...(tasks.data || []).filter(t => t.status !== 'DONE').map(t => ({
            id: t.id, title: t.title, startAt: t.startAt, endAt: t.dueAt, source: 'TASK' as const,
        })),
        ...(blocks.data || []).map(b => ({ ...b, source: 'BLOCK' as const })),
    ].filter(b => enabled && Date.parse(b.startAt) < Date.parse(endDate!) && Date.parse(b.endAt) > Date.parse(startDate!))
        .sort((a, b) => Date.parse(a.startAt) - Date.parse(b.startAt));
    return {
        occupied,
        blocks: blocks.data || [],
        isLoading: enabled && (tasks.isPending || blocks.isPending),
        isError: enabled && (tasks.isError || blocks.isError),
        refetch: () => Promise.all([tasks.refetch(), blocks.refetch()]),
    };
}
