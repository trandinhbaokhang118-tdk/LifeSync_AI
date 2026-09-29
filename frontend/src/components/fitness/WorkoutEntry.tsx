import { useState } from 'react';
import type { FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { fitnessService } from '../../services/fitness.service';
import { Button, showToast } from '../ui';

export function WorkoutEntry({ onSaved }: { onSaved: () => Promise<void> }) {
    const [saving, setSaving] = useState(false);
    const { data: access, isPending, isError, refetch } = useQuery({
        queryKey: ['premium-access', 'fitness-basic'],
        queryFn: () => fitnessService.checkPremiumFeature('fitness-basic'), staleTime: 0,
    });
    const inputClass = 'w-full rounded-lg border border-[var(--border)] bg-[var(--surface-1)] p-2 text-[var(--text)]';
    async function save(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (saving) return;
        const form = event.currentTarget;
        const fields = new FormData(form);
        setSaving(true);
        try {
            await fitnessService.createExercise({
                name: String(fields.get('name')).trim(), category: String(fields.get('category')),
                duration: Number(fields.get('duration')),
                distance: Number(fields.get('distance')), caloriesBurned: Number(fields.get('calories')),
                performedAt: new Date(String(fields.get('date'))).toISOString(),
            });
            form.reset();
            showToast.success('Đã lưu buổi tập', 'Nhật ký đã được lưu vào tài khoản.');
            await onSaved();
        } catch {
            showToast.error('Chưa lưu được buổi tập', 'Kiểm tra kết nối và thời hạn gói Pro rồi thử lại.');
        } finally { setSaving(false); }
    }
    return <section className="surface-card space-y-4 p-5">
        <h2 className="text-lg font-semibold">Nhật ký tập luyện · Pro</h2>
        <p className="text-sm text-[var(--text-2)]">Ghi lại buổi tập và xem tiến độ trong lịch sử tập luyện.</p>
        {isPending ? <p>Đang kiểm tra gói…</p> : isError ?
            <Button onClick={() => void refetch()}>Thử lại kiểm tra quyền</Button> : !access?.hasAccess ?
            <Link to="/app/pricing" className="text-[var(--primary)] underline">Nâng cấp Pro để ghi nhật ký</Link> :
            <form onSubmit={save} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <label>Tên buổi tập<input className={inputClass} name="name" required maxLength={120} placeholder="Chạy buổi sáng" /></label>
                <label>Hoạt động<select className={inputClass} name="category"><option value="running">Chạy</option><option value="walking">Đi bộ</option><option value="cycling">Đạp xe</option><option value="strength">Tập sức mạnh</option><option value="flexibility">Giãn cơ</option></select></label>
                <label>Thời điểm<input className={inputClass} name="date" type="datetime-local" required /></label>
                <label>Thời lượng (phút)<input className={inputClass} name="duration" type="number" min="1" max="1440" required /></label>
                <label>Quãng đường (km)<input className={inputClass} name="distance" type="number" min="0" max="1000" step="0.01" defaultValue="0" /></label>
                <label>Calories<input className={inputClass} name="calories" type="number" min="0" max="20000" defaultValue="0" /></label>
                <Button type="submit" disabled={saving}>{saving ? 'Đang lưu…' : 'Lưu buổi tập'}</Button>
            </form>}
    </section>;
}
