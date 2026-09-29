import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { Button } from "../ui";
import { tasksService } from "../../services/tasks.service";
import { timeBlocksService } from "../../services/time-blocks.service";
import type { Task, TimeBlock } from "../../types";
import { ScheduleEditor, type ScheduleSelection } from './ScheduleEditor';
import { calendarDateInfo } from '../../lib/calendar-dates';
import { calendarSourcesService } from '../../services/calendar-sources.service';
import { useGoogleBusy } from '../../hooks/useGoogleBusy';

type View = "agenda" | "week" | "month" | "year";
const names = {
  HIGH: "Cao",
  MEDIUM: "Trung bình",
  LOW: "Thấp",
  BLOCK: "Khối giờ",
};
const colors = {
  HIGH: "#dc2626",
  MEDIUM: "#ca8a04",
  LOW: "#16a34a",
  BLOCK: "#2563eb",
};
const time = (d: number) =>
  new Date(d).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
const dayStart = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());
export function CalendarBoard({
  onCreate,
  onDelete,
}: {
  onCreate: (date: Date) => void;
  onDelete: (block: TimeBlock) => void;
}) {
  const [date, setDate] = useState(new Date());
  const [view, setView] = useState<View>("week");
  const [editing, setEditing] = useState<ScheduleSelection | null>(null);
  const [dateMode, setDateMode] = useState('both');
  const [showHolidays, setShowHolidays] = useState(true);
  const [showGoogle, setShowGoogle] = useState(false);
  const [priority, setPriority] = useState("ALL");
  const start =
    view === "year"
      ? new Date(date.getFullYear(), 0, 1)
      : view === "month"
        ? new Date(date.getFullYear(), date.getMonth(), 1)
        : dayStart(date);
  if (view !== "year")
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  const end = new Date(start);
  if (view === "year") end.setFullYear(end.getFullYear() + 1);
  else end.setDate(end.getDate() + (view === "month" ? 42 : 7));
  const personalGoogle = useGoogleBusy(start.toISOString(), end.toISOString());
  const tasks = useQuery({
    queryKey: ["tasks", "calendar"],
    queryFn: tasksService.getCalendarTasks,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
  const blocks = useQuery({
    queryKey: ["time-blocks", start.toISOString(), end.toISOString()],
    queryFn: () =>
      timeBlocksService.getAll({
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      }),
  });
  const google = useQuery({
    queryKey: ['calendar-sources', start.toISOString(), end.toISOString()],
    queryFn: () => calendarSourcesService.getPublicEvents(start.toISOString(), end.toISOString()),
    enabled: showGoogle,
    staleTime: 300000,
  });
  const allEntries = [
    ...(tasks.data || []).map((t) => ({
      id: t.id,
      title: t.title,
      start: Date.parse(t.startAt),
      end: Date.parse(t.dueAt),
      priority: t.priority as keyof typeof names,
      done: t.status === "DONE",
      block: undefined as TimeBlock | undefined,
      task: t as Task | undefined,
    })),
    ...(blocks.data || []).map((b) => ({
      id: b.id,
      title: b.title,
      start: Date.parse(b.startAt),
      end: Date.parse(b.endAt),
      priority: "BLOCK" as const,
      done: false,
      block: b,
      task: undefined as Task | undefined,
    })),
  ]
    .filter((e) => e.start < +end && e.end > +start)
    .sort((a, b) => a.start - b.start);
  const conflicting = new Set<string>();
  allEntries.forEach((a, i) =>
    allEntries.slice(i + 1).forEach((b) => {
      if (!a.done && !b.done && a.start < b.end && b.start < a.end) {
        conflicting.add(a.id);
        conflicting.add(b.id);
      }
    }),
  );
  const entries = allEntries.filter(e => priority === "ALL" || e.priority === priority);
  const timetable = useRef<HTMLDivElement>(null);
  useEffect(() => { if (view === "week" && timetable.current) timetable.current.scrollTop = 8 * 60; }, [view, date, tasks.isLoading, blocks.isLoading]);
  const forDay = (day: Date) => {
    const next = new Date(day);
    next.setDate(next.getDate() + 1);
    return entries.filter((e) => e.start < +next && e.end > +day);
  };
  const move = (n: number) => {
    const next = new Date(date);
    if (view === "week" || view === "agenda") next.setDate(next.getDate() + n * 7);
    else if (view === "month") {
      next.setDate(1);
      next.setMonth(next.getMonth() + n);
    } else {
      next.setDate(1);
      next.setFullYear(next.getFullYear() + n);
    }
    setDate(next);
  };
  const days = Array.from({ length: view === "week" || view === 'agenda' ? 7 : 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return d;
  });
  const card = (entry: (typeof entries)[number], compact = false) => (
    <div
      key={entry.id}
      className={`min-w-0 h-full rounded border border-[var(--border)] border-l-4 bg-[var(--surface-2)] p-3 text-sm [overflow-wrap:anywhere] ${entry.done ? "opacity-60" : ""}`}
      style={{ borderColor: colors[entry.priority] }}
    >
      <div className="flex gap-1 justify-between">
        <button
          type="button"
          aria-label={`Chỉnh thời gian ${entry.title}`}
          onClick={() => setEditing(entry.task ? { task: entry.task } : { block: entry.block! })}
          className={`min-w-0 text-left font-semibold break-words hover:underline ${entry.done ? "line-through" : ""}`}
        >
          {entry.title}
        </button>
        {entry.block && (
          <button
            aria-label={`Xóa ${entry.title}`}
            onClick={() => onDelete(entry.block!)}
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>
      <p>
        {new Date(entry.start).toDateString() !== new Date(entry.end).toDateString() ? `${new Date(entry.start).toLocaleDateString('vi-VN')} ${time(entry.start)} – ${new Date(entry.end).toLocaleDateString('vi-VN')} ${time(entry.end)}` : `${time(entry.start)} – ${time(entry.end)}`}
      </p>
      {!compact && (
        <p>
          {names[entry.priority]}
          {entry.done ? " · Hoàn thành" : ""}
        </p>
      )}
      {conflicting.has(entry.id) && (
        <p className="text-red-600 font-medium">Trùng lịch</p>
      )}
    </div>
  );
  const dayDetails = (day: Date) => {
    const info = calendarDateInfo(day);
    const next = new Date(day); next.setDate(next.getDate() + 1);
    const external = showGoogle ? (google.data?.events || []).filter(e => {
      const from = new Date(e.allDay ? `${e.startAt}T00:00:00` : e.startAt);
      const to = new Date(e.allDay ? `${e.endAt}T00:00:00` : e.endAt);
      return +from < +next && +to > +day;
    }) : [];
    return <div className="space-y-1 text-xs text-[var(--text-2)]">
      {(personalGoogle.data?.busy || []).filter(b => Date.parse(b.startAt) < +next && Date.parse(b.endAt) > +day).map(b => <p key={`${b.startAt}-${b.endAt}`} className="rounded border border-[var(--border)] p-2">Google · Bận {new Date(b.startAt).toLocaleString('vi-VN')} – {new Date(b.endAt).toLocaleString('vi-VN')}</p>)}
      {dateMode !== 'solar' && <p>{info.lunar}</p>}
      {showHolidays && info.holidays.map(h => <p key={h} className="font-medium text-primary-600">{h}</p>)}
      {external.map(e => <p key={e.id} className="break-words">Google · {e.title}{e.allDay ? ' · Cả ngày' : ` · ${time(Date.parse(e.startAt))}`}</p>)}
    </div>;
  };
  return (
    <section className="min-w-0 space-y-4 text-[var(--text)]">
      {personalGoogle.isLoading && <p role="status">Đang tải giờ bận Google…</p>}
      {personalGoogle.isError && <p role="alert">Không tải được lịch Google cá nhân. Chưa thể kiểm tra đầy đủ giờ bận. <button className="underline" onClick={() => personalGoogle.refetch()}>Thử lại</button></p>}
      <div className="flex flex-wrap justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {(["agenda", "week", "month", "year"] as View[]).map((v) => (
            <Button
              key={v}
              variant={view === v ? "default" : "secondary"}
              onClick={() => setView(v)}
            >
              {v === 'agenda' ? 'Lịch theo ngày' : v === "week"
                ? "Thời khóa biểu tuần"
                : v === "month"
                  ? "Tháng"
                  : "Năm"}
            </Button>
          ))}
        </div>
        <label className="text-sm">
          Ưu tiên{" "}
          <select
            className="input ml-2"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            <option value="ALL">Tất cả</option>
            {Object.entries(names).map(([key, name]) => (
              <option key={key} value={key}>
                {name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <label>Hiển thị ngày <select className="input" value={dateMode} onChange={e => setDateMode(e.target.value)}><option value="solar">Dương lịch</option><option value="both">Dương lịch + Âm lịch Việt Nam</option></select></label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={showHolidays} onChange={e => setShowHolidays(e.target.checked)} />Ngày lễ Việt Nam</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={showGoogle} onChange={e => setShowGoogle(e.target.checked)} />Nguồn Google Calendar</label>
      </div>
      {showGoogle && <div className="rounded-lg border border-[var(--border)] p-3 text-sm" role="status">
        {google.isPending ? 'Đang tải nguồn Google Calendar…' : google.isError ? <span>Không tải được nguồn Google. <button className="underline" onClick={() => google.refetch()}>Thử lại</button></span> : google.data?.configured ? 'Đã tải lịch Google công khai · Chỉ đọc, không chặn giờ làm việc.' : 'Nguồn Google Calendar chưa được quản trị viên cấu hình. Lịch công việc và lịch âm vẫn hoạt động.'}
      </div>}
      <div className="flex flex-wrap gap-3 justify-between items-center">
        <div className="flex gap-2 items-center">
          <Button
            variant="ghost"
            aria-label="Kỳ trước"
            onClick={() => move(-1)}
          >
            <ChevronLeft size={18} />
          </Button>
          <h2 className="font-semibold">
            {view === "year"
              ? `Năm ${date.getFullYear()}`
              : view === "month"
                ? `Tháng ${date.getMonth() + 1}, ${date.getFullYear()}`
                : `${start.toLocaleDateString("vi-VN")} – ${days[6].toLocaleDateString("vi-VN")}`}
          </h2>
          <Button variant="ghost" aria-label="Kỳ sau" onClick={() => move(1)}>
            <ChevronRight size={18} />
          </Button>
        </div>
        <Button variant="secondary" onClick={() => setDate(new Date())}>
          Hôm nay
        </Button>
      </div>
      <p className="text-sm text-[var(--text-2)]">
        Giờ hiển thị: {Intl.DateTimeFormat().resolvedOptions().timeZone}. Task
        tự cập nhật từ Công việc và Lên kế hoạch.{" "}
        <Link className="text-primary-600 underline" to="/app/tasks">
          Quản lý công việc
        </Link>
      </p>
      <p className="text-sm text-[var(--text-2)]">Khối giờ là lịch cố định. Khi kéo thả công việc, bạn sẽ được nhắc chỉnh giờ nếu trùng lịch. <Link className="text-primary-600 underline" to="/app/planner">Lập kế hoạch quanh lịch này</Link></p>
      {tasks.isLoading || blocks.isLoading ? (
        <p role="status">Đang tải lịch…</p>
      ) : tasks.isError || blocks.isError ? (
        <div role="alert">
          Không tải được đầy đủ lịch.{" "}
          <button
            className="underline"
            onClick={() => {
              tasks.refetch();
              blocks.refetch();
            }}
          >
            Thử lại
          </button>
        </div>
      ) : view === "year" ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 12 }, (_, month) => {
            const first = new Date(date.getFullYear(), month, 1);
            const next = new Date(date.getFullYear(), month + 1, 1);
            const count = entries.filter(
              (e) => e.start < +next && e.end > +first,
            ).length;
            return (
              <button
                key={month}
                onClick={() => {
                  setDate(first);
                  setView("month");
                }}
                className="border border-[var(--border)] bg-[var(--surface-1)] rounded-xl p-4 text-left"
              >
                <strong>Tháng {month + 1}</strong>
                <span className="float-right text-sm">{count} lịch</span>
                <div className="grid grid-cols-7 text-center text-xs mt-3 gap-1">
                  {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((d) => (
                    <span key={d} className="text-[var(--text-2)]">
                      {d}
                    </span>
                  ))}
                  {Array.from({ length: (first.getDay() + 6) % 7 }, (_, i) => (
                    <span key={`blank${i}`} />
                  ))}
                  {Array.from(
                    {
                      length: new Date(
                        date.getFullYear(),
                        month + 1,
                        0,
                      ).getDate(),
                    },
                    (_, i) => {
                      const list = forDay(
                        new Date(date.getFullYear(), month, i + 1),
                      );
                      return (
                        <span
                          key={i}
                          className={`rounded py-1 ${list.length ? "bg-primary-100 text-primary-800 font-bold" : ""}`}
                        >
                          {i + 1}
                        </span>
                      );
                    },
                  )}
                </div>
              </button>
            );
          })}
        </div>
      ) : view === 'agenda' ? (
        <div className="space-y-4">
          {days.map(day => <article key={+day} className={`min-w-0 rounded-xl border bg-[var(--surface-1)] p-4 md:p-5 ${day.toDateString() === new Date().toDateString() ? 'border-primary-500' : 'border-[var(--border)]'}`}>
            <header className="flex flex-wrap items-start justify-between gap-3 mb-4">
              <div><h3 className="font-semibold text-lg text-[var(--text)]">{day.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}{day.toDateString() === new Date().toDateString() && ' · Hôm nay'}</h3>{dayDetails(day)}</div>
              <Button variant="secondary" size="sm" onClick={() => onCreate(day)}>+ Khối giờ</Button>
            </header>
            <div className="grid grid-cols-1 gap-3">{forDay(day).map(e => card(e))}</div>
            {!forDay(day).length && <p className="text-sm text-[var(--text-2)]">Chưa có công việc hoặc khối giờ.</p>}
          </article>)}
        </div>
      ) : view === "month" ? (
        <div className="overflow-x-auto">
          <div className="grid grid-cols-7 min-w-[720px] border-l border-t border-[var(--border)]">
            {[
              "Thứ 2",
              "Thứ 3",
              "Thứ 4",
              "Thứ 5",
              "Thứ 6",
              "Thứ 7",
              "Chủ nhật",
            ].map((d) => (
              <div
                key={d}
                className="p-2 border-r border-b border-[var(--border)] text-center text-sm"
              >
                {d}
              </div>
            ))}
            {days.map((day) => (
              <div
                key={+day}
                className={`min-h-32 p-2 border-r border-b border-[var(--border)] ${day.getMonth() !== date.getMonth() ? "opacity-50" : "bg-[var(--surface-1)]"}`}
              >
                <button
                  className="font-semibold mb-2"
                  onClick={() => {
                    setDate(day);
                    setView("week");
                  }}
                >
                  {day.getDate()}/{day.getMonth() + 1}
                </button>
                {dayDetails(day)}
                <div className="space-y-1">
                  {forDay(day)
                    .slice(0, 3)
                    .map((e) => card(e, true))}
                  {forDay(day).length > 3 && (
                    <button
                      className="underline text-xs"
                      onClick={() => {
                        setDate(day);
                        setView("week");
                      }}
                    >
                      +{forDay(day).length - 3} lịch · Xem tuần
                    </button>
                  )}
                </div>
                <button
                  className="text-xs text-[var(--text-2)] mt-2"
                  onClick={() => onCreate(day)}
                >
                  + Khối giờ
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div ref={timetable} className="overflow-auto max-h-[720px] border border-[var(--border)] rounded-xl">
          <div className="min-w-[980px]">
            <div className="grid grid-cols-[56px_repeat(7,minmax(0,1fr))] sticky top-0 z-20 bg-[var(--surface-1)] border-b border-[var(--border)]">
              <div />
              {days.map((d) => (
                <div
                  key={+d}
                  className={`p-3 border-l border-[var(--border)] text-sm text-[var(--text)] ${d.toDateString() === new Date().toDateString() ? 'bg-[var(--surface-3)] font-semibold' : ''}`}
                >
                  {d.toLocaleDateString("vi-VN", {
                    weekday: "short",
                    day: "numeric",
                    month: "numeric",
                    year: "numeric",
                  })}
                  {dayDetails(d)}
                  <button
                    type="button"
                    onClick={() => onCreate(d)}
                    aria-label={`Thêm khối thời gian ngày ${d.toLocaleDateString("vi-VN")}`}
                    className="mt-2 block w-full rounded px-1 py-2 text-xs text-primary-600 hover:bg-[var(--surface-2)] focus-visible:outline focus-visible:outline-2"
                  >
                    + Thêm block
                  </button>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-[56px_repeat(7,minmax(0,1fr))]">
              <div className="relative h-[1440px]">
                {Array.from({ length: 24 }, (_, h) => (
                  <span
                    key={h}
                    className="absolute text-xs text-[var(--text-2)] px-1"
                    style={{ top: h * 60 }}
                  >
                    {h.toString().padStart(2, "0")}:00
                  </span>
                ))}
              </div>
              {days.map((day) => {
                const list = forDay(day);
                const next = new Date(day);
                next.setDate(next.getDate() + 1);
                const positioned: { end: number; lane: number }[] = [];
                const placements = list.map((entry) => {
                  const active = positioned.filter((p) => p.end > entry.start);
                  let lane = 0;
                  while (active.some((p) => p.lane === lane)) lane++;
                  positioned.push({ end: entry.end, lane });
                  return { entry, lane };
                });
                const lanes = Math.max(1, ...placements.map((p) => p.lane + 1));
                return (
                  <div
                    key={+day}
                    className="relative h-[1440px] border-l border-[var(--border)]"
                    style={{
                      background:
                        "repeating-linear-gradient(to bottom, transparent 0px, transparent 59px, var(--border) 59px, var(--border) 60px)",
                    }}
                  >
                    {placements.map(({ entry, lane }) => {
                      const from = new Date(Math.max(entry.start, +day));
                      const to = new Date(Math.min(entry.end, +next));
                      const top = from.getHours() * 60 + from.getMinutes();
                      const bottom =
                        +to === +next
                          ? 1440
                          : to.getHours() * 60 + to.getMinutes();
                      return (
                        <div
                          key={entry.id}
                          className="absolute overflow-auto p-0.5"
                          style={{
                            top,
                            height: Math.max(30, bottom - top),
                            left: `${(Math.min(lane, lanes - 1) * 100) / lanes}%`,
                            width: `${100 / lanes}%`,
                          }}
                        >
                          {card(entry)}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
      {showHolidays && <p className="text-xs text-[var(--text-2)]">Ngày lễ truyền thống và ngày cố định để tham khảo; chưa bao gồm lịch nghỉ bù hằng năm. Âm lịch theo Việt Nam (UTC+7).</p>}
      {editing && <ScheduleEditor selection={editing} onClose={() => setEditing(null)} />}
    </section>
  );
}
