import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    ArrowDownRight,
    ArrowRight,
    BellRing,
    BrainCircuit,
    CalendarRange,
    Dumbbell,
    MapPinned,
    Play,
    ShieldCheck,
    TimerReset,
} from 'lucide-react';
import { LandingCinematicGallery } from '../components/landing/LandingCinematicGallery';
import { BrandMark } from '../components/ui/BrandMark';
import './landing.css';

const storyScenes = [
    {
        number: '01',
        title: 'Đặt ngày vào đúng nhịp.',
        body: 'Gom task, lịch hẹn và time block vào một mặt phẳng. Bạn nhìn thấy việc cần làm trước khi ngày làm việc bắt đầu.',
        image: '/landing/generated/02-plan.png',
        alt: 'Vận động viên xem lại kế hoạch bên máy tính trước buổi tập',
    },
    {
        number: '02',
        title: 'Giữ một việc ở phía trước.',
        body: 'Focus timer và trợ lý AI giúp biến ý định thành phiên làm việc cụ thể — có điểm bắt đầu, thời lượng và mục tiêu rõ ràng.',
        image: '/landing/generated/03-focus.png',
        alt: 'Người dùng ghi kế hoạch trong không gian làm việc tập trung',
    },
    {
        number: '03',
        title: 'Đưa chuyển động vào lịch.',
        body: 'Workout, GPS và lịch sử hoạt động nằm cạnh công việc. Sức khỏe không còn là phần việc phải nhớ sau cùng.',
        image: '/landing/generated/04-momentum.png',
        alt: 'Một đội chạy bộ cùng nhau trong kiến trúc hiện đại',
    },
    {
        number: '04',
        title: 'Đọc lại nhịp của chính mình.',
        body: 'Theo dõi điều đã hoàn thành, thời gian đã tập trung và hoạt động đã ghi nhận để điều chỉnh ngày tiếp theo.',
        image: '/landing/generated/05-recover.png',
        alt: 'Vận động viên nghỉ phục hồi sau một buổi tập',
    },
] as const;

const platformRows = [
    { icon: CalendarRange, title: 'Plan', detail: 'Tasks · Calendar · Time blocks' },
    { icon: TimerReset, title: 'Focus', detail: 'Pomodoro · Reminders · Notifications' },
    { icon: BrainCircuit, title: 'Think', detail: 'AI chat · Schedule assistance' },
    { icon: Dumbbell, title: 'Move', detail: 'Fitness profile · Workout history' },
    { icon: MapPinned, title: 'Track', detail: 'GPS routes · Activity progress' },
    { icon: BellRing, title: 'Return', detail: 'Device-aware reminders' },
] as const;

