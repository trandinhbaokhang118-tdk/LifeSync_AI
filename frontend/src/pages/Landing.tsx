import { useEffect, useState } from "react";
import { API_URL } from "../lib/api-config";
import {
  emptyLanding,
  type LandingDocument,
} from "../components/landing-editor/content";
import { renderContent } from "../components/landing-editor/renderContent";
import { ContentBlocks } from "../components/landing-editor/ContentBlocks";
import { useLandingPreview } from "../components/landing-editor/useLandingPreview";
import "../components/landing-editor/content.css";
import { Link } from "react-router-dom";
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
} from "lucide-react";
import { LandingCinematicGallery } from "../components/landing/LandingCinematicGallery";
import { BrandMark } from "../components/ui/BrandMark";
import "./landing.css";

const storyScenes = [
  {
    number: "01",
    title: "Đặt ngày vào đúng nhịp.",
    body: "Gom task, lịch hẹn và time block vào một mặt phẳng. Bạn nhìn thấy việc cần làm trước khi ngày làm việc bắt đầu.",
    image: "/landing/generated/02-plan.png",
    alt: "Vận động viên xem lại kế hoạch bên máy tính trước buổi tập",
  },
  {
    number: "02",
    title: "Giữ một việc ở phía trước.",
    body: "Focus timer và trợ lý AI giúp biến ý định thành phiên làm việc cụ thể — có điểm bắt đầu, thời lượng và mục tiêu rõ ràng.",
    image: "/landing/generated/03-focus.png",
    alt: "Người dùng ghi kế hoạch trong không gian làm việc tập trung",
  },
  {
    number: "03",
    title: "Đưa chuyển động vào lịch.",
    body: "Workout, GPS và lịch sử hoạt động nằm cạnh công việc. Sức khỏe không còn là phần việc phải nhớ sau cùng.",
    image: "/landing/generated/04-momentum.png",
    alt: "Một đội chạy bộ cùng nhau trong kiến trúc hiện đại",
  },
  {
    number: "04",
    title: "Đọc lại nhịp của chính mình.",
    body: "Theo dõi điều đã hoàn thành, thời gian đã tập trung và hoạt động đã ghi nhận để điều chỉnh ngày tiếp theo.",
    image: "/landing/generated/05-recover.png",
    alt: "Vận động viên nghỉ phục hồi sau một buổi tập",
  },
] as const;

const platformRows = [
  {
    icon: CalendarRange,
    title: "Plan",
    detail: "Tasks · Calendar · Time blocks",
  },
  {
    icon: TimerReset,
    title: "Focus",
    detail: "Pomodoro · Reminders · Notifications",
  },
  {
    icon: BrainCircuit,
    title: "Think",
    detail: "AI chat · Schedule assistance",
  },
  {
    icon: Dumbbell,
    title: "Move",
    detail: "Fitness profile · Workout history",
  },
  { icon: MapPinned, title: "Track", detail: "GPS routes · Activity progress" },
  { icon: BellRing, title: "Return", detail: "Device-aware reminders" },
] as const;

