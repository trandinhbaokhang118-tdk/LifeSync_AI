import { useQuery } from '@tanstack/react-query';
import { Activity, ArrowDownRight, ArrowUpRight, Users, UserPlus, Wallet } from 'lucide-react';
import { getMonthlyKpis, type KpiMetric } from '../../services/admin-kpis.service';
import { useAuthStore } from '../../store/auth.store';
import './monthly-kpis.css';

const number = (value: number) => value.toLocaleString('vi-VN');
function Growth({ metric }: { metric: KpiMetric }) {
  const growth = metric.growth;
  return <div className={`kpi-growth ${growth === null || growth === 0 ? 'neutral' : growth > 0 ? 'positive' : 'negative'}`}>
    {growth !== null && growth !== 0 && (growth > 0 ? <ArrowUpRight size={16}/> : <ArrowDownRight size={16}/>)}
    <strong>{growth === null ? 'Chưa có cơ sở so sánh' : growth === 0 ? 'Không đổi · 0%' : `${growth > 0 ? 'Tăng' : 'Giảm'} ${number(Math.abs(growth))}%`}</strong>
    <span>Cùng kỳ tháng trước: {number(metric.previous)}</span>
  </div>;
}

export function MonthlyKpiCards() {
  const isAdmin = useAuthStore(state => state.user?.role === 'ADMIN');
  const query = useQuery({ queryKey: ['admin', 'monthly-kpis'], queryFn: getMonthlyKpis, enabled: isAdmin, refetchInterval: 60000 });
  if (!isAdmin) return null;
  if (query.isError) return <div className="kpi-error" role="alert">Chưa tải được chỉ số tháng. <button onClick={() => query.refetch()}>Thử lại</button></div>;
  const data = query.data;
  return <section className="monthly-kpis" aria-label="Chỉ số kinh doanh tháng hiện tại" aria-busy={query.isPending}>
    <div className="kpi-grid">
      <article className="kpi-card kpi-primary">
        <div className="kpi-label"><Wallet size={19}/><h2>Doanh thu tháng</h2></div>
        <p>{data ? `Tháng ${data.month}/${data.year}` : 'Tháng hiện tại'} · Đã thanh toán</p>
        <strong className="kpi-value">{data ? number(data.revenue.value) : '—'} <small>₫</small></strong>
        {data ? <Growth metric={data.revenue}/> : <div className="px-skeleton"/>}
        <a className="kpi-detail" href="#revenue-details">Xem chi tiết doanh thu <ArrowUpRight size={14}/></a>
      </article>
      <article className="kpi-card">
        <div className="kpi-label"><Users size={19}/><h2>Tổng khách hàng</h2></div>
        <p>Tài khoản khách hàng hiện có</p>
        <strong className="kpi-value">{data ? number(data.customers.value) : '—'}</strong>
        {data ? <Growth metric={data.customers}/> : <div className="px-skeleton"/>}
        <p className="kpi-footnote">Không gồm quản trị viên và điều hành viên</p>
      </article>
      <article className="kpi-card">
        <div className="kpi-label"><UserPlus size={19}/><h2>Đăng ký mới</h2></div>
        <p>Từ đầu tháng đến hiện tại</p>
        <strong className="kpi-value">{data ? number(data.registrations.value) : '—'}</strong>
        {data ? <Growth metric={data.registrations}/> : <div className="px-skeleton"/>}
        <p className="kpi-footnote">{data ? `${number(data.registrationShare)}% tổng khách hàng` : 'Đang tải…'}</p>
      </article>
      <article className="kpi-card kpi-presence">
        <div className="kpi-label"><Activity size={19}/><h2>Trạng thái sử dụng</h2></div>
        <p>Tín hiệu trong 2 phút gần nhất</p>
        <dl>
          <div><dt><i className="kpi-online-dot"/>Đang online</dt><dd>{data ? number(data.online) : '—'}<small>{data ? `${number(data.onlineShare)}% khách hàng` : 'Đang tải…'}</small></dd></div>
          <div><dt><i/>Tạm ngưng sử dụng</dt><dd>{data ? number(data.inactive) : '—'}<small>{data ? `${number(data.customers.value ? Math.round(data.inactive / data.customers.value * 1000) / 10 : 0)}% khách hàng` : 'Đang tải…'}</small></dd></div>
        </dl>
        <p className="kpi-footnote">Chưa có lịch sử để so sánh tăng/giảm</p>
      </article>
    </div>
    <p className="kpi-context">{data ? `Cập nhật ${new Date(data.asOf).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })} · Giờ Việt Nam. ${data.comparison}` : 'Đang tải số liệu tháng…'}</p>
  </section>;
}
