import { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, ArrowUpRight, BarChart3, CheckCircle2, ChevronDown, Clock3, Download, LayoutDashboard, RefreshCw, ShieldCheck, Target, Users, Zap } from "lucide-react";
import { CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import api from "../../services/api";
import { showToast } from "../../components/ui/toast";
import "../../admin-theme.css";

type Stats = { totalUsers:number; activeUsers:number; totalTasks:number; completedTasks:number; avgTasksPerUser:number; newUsersToday:number };
type ActivityLog = { id:string; userName:string; action:string; details:string; timestamp:string };
const emptyStats: Stats = { totalUsers:0, activeUsers:0, totalTasks:0, completedTasks:0, avgTasksPerUser:0, newUsersToday:0 };
const colors = ["#3876ff", "#a8c3ff", "#73a0ff", "#dce7ff"];

function Skeleton({ className = "" }: { className?: string }) { return <div className={`admin-skeleton ${className}`} aria-hidden="true" />; }

export function AdminDashboard() {
  const [stats, setStats] = useState<Stats>(emptyStats);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [visible, setVisible] = useState({ metrics:false, charts:false, activity:false });
  const [range, setRange] = useState("7 ngày qua");

  const fetchDashboard = useCallback(async (refresh = false) => {
    try {
      if (refresh) setRefreshing(true);
      const [s, l] = await Promise.all([api.get("/admin/stats"), api.get("/admin/activity-logs")]);
      setStats(s.data.data ?? emptyStats);
      setLogs(l.data.data ?? []);
    } catch { showToast.error("Không thể tải dữ liệu", "Kiểm tra kết nối máy chủ và thử lại."); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);
  useEffect(() => {
    if (loading) return;
    const timers = [window.setTimeout(() => setVisible(v => ({ ...v, metrics:true })), 120), window.setTimeout(() => setVisible(v => ({ ...v, charts:true })), 300), window.setTimeout(() => setVisible(v => ({ ...v, activity:true })), 480)];
    return () => timers.forEach(window.clearTimeout);
  }, [loading]);

  const completion = stats.totalTasks ? Math.round(stats.completedTasks / stats.totalTasks * 100) : 0;
  const trend = useMemo(() => ["T2","T3","T4","T5","T6","T7","CN"].map((day, i) => ({ day, users: logs.filter(log => new Date(log.timestamp).getDay() === (i + 1) % 7).length })), [logs]);
  const taskMix = [{ name:"Hoàn thành", value:stats.completedTasks }, { name:"Đang xử lý", value:Math.max(stats.totalTasks - stats.completedTasks, 0) }];
  const exportData = () => { const blob = new Blob([JSON.stringify({ stats, logs }, null, 2)], { type:"application/json" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "lifesync-admin-export.json"; a.click(); URL.revokeObjectURL(url); showToast.success("Đã xuất dữ liệu", "Tệp JSON đã được tải xuống."); };
  const metricCards = [
    { label:"Tổng người dùng", value:stats.totalUsers, note:`+${stats.newUsersToday} hôm nay`, icon:Users, tone:"blue" },
    { label:"Người dùng hoạt động", value:stats.activeUsers, note:`${stats.totalUsers ? Math.round(stats.activeUsers / stats.totalUsers * 100) : 0}% tổng số`, icon:Activity, tone:"violet" },
    { label:"Tổng nhiệm vụ", value:stats.totalTasks, note:`${stats.completedTasks} đã hoàn tất`, icon:Target, tone:"amber" },
    { label:"Tỷ lệ hoàn thành", value:`${completion}%`, note:`${stats.avgTasksPerUser.toFixed(1)} nhiệm vụ / người`, icon:CheckCircle2, tone:"green" },
  ];

  return <div className="admin-page">
    <section className="admin-page-head"><div><p className="admin-eyebrow"><span /> LIFE SYNC / WORKSPACE</p><h1>Trung tâm vận hành</h1><p className="admin-hero-copy">Theo dõi nhịp làm việc, người dùng và sức khỏe hệ thống trong một màn hình.</p></div><div className="admin-head-actions"><label className="admin-range"><Clock3 size={15}/><select value={range} onChange={e => setRange(e.target.value)}><option>7 ngày qua</option><option>30 ngày qua</option><option>Quý này</option></select><ChevronDown size={14}/></label><button className="admin-btn primary" onClick={() => fetchDashboard(true)} disabled={refreshing}><RefreshCw size={15} className={refreshing ? "spin" : ""}/> Cập nhật</button><button className="admin-btn" onClick={exportData}><Download size={15}/> Xuất báo cáo</button></div></section>
    <div className={`admin-metrics ${visible.metrics ? "is-visible" : ""}`} aria-busy={!visible.metrics}>{visible.metrics ? metricCards.map(({label,value,note,icon:Icon,tone}) => <article className={`admin-metric ${tone}`} key={label}><div className="admin-metric-top"><span>{label}</span><div><Icon size={18}/></div></div><strong>{value}</strong><small><ArrowUpRight size={13}/> {note}</small></article>) : Array.from({length:4}, (_,i) => <article className="admin-metric" key={i}><Skeleton className="sk-label"/><Skeleton className="sk-value"/><Skeleton className="sk-note"/></article>)}</div>
    <div className={`admin-dashboard-grid ${visible.charts ? "is-visible" : ""}`} aria-busy={!visible.charts}>
      {!visible.charts ? <><section className="admin-panel chart-panel"><Skeleton className="sk-title"/><Skeleton className="sk-chart"/></section><section className="admin-panel completion-panel"><Skeleton className="sk-title"/><Skeleton className="sk-donut"/></section></> : <>
        <section className="admin-panel chart-panel"><div className="admin-panel-head"><div><p className="admin-kicker">TĂNG TRƯỞNG</p><h2>Người dùng mới</h2><span className="admin-panel-sub">Hoạt động đăng ký trong {range.toLowerCase()}</span></div><span className="admin-panel-note"><i/> Cập nhật trực tiếp</span></div><ResponsiveContainer width="100%" height={250}><LineChart data={trend} margin={{ left:0, right:4, top:15, bottom:0 }}><CartesianGrid stroke="#e8edf5" vertical={false}/><XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill:"#8290a8",fontSize:12}}/><YAxis hide/><Tooltip contentStyle={{background:"#17243d",border:0,borderRadius:8,color:"#fff"}}/><Line type="monotone" dataKey="users" stroke="#3876ff" strokeWidth={3} dot={{r:4,fill:"#fff",strokeWidth:3,stroke:"#3876ff"}}/></LineChart></ResponsiveContainer></section>
        <section className="admin-panel completion-panel"><div className="admin-panel-head"><div><p className="admin-kicker">SỨC KHỎE CÔNG VIỆC</p><h2>Tiến độ nhiệm vụ</h2><span className="admin-panel-sub">Tổng quan trạng thái hiện tại</span></div><Zap size={19} color="#f0a23a"/></div><div className="admin-donut-wrap"><ResponsiveContainer width="100%" height={175}><PieChart><Pie data={taskMix} innerRadius={57} outerRadius={76} startAngle={90} endAngle={-270} dataKey="value" stroke="none">{taskMix.map((_, i) => <Cell key={i} fill={colors[i]}/>)}</Pie></PieChart></ResponsiveContainer><div className="admin-donut-label"><strong>{completion}%</strong><span>hoàn thành</span></div></div><div className="completion-legend"><span><i className="done"/> Đã xong <b>{stats.completedTasks}</b></span><span><i className="open"/> Đang mở <b>{Math.max(stats.totalTasks - stats.completedTasks, 0)}</b></span></div></section>
      </>}
    </div>
    <section className={`admin-panel activity-panel ${visible.activity ? "is-visible" : ""}`} aria-busy={!visible.activity}><div className="admin-panel-head"><div><p className="admin-kicker">DÒNG THỜI GIAN</p><h2>Hoạt động gần đây</h2><span className="admin-panel-sub">Các hành động mới nhất trên hệ thống</span></div><a href="/admin/activity">Xem tất cả <ArrowUpRight size={15}/></a></div>{visible.activity ? (logs.length ? <div className="admin-activity-list">{logs.slice(0,6).map(log => <div className="admin-activity-row" key={log.id}><div className="activity-icon"><ShieldCheck size={16}/></div><div><strong>{log.action}</strong><p>{log.userName} · {log.details}</p></div><time>{new Date(log.timestamp).toLocaleTimeString("vi-VN", { hour:"2-digit", minute:"2-digit" })}</time></div>)}</div> : <div className="admin-empty">Chưa có hoạt động gần đây.</div>) : <div className="admin-activity-list">{Array.from({length:4}, (_,i) => <div className="admin-activity-row" key={i}><Skeleton className="sk-avatar"/><div className="sk-copy"><Skeleton/><Skeleton/></div><Skeleton className="sk-time"/></div>)}</div>}</section>
    <section className="admin-quick-row"><div><BarChart3 size={18}/><div><strong>Đọc báo cáo chuyên sâu</strong><span>So sánh tiến độ theo tuần và khu vực.</span></div></div><div><LayoutDashboard size={18}/><div><strong>Quản lý workspace</strong><span>Cấu hình quyền và dữ liệu người dùng.</span></div></div></section>
  </div>;
}
