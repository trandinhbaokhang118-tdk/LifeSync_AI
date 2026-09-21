import api from './api';

export type KpiMetric = { value: number; previous: number; growth: number | null };
export type MonthlyKpis = {
  revenue: KpiMetric; customers: KpiMetric; registrations: KpiMetric;
  online: number; inactive: number; onlineShare: number; registrationShare: number;
  asOf: string; month: number; year: number; comparison: string;
};
export const getMonthlyKpis = async (): Promise<MonthlyKpis> =>
  (await api.get('/admin/monthly-kpis')).data.data;
export const sendPresenceHeartbeat = () => api.post('/presence/heartbeat');
