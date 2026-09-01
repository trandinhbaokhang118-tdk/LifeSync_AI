import { ArrowLeft, CalendarDays, HeartPulse, MousePointer2, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SyncPupScene } from './SyncPupScene';

interface AuthVisualProps {
  mode: 'login' | 'register';
  celebrating?: boolean;
}

export function AuthVisual({ mode }: AuthVisualProps) {
  const isRegister = mode === 'register';

  return (
    <aside className="auth-visual">
      <Link to="/" className="auth-back-link">
        <ArrowLeft aria-hidden="true" />
        Trang chủ
      </Link>

      <SyncPupScene />

      <div className="auth-scene-hint" aria-hidden="true">
        <MousePointer2 />
        Di chuột · Sync nhìn theo · chờ đồng hồ reo
      </div>

      <div className="auth-visual-copy">
        <span className="auth-eyebrow">
          <Sparkles aria-hidden="true" />
          LifeSync studio
        </span>
        <h2>{isRegister ? 'Bắt đầu một nhịp sống mới.' : 'Mọi kế hoạch, trở về đúng nhịp.'}</h2>
        <p>
          {isRegister
            ? 'Tạo không gian riêng để công việc, sức khỏe và thời gian hỗ trợ lẫn nhau.'
            : 'Đăng nhập để tiếp tục lịch trình, phiên tập trung và dữ liệu vận động của bạn.'}
        </p>
        <div className="auth-feature-row" aria-label="Tính năng LifeSync AI">
          <span><CalendarDays aria-hidden="true" /> Lịch thông minh</span>
          <span><HeartPulse aria-hidden="true" /> Sức khỏe đồng bộ</span>
        </div>
      </div>
    </aside>
  );
}
