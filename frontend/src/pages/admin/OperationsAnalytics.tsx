import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import api from '../../services/api';
import './admin-records.css';
import './operations-analytics.css';

type Point = { day: string; steps: number; activeMinutes: number; workouts: number; plannedMinutes: number };
type Stats = { connectedDevices: number; totalSteps: number; activeMinutes: number; workouts: number; plannedMinutes: number; points: Point[]; recentWorkouts: { id: string; name: string; category: string; duration: number; performedAt: string; user: { name: string } }[] };
export function OperationsAnalytics({ mode = 'all' }: { mode?: 'all' | 'work' | 'health' }) {
  const [search, setSearch] = useState('');
  const query = useQuery({ queryKey: ['admin', 'operations'], queryFn: async () => (await api.get('/admin/operations-stats')).data.data as Stats });
  const data = query.data;
  const tasks = useQuery({ queryKey: ['admin', 'task-stats'], enabled: mode === 'work', queryFn: async () => (await api.get('/admin/stats')).data.data as { totalTasks: number; completedTasks: number } });
  return <div className="admin-records ops-page">
    <header className="records-heading"><div><h1 className="admin-title">{mode === 'work' ? 'Nhiệm vụ & thời gian' : mode === 'health' ? 'Vận động & buổi tập' : 'Thời gian & thể thao'}</h1><p className="admin-title-sub">Toàn hệ thống · 14 ngày gần nhất · múi giờ Việt Nam</p></div><button className="admin-btn admin-btn-primary" disabled={query.isFetching} onClick={() => { void query.refetch(); if (mode === 'work') void tasks.refetch(); }}><RefreshCw size={16} />{query.isFetching ? 'Đang tải...' : 'Cập nhật'}</button></header>
    {query.isError ? <div role="alert" className="records-empty">Không thể tải số liệu. Hãy nhấn Cập nhật để thử lại.</div> : query.isPending ? <div role="status" className="records-empty">Đang tải số liệu vận hành...</div> : data && <>
      <div className="ops-pair">
        {mode !== 'health' && <section className="ops-panel"><h2>Quản lý thời gian</h2><p>Thời lượng được người dùng lên lịch, không phải thời gian tập trung thực tế.</p><strong className="ops-total">{data.plannedMinutes.toLocaleString('vi-VN')} <small>phút đã lên lịch</small></strong><Chart points={data.points} field="plannedMinutes" name="Phút đã lên lịch" color="var(--ops-time)" /></section>}
        {mode === 'work' && <section className="ops-panel"><h2>Tiến độ nhiệm vụ</h2><p>Trạng thái hiện tại của tất cả công việc trên hệ thống.</p>{tasks.isError ? <p role="alert">Không thể tải nhiệm vụ. Nhấn Cập nhật để thử lại.</p> : <><strong className="ops-total">{tasks.data?.completedTasks ?? '—'} <small>/ {tasks.data?.totalTasks ?? '—'} hoàn thành</small></strong><progress aria-label="Tỷ lệ nhiệm vụ hoàn thành" max={tasks.data?.totalTasks || 1} value={tasks.data?.completedTasks || 0} /><p>Chưa hoàn thành: {tasks.data ? tasks.data.totalTasks - tasks.data.completedTasks : '—'}</p></>}</section>}
        {mode !== 'work' && <section className="ops-panel"><h2>Thể thao & vận động</h2><p>Dữ liệu hoạt động hằng ngày đã được ghi nhận trong hệ thống.</p><strong className="ops-total">{data.activeMinutes.toLocaleString('vi-VN')} <small>phút vận động</small></strong><Chart points={data.points} field="activeMinutes" name="Phút vận động" color="var(--ops-sport)" /></section>}
      </div>
      {mode !== 'work' && <>
      <div className="ops-pair">
        <section className="ops-panel"><h2>Số bước hằng ngày</h2><p>{data.totalSteps.toLocaleString('vi-VN')} bước trong kỳ</p><Chart points={data.points} field="steps" name="Số bước" color="var(--ops-sport)" /></section>
        <section className="ops-panel"><h2>Buổi tập đã ghi nhận</h2><p>{data.workouts.toLocaleString('vi-VN')} buổi tập trong kỳ</p><Chart points={data.points} field="workouts" name="Buổi tập" color="var(--ops-time)" /></section>
      </div>
      <p className="ops-note">{data.connectedDevices} hồ sơ bật kết nối sức khỏe. Chỉ số này không xác nhận thiết bị đang trực tuyến. Ngày chưa ghi nhận dữ liệu được hiển thị bằng 0.</p>
      <section className="ops-panel"><h2>Theo dõi buổi tập</h2><p>Tối đa 50 buổi gần nhất trong kỳ. Thời lượng tính bằng phút.</p><label className="records-label">Tìm theo người dùng hoặc bài tập<input className="admin-input" value={search} onChange={e => setSearch(e.target.value)} /></label><div className="records-scroll"><table className="admin-table"><thead><tr><th>Người dùng</th><th>Buổi tập</th><th>Loại</th><th>Phút</th><th>Thời gian</th></tr></thead><tbody>{data.recentWorkouts.filter(w => `${w.user.name} ${w.name}`.toLocaleLowerCase('vi').includes(search.toLocaleLowerCase('vi'))).map(w => <tr key={w.id}><td>{w.user.name}</td><td>{w.name}</td><td>{w.category}</td><td>{w.duration}</td><td>{new Date(w.performedAt).toLocaleString('vi-VN')}</td></tr>)}{!data.recentWorkouts.length && <tr><td colSpan={5}>Chưa ghi nhận buổi tập trong kỳ.</td></tr>}</tbody></table></div></section>
      </>}
    </>}
  </div>;
}
function Chart({ points, field, name, color }: { points: Point[]; field: keyof Omit<Point, 'day'>; name: string; color: string }) {
  return <><div className="ops-chart" role="img" aria-label={`${name} theo ngày`}><ResponsiveContainer width="100%" height="100%"><BarChart data={points}><CartesianGrid vertical={false} stroke="var(--admin-line)" /><XAxis dataKey="day" minTickGap={28} tick={{ fontSize: 11 }} /><YAxis width={48} allowDecimals={false} tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey={field} name={name} fill={color} radius={[4, 4, 0, 0]} maxBarSize={22} isAnimationActive={false} /></BarChart></ResponsiveContainer></div><details><summary>Xem số liệu theo ngày</summary><table className="ops-data"><thead><tr><th>Ngày</th><th>{name}</th></tr></thead><tbody>{points.map(p => <tr key={p.day}><td>{p.day}</td><td>{Math.round(p[field]).toLocaleString('vi-VN')}</td></tr>)}</tbody></table></details></>;
}
