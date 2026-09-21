import { useMemo, useState, useEffect, useRef, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { RefreshCw, Download, Search, ArrowRight } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar } from 'recharts';
import api from '../../services/api';
import './admin-dashboard.css';
import { OverviewBento } from './OverviewBento';
import { MonthlyKpiCards } from './MonthlyKpiCards';

type Stats = { totalUsers:number; activeUsers:number; totalTasks:number; completedTasks:number; newUsersToday:number; avgTasksPerUser:number };
type User = { id:string; name:string; createdAt:string };
type Log = { id:string; userName:string; action:string; details:string; timestamp:string };
function Reveal({children, delay=0}: {children:ReactNode; delay?:number}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => { const observer = new IntersectionObserver(([entry]) => { if(entry.isIntersecting) { setShown(true); observer.disconnect(); } }, {rootMargin:'80px'}); if(ref.current) observer.observe(ref.current); return () => observer.disconnect(); }, []);
  return <div ref={ref} className={`px-reveal ${shown ? 'shown' : ''}`} style={{transitionDelay:`${delay}ms`}}>{children}</div>;
}
export function AdminDashboard() {
  const queryClient = useQueryClient();
  const [days,setDays] = useState(30);
  const [search,setSearch] = useState('');
  const [page,setPage] = useState(0);
  const query = useQuery({queryKey:['admin','overview'],queryFn:async () => {
    const [s,u,l] = await Promise.all([api.get('/admin/stats'),api.get('/admin/users'),api.get('/admin/activity-logs')]);
    return {stats:s.data.data as Stats, users:u.data.data as User[], logs:l.data.data as Log[]};
  }});
  const series = useMemo(() => Array.from({length:days},(_,i) => {
    const date = new Date(); date.setHours(0,0,0,0); date.setDate(date.getDate()-days+1+i);
    const next = new Date(date); next.setDate(next.getDate()+1);
    return {day:date.toLocaleDateString('vi-VN',{day:'2-digit',month:'2-digit'}), users:query.data?.users.filter(u => new Date(u.createdAt)>=date && new Date(u.createdAt)<next).length ?? 0};
  }),[days,query.data]);
  const filtered = useMemo(() => (query.data?.logs ?? []).filter(l => `${l.action} ${l.userName} ${l.details}`.toLowerCase().includes(search.toLowerCase())).sort((a,b)=>new Date(b.timestamp).getTime()-new Date(a.timestamp).getTime()),[query.data,search]);
  const stats=query.data?.stats;
  const completion=stats?.totalTasks ? Math.round(stats.completedTasks/stats.totalTasks*100):0;
  const active=stats?.totalUsers ? Math.round(stats.activeUsers/stats.totalUsers*100):0;
  const exportReport=()=>{ const url=URL.createObjectURL(new Blob([JSON.stringify(query.data,null,2)],{type:'application/json'})); const a=document.createElement('a');a.href=url;a.download='lifesync-overview.json';a.click();URL.revokeObjectURL(url); };
  if(query.isError) return <div className="px-dashboard"><div className="px-error" role="alert"><h1>Không thể tải tổng quan</h1><p>Dữ liệu chưa sẵn sàng. Vui lòng thử lại.</p><button onClick={()=>query.refetch()}>Thử lại</button></div></div>;
  return <div className="px-dashboard" aria-busy={query.isPending}>
    <Reveal><header className="px-heading"><div><h1>Tổng quan LifeSync</h1><p>Người dùng, kinh doanh, công việc và sức khỏe trong cùng một góc nhìn.</p></div><div className="px-actions"><button aria-label="Cập nhật dữ liệu" disabled={query.isFetching} onClick={()=>queryClient.invalidateQueries({queryKey:['admin']})}><RefreshCw size={17} className={query.isFetching?'spin':''}/></button><button disabled={!query.data} onClick={exportReport}><Download size={16}/>Xuất báo cáo tài khoản</button></div></header>
    </Reveal>
    <Reveal><MonthlyKpiCards /></Reveal>
    <Reveal delay={60}><section className="px-main-chart"><div className="px-section-head"><div><h2>Tăng trưởng người dùng</h2><p>Số tài khoản đăng ký mới theo ngày</p></div><select aria-label="Khoảng thời gian biểu đồ" value={days} onChange={e=>setDays(Number(e.target.value))}><option value={7}>7 ngày gần nhất</option><option value={30}>30 ngày gần nhất</option><option value={90}>90 ngày gần nhất</option></select></div>{query.isPending?<div className="px-skeleton px-chart-skeleton"/>:<><div className="px-chart"><ResponsiveContainer width="100%" height="100%"><LineChart data={series} margin={{top:25,right:12,left:0,bottom:10}}><CartesianGrid stroke="var(--px-line)" horizontal={false}/><XAxis dataKey="day" minTickGap={55} axisLine={false} tickLine={false} tick={{fill:'var(--px-muted)',fontSize:12}}/><YAxis allowDecimals={false} width={28} axisLine={false} tickLine={false} tick={{fill:'var(--px-muted)',fontSize:12}}/><Tooltip contentStyle={{background:'var(--px-white)',border:'1px solid var(--px-line)',borderRadius:6}}/><Line name="Đăng ký mới" type="linear" dataKey="users" stroke="var(--px-blue)" strokeWidth={2} dot={false} activeDot={{r:5}}/></LineChart></ResponsiveContainer></div><div className="px-chart-caption"><span><i/>Đăng ký mới</span><span>{series.reduce((sum,d)=>sum+d.users,0)} tài khoản trong {days} ngày</span></div></>}</section></Reveal>
    <Reveal><OverviewBento /></Reveal>
    <div className="px-card-grid">
      <Reveal><article className="px-card"><div className="px-section-head"><div><h3>Tổng người dùng</h3><p>Tất cả tài khoản</p></div><strong className="px-number">{stats?.totalUsers ?? '—'}</strong></div><div className="px-mini-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={series.slice(-7)}><Bar name="Đăng ký mới" dataKey="users" fill="var(--px-blue)" radius={[3,3,0,0]} maxBarSize={9}/><XAxis dataKey="day" hide/><Tooltip cursor={false}/></BarChart></ResponsiveContainer></div><div className="px-legend"><span><i/>Đăng ký trong 7 ngày gần nhất</span><b>{query.data?series.slice(-7).reduce((s,d)=>s+d.users,0):'—'}</b></div><Link to="/admin/users">Quản lý người dùng <ArrowRight size={14}/></Link></article></Reveal>
      <Reveal delay={60}><article className="px-card"><div className="px-section-head"><div><h3>Khối lượng công việc</h3><p>Tổng cộng trên hệ thống</p></div><strong className="px-number">{stats?.totalTasks ?? '—'}</strong></div><div className="px-task-display"><strong>{stats?.avgTasksPerUser.toFixed(1) ?? '—'}</strong><span>công việc / người dùng</span></div><div className="px-legend"><span><i/>Đã hoàn thành</span><b>{stats?.completedTasks ?? '—'}</b></div><div className="px-legend muted"><span><i/>Chưa hoàn thành</span><b>{stats?stats.totalTasks-stats.completedTasks:'—'}</b></div></article></Reveal>
      <Reveal><article className="px-card"><div><h3>Tiến độ nhiệm vụ</h3><p>Phân bố trạng thái công việc</p></div><div className="px-ring" style={{background:`conic-gradient(var(--px-blue) ${completion}%, var(--px-pale) 0)`}}><span><strong>{stats?.totalTasks?`${completion}%`:'—'}</strong></span></div><div className="px-legend"><span><i/>Hoàn thành</span><b>{completion}%</b></div><div className="px-legend muted"><span><i/>{stats?.totalTasks?'Chưa hoàn thành':'Chưa có công việc'}</span><b>{stats?.totalTasks?`${100-completion}%`:'—'}</b></div></article></Reveal>
      <Reveal delay={60}><article className="px-card"><div><h3>Mức độ hoạt động</h3><p>Tài khoản được cập nhật trong 7 ngày qua</p></div><div className="px-gauge"><svg viewBox="0 0 200 115" aria-label={`${active}% tài khoản hoạt động`}><path d="M20 95 A80 80 0 0 1 180 95" fill="none" stroke="var(--px-pale)" strokeWidth="15" strokeLinecap="round"/><path d="M20 95 A80 80 0 0 1 180 95" fill="none" stroke="var(--px-blue)" strokeWidth="15" strokeLinecap="round" pathLength="100" strokeDasharray={`${active} 100`}/><text x="100" y="91" textAnchor="middle" fill="var(--px-ink)" fontSize="25">{active}%</text></svg></div><div className="px-legend"><span><i/>Có hoạt động</span><b>{stats?.activeUsers ?? '—'}</b></div><div className="px-legend muted"><span><i/>Còn lại</span><b>{stats?stats.totalUsers-stats.activeUsers:'—'}</b></div></article></Reveal>
    </div>
    <Reveal><section className="px-table-section"><div className="px-section-head"><div><h2>Hoạt động gần đây</h2><p>Nhật ký thay đổi và thao tác quản trị</p></div><div className="px-table-tools"><label><Search size={16}/><input aria-label="Tìm hoạt động" placeholder="Tìm hoạt động..." value={search} onChange={e=>{setSearch(e.target.value);setPage(0);}}/></label><Link to="/admin/activity">Xem tất cả <ArrowRight size={15}/></Link></div></div><div className="px-table-scroll"><table><thead><tr><th>Người dùng</th><th>Hoạt động</th><th>Chi tiết</th><th>Thời gian</th></tr></thead><tbody>{query.isPending?<tr><td colSpan={4}><div className="px-skeleton"/></td></tr>:filtered.slice(page*6,page*6+6).map(log=><tr key={log.id}><td><span className="px-person"><span>{log.userName?.charAt(0)||'U'}</span>{log.userName||'Người dùng'}</span></td><td><span className="px-action-tag">{log.action}</span></td><td>{log.details||'—'}</td><td><time>{new Date(log.timestamp).toLocaleString('vi-VN')}</time></td></tr>)}{!query.isPending&&!filtered.length&&<tr><td colSpan={4} className="px-empty">{search?'Không tìm thấy hoạt động phù hợp.':'Chưa có hoạt động được ghi nhận.'}</td></tr>}</tbody></table></div><div className="px-pagination"><span>{filtered.length ? `${page*6+1}–${Math.min((page+1)*6,filtered.length)} trên ${filtered.length}`:'0 hoạt động'}</span><div><button disabled={!page} onClick={()=>setPage(p=>p-1)}>Trước</button><button disabled={(page+1)*6>=filtered.length} onClick={()=>setPage(p=>p+1)}>Tiếp</button></div></div></section></Reveal>
    <footer className="px-footer"><span>LifeSync AI · Không gian quản trị</span><span>Dữ liệu từ hệ thống LifeSync</span></footer>
  </div>;
}
