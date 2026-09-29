import { useQuery } from '@tanstack/react-query';
import { googleCalendarService } from '../services/google-calendar.service';
import { useAuthStore } from '../store/auth.store';

export function useGoogleBusy(startDate?: string, endDate?: string) {
    const userId = useAuthStore(s => s.user?.id);
    return useQuery({
        queryKey: ['google-calendar', 'busy', userId, startDate, endDate],
        queryFn: () => googleCalendarService.busy(startDate!, endDate!),
        enabled: !!userId && !!startDate && !!endDate,
        staleTime: 30000,
        refetchOnWindowFocus: 'always',
        retry: false,
    });
}
