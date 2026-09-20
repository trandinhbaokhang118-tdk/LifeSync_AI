import { Outlet, NavLink, useNavigate } from "react-router-dom";
import "../../admin-theme.css";
import { LayoutDashboard, Users, Settings, Activity, Database, LogOut, Search, Bell, ChevronDown, ChevronRight, Menu, X, ShieldCheck } from "lucide-react";
import { useAuthStore } from "../../store/auth.store";
import { useState } from "react";

export function AdminLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({ workspace: true, management: true });
  const navItems = [
    { to: "/admin", icon: LayoutDashboard, label: "Tổng quan", end: true },
    { to: "/admin/users", icon: Users, label: "Người dùng" },
    { to: "/admin/activity", icon: Activity, label: "Hoạt động" },
    { to: "/admin/database", icon: Database, label: "Dữ liệu" },
    { to: "/admin/settings", icon: Settings, label: "Cài đặt" },
  ];
  const handleLogout = async () => { await logout(); navigate("/admin/login", { replace: true }); };
  return (<div className="admin-theme min-h-screen"><div className={`admin-sidebar ${mobileOpen ? "is-open" : ""}`}>
    <div className="admin-brand"><div className="admin-brand-mark"><ShieldCheck size={20} /></div><div><strong>LifeSync</strong><span>ADMIN CONSOLE</span></div><button className="admin-mobile-close" onClick={() => setMobileOpen(false)}><X size={18} /></button></div>
    <div className="admin-workspace"><span className="admin-workspace-dot" /> LifeSync workspace <ChevronDown size={14} /></div>
    <nav className="admin-nav" aria-label="Điều hướng admin">
      <button className="admin-nav-label admin-nav-label-button" onClick={() => setOpenGroups(v => ({ ...v, workspace: !v.workspace }))}><span>WORKSPACE</span>{openGroups.workspace ? <ChevronDown size={13}/> : <ChevronRight size={13}/>}</button>
      {openGroups.workspace && navItems.slice(0, 3).map(({ to, icon: Icon, label, end }) => <NavLink key={to} to={to} end={end} onClick={() => setMobileOpen(false)} className={({ isActive }) => `admin-nav-item ${isActive ? "active" : ""}`}><Icon size={18} /><span>{label}</span>{label === "Hoạt động" && <em>24</em>}</NavLink>)}
      <button className="admin-nav-label admin-nav-label-button" onClick={() => setOpenGroups(v => ({ ...v, management: !v.management }))}><span>QUẢN TRỊ</span>{openGroups.management ? <ChevronDown size={13}/> : <ChevronRight size={13}/>}</button>
      {openGroups.management && navItems.slice(3).map(({ to, icon: Icon, label, end }) => <NavLink key={to} to={to} end={end} onClick={() => setMobileOpen(false)} className={({ isActive }) => `admin-nav-item ${isActive ? "active" : ""}`}><Icon size={18} /><span>{label}</span></NavLink>)}
    </nav>
    <div className="admin-sidebar-bottom"><div className="admin-status"><span /><div><strong>Hệ thống ổn định</strong><small>Đồng bộ vừa xong</small></div></div><div className="admin-user"><div className="admin-avatar">{user?.name?.charAt(0).toUpperCase() || "A"}</div><div className="admin-user-copy"><strong>{user?.name || "Administrator"}</strong><small>{user?.email || "admin@lifesync.ai"}</small></div><button aria-label="Đăng xuất" onClick={handleLogout}><LogOut size={16} /></button></div></div>
  </div>{mobileOpen && <button className="admin-backdrop" aria-label="Đóng menu" onClick={() => setMobileOpen(false)} />}<main className="admin-main"><header className="admin-topbar"><button className="admin-menu-toggle" onClick={() => setMobileOpen(true)}><Menu size={20} /></button><div className="admin-breadcrumb"><span>Workspace</span><b>/</b><strong>Admin console</strong></div><div className="admin-top-actions"><label className="admin-search"><Search size={16} /><input placeholder="Tìm kiếm nhanh..." /><kbd>⌘ K</kbd></label><button className="admin-icon-btn" aria-label="Thông báo"><Bell size={18} /><i /></button><div className="admin-top-profile"><div className="admin-avatar small">{user?.name?.charAt(0).toUpperCase() || "A"}</div><ChevronDown size={15} /></div></div></header><Outlet /></main></div>);
}
