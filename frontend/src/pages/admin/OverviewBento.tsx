import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowUpRight, CalendarClock, HeartPulse, MousePointer2 } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import api from '../../services/api';
import { useAuthStore } from '../../store/auth.store';
import './overview-bento.css';
type Business = { lifetimeRevenue: number; lifetimePaidOrders: number; revenue: number; paidOrders: number; points: { day: string; revenue: number }[] };
type Operations = { plannedMinutes: number; activeMinutes: number; workouts: number };
const number = (n?: number) => n === undefined ? '—' : n.toLocaleString('vi-VN');
export function OverviewBento() {
  const isAdmin = useAuthStore(s => s.user?.role === 'ADMIN');
  const business = useQuery({ queryKey: ['admin', 'business'], enabled: isAdmin, queryFn: async () => (await api.get('/admin/business-stats')).data.data as Business });
  const operations = useQuery({ queryKey: ['admin', 'operations'], queryFn: async () => (await api.get('/admin/operations-stats')).data.data as Operations });
  return <section className="overview-bento" aria-label="Kinh doanh và hai mảng vận hành">
    <article id="revenue-details" className="bento-tile bento-revenue" style={{ scrollMarginTop: 130 }}><h3>Chi tiết doanh thu</h3><p>30 ngày gần nhất · VND · Giờ Việt Nam</p>
      {!isAdmin ? <p>Chỉ quản trị viên được xem doanh thu.</p> : business.isError ? <div role="alert"><p>Chưa tải được doanh thu.</p><button onClick={() => business.refetch()}>Thử lại</button></div> : <>
        <strong className="bento-value">{number(business.data?.lifetimeRevenue)} ₫</strong><p>Tổng doanh thu từ trước đến nay · {number(business.data?.lifetimePaidOrders)} đơn đã thanh toán</p><p>30 ngày gần nhất: {number(business.data?.revenue)} ₫ · {number(business.data?.paidOrders)} đơn</p>
        <div className="bento-chart">{business.isPending ? <p role="status">Đang tải...</p> : <ResponsiveContainer width="100%" height="100%"><AreaChart data={business.data?.points}><CartesianGrid stroke="var(--px-line)" vertical={false}/><XAxis dataKey="day" minTickGap={45} tick={{fontSize:11}}/><YAxis width={58} tickFormatter={v=>new Intl.NumberFormat('vi-VN',{notation:'compact'}).format(v)} tick={{fontSize:11}}/><Tooltip formatter={v=>[Number(v).toLocaleString('vi-VN')+' ₫','Doanh thu']}/><Area dataKey="revenue" stroke="var(--bento-time)" fill="var(--bento-time-soft)" isAnimationActive={false}/></AreaChart></ResponsiveContainer>}</div>
        {business.data && <details><summary>Xem doanh thu từng ngày</summary><div className="bento-data">{business.data.points.map(p=><div key={p.day}><span>{p.day}</span><span>{number(p.revenue)} ₫</span></div>)}</div></details>}
      </>}
    </article>
    <article className="bento-tile bento-engagement"><MousePointer2 size={22}/><h3>Tương tác & lượt bấm</h3><strong>Chưa thu thập</strong><p>Chưa có nguồn đo lượt truy cập hoặc lượt bấm. Chỉ số sẽ xuất hiện khi tích hợp theo dõi tương tác.</p><Link to="/admin/landing">Quản lý nội dung landing <ArrowUpRight size={15}/></Link></article>
    <Link to="/admin/work" className="bento-tile bento-domain"><CalendarClock size={24}/><div><h3>Quản lý công việc</h3><p>Lịch làm việc & tiến độ nhiệm vụ</p><strong>{operations.isError?'Chưa tải được':number(operations.data?.plannedMinutes)} <small>phút lên lịch / 14 ngày</small></strong></div><ArrowUpRight size={18}/></Link>
    <Link to="/admin/health" className="bento-tile bento-domain bento-health"><HeartPulse size={24}/><div><h3>Quản lý sức khỏe</h3><p>Vận động & lịch sử buổi tập</p><strong>{operations.isError?'Chưa tải được':number(operations.data?.workouts)} <small>buổi tập / 14 ngày</small></strong><p>{number(operations.data?.activeMinutes)} phút vận động ghi nhận</p></div><ArrowUpRight size={18}/></Link>
  </section>;
}