export function Landing() {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const scrollTo = (id: string) => {
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        document.getElementById(id)?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
    };

    return (
        <main className="landing-page">
            <header className={`landing-nav ${scrolled ? 'landing-nav--scrolled' : ''}`}>
                <Link to="/" className="landing-brand" aria-label="LifeSync AI — trang chủ">
                    <BrandMark className="landing-brand-mark" />
                    <span>LifeSync AI</span>
                </Link>
                <div className="landing-nav-actions">
                    <Link className="landing-login" to="/login">Đăng nhập</Link>
                    <Link className="landing-nav-cta" to="/register">Đăng ký <ArrowRight size={15} /></Link>
                </div>
            </header>

            <section className="landing-hero" aria-labelledby="landing-title">
                <LandingCinematicGallery />
                <div className="landing-hero__scrim" aria-hidden="true" />
                <div className="landing-hero__content">
                    <p className="landing-hero__signal"><span /> LifeSync · Performance system</p>
                    <h1 id="landing-title">Làm việc có nhịp.<br />Sống có lực.</h1>
                    <p className="landing-hero__copy">
                        Một không gian để lập kế hoạch, giữ tập trung và đưa vận động trở lại đúng vị trí trong ngày của bạn.
                    </p>
                    <div className="landing-hero__actions">
                        <Link className="landing-button landing-button--primary" to="/register">
                            Tạo tài khoản <ArrowRight size={17} />
                        </Link>
                        <button className="landing-button landing-button--ghost" type="button" onClick={() => scrollTo('demo')}>
                            <Play size={16} fill="currentColor" /> Xem demo
                        </button>
                        <button className="landing-explore-link" type="button" onClick={() => scrollTo('platform')}>
                            Khám phá <ArrowDownRight size={17} />
                        </button>
                    </div>
                </div>
            </section>

            <section className="landing-rhythm" aria-label="Ba lớp vận hành của LifeSync">
                <p className="landing-rhythm__statement">Một ngày tốt không cần nhiều ứng dụng hơn. Nó cần một nhịp rõ hơn.</p>
                <div className="landing-rhythm__steps">
                    <div><span>01</span><strong>Lên kế hoạch</strong><p>Biết điều gì đến trước.</p></div>
                    <div><span>02</span><strong>Giữ tập trung</strong><p>Đi hết một phiên làm việc.</p></div>
                    <div><span>03</span><strong>Duy trì sức bền</strong><p>Để cơ thể có chỗ trong lịch.</p></div>
                </div>
            </section>

            <section id="demo" className="landing-story" aria-labelledby="story-title">
                <div className="landing-story__sticky">
                    <p className="landing-label">Một vòng lặp có chủ đích</p>
                    <h2 id="story-title">Từ ý định<br />đến nhịp sống.</h2>
                    <p>LifeSync nối công việc, thời gian và vận động thành một chu trình bạn có thể nhìn thấy — rồi lặp lại tốt hơn.</p>
                    <Link className="landing-inline-link" to="/register">Bắt đầu vòng đầu tiên <ArrowRight size={16} /></Link>
                </div>
                <div className="landing-story__frames">
                    {storyScenes.map((scene) => (
                        <figure className="landing-story-frame" key={scene.number}>
                            <div className="landing-story-frame__media">
                                <img src={scene.image} alt={scene.alt} width="1672" height="941" loading="lazy" />
                            </div>
                            <figcaption>
                                <span>{scene.number}</span>
                                <div><h3>{scene.title}</h3><p>{scene.body}</p></div>
                            </figcaption>
                        </figure>
                    ))}
                </div>
            </section>

            <section id="platform" className="landing-platform" aria-labelledby="platform-title">
                <div className="landing-platform__heading">
                    <p className="landing-label">Một hệ thống, sáu nhịp</p>
                    <h2 id="platform-title">Đủ sâu cho công việc.<br />Đủ gần với cuộc sống.</h2>
                    <p>Không dựng thêm một bảng điều khiển để bạn phải quản lý. LifeSync giữ các công cụ thiết yếu trong một luồng nhất quán.</p>
                </div>
                <div className="landing-platform__rows">
                    {platformRows.map(({ icon: Icon, title, detail }, index) => (
                        <div className="landing-platform-row" key={title}>
                            <span>{String(index + 1).padStart(2, '0')}</span>
                            <Icon size={22} strokeWidth={1.7} />
                            <strong>{title}</strong>
                            <p>{detail}</p>
                        </div>
                    ))}
                </div>
            </section>

            <section className="landing-team" aria-labelledby="team-title">
                <img
                    src="/landing/generated/06-align.png"
                    alt="Đội ngũ cùng xem lại kế hoạch trong không gian hiệu suất cao"
                    width="1672"
                    height="941"
                    loading="lazy"
                />
                <div className="landing-team__scrim" aria-hidden="true" />
                <div className="landing-team__content">
                    <ShieldCheck size={24} strokeWidth={1.5} />
                    <h2 id="team-title">Nhịp riêng.<br />Hướng chung.</h2>
                    <p>Từ workspace cá nhân đến khu vực quản trị, LifeSync được cấu trúc để một người bắt đầu nhanh và một tổ chức vẫn có thể vận hành rõ ràng.</p>
                    <button className="landing-inline-link" type="button" onClick={() => scrollTo('demo')}>Xem cách vận hành <ArrowRight size={16} /></button>
                </div>
            </section>

            <section className="landing-close" aria-labelledby="close-title">
                <p className="landing-label">Bắt đầu từ hôm nay</p>
                <h2 id="close-title">Đừng đợi một tuần nhẹ hơn.</h2>
                <p>Tạo tài khoản, đặt nhịp đầu tiên và để LifeSync giữ phần còn lại ở cùng một nơi.</p>
                <div className="landing-close__actions">
                    <Link className="landing-button landing-button--primary" to="/register">Đăng ký LifeSync <ArrowRight size={17} /></Link>
                    <button className="landing-button landing-button--ghost" type="button" onClick={() => scrollTo('demo')}><Play size={16} fill="currentColor" /> Xem demo</button>
                </div>
            </section>

            <footer className="landing-footer">
                <p>Mỗi ngày là một nhịp.<br />Giữ nhịp của bạn.</p>
                <div className="landing-footer__meta">
                    <Link to="/" className="landing-brand" aria-label="LifeSync AI — trang chủ">
                        <BrandMark className="landing-brand-mark" />
                        <span>LifeSync AI</span>
                    </Link>
                    <span>© 2026 · Time · Focus · Fitness</span>
                </div>
            </footer>
        </main>
    );
}