export function Landing() {
  const { preview, document: draft, interactive } = useLandingPreview();
  const [published, setPublished] = useState<LandingDocument>(emptyLanding);
  useEffect(() => {
    if (preview) return;
    const controller = new AbortController();
    fetch(`${API_URL}/content/landing`, {
      signal: controller.signal,
      cache: "no-store",
    })
      .then((r) => {
        if (!r.ok) throw new Error("Content unavailable");
        return r.json();
      })
      .then((r) => {
        if (r.data?.document?.version === 1) setPublished(r.data.document);
      })
      .catch(() => {
        /* The built-in landing remains available if CMS is offline. */
      });
    return () => controller.abort();
  }, [preview]);
  const contentDocument = preview ? draft : published;
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (id: string) => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
  };

  return (
    <>
      {renderContent(
        <main className={`landing-page ${preview ? "cms-preview" : ""}`}>
          <header
            data-cms="landing-001"
            className={`landing-nav ${scrolled ? "landing-nav--scrolled" : ""}`}
          >
            <Link
              data-cms="landing-002"
              to="/"
              className="landing-brand"
              aria-label="LifeSync AI — trang chủ"
            >
              <BrandMark className="landing-brand-mark" />
              <span>LifeSync AI</span>
            </Link>
            <div className="landing-nav-actions">
              <Link
                data-cms="landing-003"
                className="landing-login"
                to="/login"
              >
                Đăng nhập
              </Link>
              <Link
                data-cms="landing-004"
                className="landing-nav-cta"
                to="/register"
              >
                Đăng ký <ArrowRight size={15} />
              </Link>
            </div>
          </header>

          <section
            data-cms="landing-005"
            className="landing-hero"
            aria-labelledby="landing-title"
          >
            <LandingCinematicGallery data-cms="hero-image" />
            <div className="landing-hero__scrim" aria-hidden="true" />
            <div className="landing-hero__content">
              <p data-cms="landing-006" className="landing-hero__signal">
                <span /> LifeSync · Performance system
              </p>
              <h1 data-cms="landing-007" id="landing-title">
                Làm việc có nhịp.
                <br />
                Sống có lực.
              </h1>
              <p data-cms="landing-008" className="landing-hero__copy">
                Một không gian để lập kế hoạch, giữ tập trung và đưa vận động
                trở lại đúng vị trí trong ngày của bạn.
              </p>
              <div className="landing-hero__actions">
                <Link
                  data-cms="landing-009"
                  className="landing-button landing-button--primary"
                  to="/register"
                >
                  Tạo tài khoản <ArrowRight size={17} />
                </Link>
                <button
                  data-cms="landing-010"
                  className="landing-button landing-button--ghost"
                  type="button"
                  onClick={() => scrollTo("demo")}
                >
                  <Play size={16} fill="currentColor" /> Xem demo
                </button>
                <button
                  data-cms="landing-011"
                  className="landing-explore-link"
                  type="button"
                  onClick={() => scrollTo("platform")}
                >
                  Khám phá <ArrowDownRight size={17} />
                </button>
              </div>
            </div>
          </section>

          <ContentBlocks
            blocks={contentDocument.blocks}
            position="top"
            editing={preview && interactive}
          />
          <section
            data-cms="landing-012"
            className="landing-rhythm"
            aria-label="Ba lớp vận hành của LifeSync"
          >
            <p data-cms="landing-013" className="landing-rhythm__statement">
              Một ngày tốt không cần nhiều ứng dụng hơn. Nó cần một nhịp rõ hơn.
            </p>
            <div className="landing-rhythm__steps">
              <div>
                <span>01</span>
                <strong>Lên kế hoạch</strong>
                <p data-cms="landing-014">Biết điều gì đến trước.</p>
              </div>
              <div>
                <span>02</span>
                <strong>Giữ tập trung</strong>
                <p data-cms="landing-015">Đi hết một phiên làm việc.</p>
              </div>
              <div>
                <span>03</span>
                <strong>Duy trì sức bền</strong>
                <p data-cms="landing-016">Để cơ thể có chỗ trong lịch.</p>
              </div>
            </div>
          </section>

          <section
            data-cms="landing-017"
            id="demo"
            className="landing-story"
            aria-labelledby="story-title"
          >
            <div className="landing-story__sticky">
              <p data-cms="landing-018" className="landing-label">
                Một vòng lặp có chủ đích
              </p>
              <h2 data-cms="landing-019" id="story-title">
                Từ ý định
                <br />
                đến nhịp sống.
              </h2>
              <p data-cms="landing-020">
                LifeSync nối công việc, thời gian và vận động thành một chu
                trình bạn có thể nhìn thấy — rồi lặp lại tốt hơn.
              </p>
              <Link
                data-cms="landing-021"
                className="landing-inline-link"
                to="/register"
              >
                Bắt đầu vòng đầu tiên <ArrowRight size={16} />
              </Link>
            </div>
            <div className="landing-story__frames">
              {storyScenes.map((scene) => (
                <figure className="landing-story-frame" key={scene.number}>
                  <div className="landing-story-frame__media">
                    <img
                      data-cms={`landing-022-${scene.number}`}
                      src={scene.image}
                      alt={scene.alt}
                      width="1672"
                      height="941"
                      loading="lazy"
                    />
                  </div>
                  <figcaption>
                    <span>{scene.number}</span>
                    <div>
                      <h3 data-cms={`landing-023-${scene.number}`}>
                        {scene.title}
                      </h3>
                      <p data-cms={`landing-024-${scene.number}`}>
                        {scene.body}
                      </p>
                    </div>
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>

          <section
            data-cms="landing-025"
            id="platform"
            className="landing-platform"
            aria-labelledby="platform-title"
          >
            <div className="landing-platform__heading">
              <p data-cms="landing-026" className="landing-label">
                Một hệ thống, sáu nhịp
              </p>
              <h2 data-cms="landing-027" id="platform-title">
                Đủ sâu cho công việc.
                <br />
                Đủ gần với cuộc sống.
              </h2>
              <p data-cms="landing-028">
                Không dựng thêm một bảng điều khiển để bạn phải quản lý.
                LifeSync giữ các công cụ thiết yếu trong một luồng nhất quán.
              </p>
            </div>
            <div className="landing-platform__rows">
              {platformRows.map(({ icon: Icon, title, detail }, index) => (
                <div className="landing-platform-row" key={title}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <Icon size={22} strokeWidth={1.7} />
                  <strong>{title}</strong>
                  <p data-cms={`landing-029-${index}`}>{detail}</p>
                </div>
              ))}
            </div>
          </section>

          <section
            data-cms="landing-030"
            className="landing-team"
            aria-labelledby="team-title"
          >
            <img
              data-cms="landing-031"
              src="/landing/generated/06-align.png"
              alt="Đội ngũ cùng xem lại kế hoạch trong không gian hiệu suất cao"
              width="1672"
              height="941"
              loading="lazy"
            />
            <div className="landing-team__scrim" aria-hidden="true" />
            <div className="landing-team__content">
              <ShieldCheck size={24} strokeWidth={1.5} />
              <h2 data-cms="landing-032" id="team-title">
                Nhịp riêng.
                <br />
                Hướng chung.
              </h2>
              <p data-cms="landing-033">
                Từ workspace cá nhân đến khu vực quản trị, LifeSync được cấu
                trúc để một người bắt đầu nhanh và một tổ chức vẫn có thể vận
                hành rõ ràng.
              </p>
              <button
                data-cms="landing-034"
                className="landing-inline-link"
                type="button"
                onClick={() => scrollTo("demo")}
              >
                Xem cách vận hành <ArrowRight size={16} />
              </button>
            </div>
          </section>

          <section
            data-cms="landing-035"
            className="landing-close"
            aria-labelledby="close-title"
          >
            <p data-cms="landing-036" className="landing-label">
              Bắt đầu từ hôm nay
            </p>
            <h2 data-cms="landing-037" id="close-title">
              Đừng đợi một tuần nhẹ hơn.
            </h2>
            <p data-cms="landing-038">
              Tạo tài khoản, đặt nhịp đầu tiên và để LifeSync giữ phần còn lại ở
              cùng một nơi.
            </p>
            <div className="landing-close__actions">
              <Link
                data-cms="landing-039"
                className="landing-button landing-button--primary"
                to="/register"
              >
                Đăng ký LifeSync <ArrowRight size={17} />
              </Link>
              <button
                data-cms="landing-040"
                className="landing-button landing-button--ghost"
                type="button"
                onClick={() => scrollTo("demo")}
              >
                <Play size={16} fill="currentColor" /> Xem demo
              </button>
            </div>
          </section>

          <ContentBlocks
            blocks={contentDocument.blocks}
            position="bottom"
            editing={preview && interactive}
          />
          <footer data-cms="landing-041" className="landing-footer">
            <p data-cms="landing-042">
              Mỗi ngày là một nhịp.
              <br />
              Giữ nhịp của bạn.
            </p>
            <div className="landing-footer__meta">
              <Link
                data-cms="landing-043"
                to="/"
                className="landing-brand"
                aria-label="LifeSync AI — trang chủ"
              >
                <BrandMark className="landing-brand-mark" />
                <span>LifeSync AI</span>
              </Link>
              <span>© 2026 · Time · Focus · Fitness</span>
            </div>
          </footer>
        </main>,
        contentDocument,
        preview && interactive,
      )}
    </>
  );
}
