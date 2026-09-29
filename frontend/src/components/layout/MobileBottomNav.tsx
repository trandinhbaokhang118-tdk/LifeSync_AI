import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, Calendar, MoreHorizontal, Timer, Dumbbell, Footprints, Plus, ChevronRight } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '../ui/dialog';
import { QuickAddModal } from './QuickAddModal';
import './mobile-bottom-nav.css';

const outline = 'M24 20 H126 C141 20 141 53 180 53 C219 53 219 20 234 20 H336 Q358 20 358 42 V79 Q358 98 336 98 H24 Q2 98 2 79 V42 Q2 20 24 20 Z';
const links = [
    { to: '/app', label: 'Trang chủ', icon: LayoutDashboard, end: true },
    { to: '/app/tasks', label: 'Công việc', icon: CheckSquare },
    { to: '/app/calendar', label: 'Lịch', icon: Calendar },
    { to: '/app/settings', label: 'Thêm', icon: MoreHorizontal },
];

export function MobileBottomNav() {
    const [open, setOpen] = useState(false);
    const [quickAdd, setQuickAdd] = useState(false);
    const navigate = useNavigate();
    const go = (path: string) => { setOpen(false); navigate(path); };
    return <>
        <nav aria-label="Điều hướng nhanh" className="mobile-dock md:hidden">
            <svg className="mobile-dock-frame" viewBox="0 0 360 100" preserveAspectRatio="none" aria-hidden="true">
                <path d={outline} className="mobile-dock-surface" />
                <path d={outline} pathLength="100" className="mobile-dock-light" />
            </svg>
            <div className="mobile-dock-items">
                {links.slice(0, 2).map(item => <NavLink key={item.to} to={item.to} end={item.end} className="mobile-dock-link"><item.icon size={21} /><span>{item.label}</span></NavLink>)}
                <button type="button" className="mobile-dock-start" aria-label="Bắt đầu hoạt động" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(true)}>
                    <span className="mobile-dock-orb"><svg viewBox="0 0 60 60" aria-hidden="true"><circle cx="30" cy="30" r="23" className="mobile-dock-orbit" /><path d="M25 19 L42 30 L25 41 Z" className="mobile-dock-play" /></svg></span>
                    <span>Bắt đầu</span>
                </button>
                {links.slice(2).map(item => <NavLink key={item.to} to={item.to} className="mobile-dock-link"><item.icon size={21} /><span>{item.label}</span></NavLink>)}
            </div>
        </nav>
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="mobile-activity-sheet">
                <div className="mobile-sheet-handle" aria-hidden="true" />
                <DialogTitle>Bạn muốn bắt đầu gì?</DialogTitle>
                <DialogDescription>Chọn hoạt động cho công việc và sức khỏe.</DialogDescription>
                <div className="mobile-activity-options">
                    <button onClick={() => go('/app/focus')}><Timer /><span><strong>Tập trung</strong><small>Chọn công việc và thời gian Focus</small></span><ChevronRight /></button>
                    <button onClick={() => go('/app/fitness')}><Dumbbell /><span><strong>Tập luyện</strong><small>Mở kế hoạch và ghi lại buổi tập</small></span><ChevronRight /></button>
                    <button onClick={() => go('/app/gps-tracking')}><Footprints /><span><strong>Đi bộ / chạy bộ</strong><small>Theo dõi với Track Lab</small></span><ChevronRight /></button>
                    <button onClick={() => { setOpen(false); setQuickAdd(true); }}><Plus /><span><strong>Thêm công việc</strong><small>Tạo việc mới cùng thời gian thực hiện</small></span><ChevronRight /></button>
                </div>
            </DialogContent>
        </Dialog>
        <QuickAddModal open={quickAdd} onOpenChange={setQuickAdd} />
    </>;
}
