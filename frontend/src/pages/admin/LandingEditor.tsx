import { useCallback, useEffect, useRef, useState } from "react";
import { useBlocker } from "react-router-dom";
import {
  Save,
  Upload,
  Undo2,
  Redo2,
  Monitor,
  Smartphone,
  Plus,
  Eye,
  MousePointer2,
  RotateCcw,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import api from "../../services/api";
import { useAuthStore } from "../../store/auth.store";
import {
  emptyLanding,
  validLink,
  type ContentBlock,
  type ElementPatch,
  type LandingDocument,
  type Selection,
} from "../../components/landing-editor/content";
import "./landing-editor.css";
function message(error: unknown) {
  const e = error as {
    response?: {
      status?: number;
      data?: { message?: string; error?: { message?: string } };
    };
  };
  return e.response?.status === 409
    ? "Bản nháp đã được thay đổi ở phiên khác. Sao chép nội dung cần giữ rồi tải lại."
    : e.response?.data?.error?.message ||
        e.response?.data?.message ||
        "Không thể kết nối máy chủ. Thay đổi của bạn vẫn được giữ trên màn hình.";
}
function hex(color: string) {
  if (/^#[0-9a-f]{6}$/i.test(color)) return color;
  const parts = color.match(/\d+/g);
  return parts && parts.length >= 3
    ? "#" +
        parts
          .slice(0, 3)
          .map((n) => Number(n).toString(16).padStart(2, "0"))
          .join("")
    : "#ffffff";
}
export function LandingEditor() {
  const { user } = useAuthStore();
  const frame = useRef<HTMLIFrameElement>(null);
  const [doc, setDoc] = useState<LandingDocument>(emptyLanding);
  const [saved, setSaved] = useState("");
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [selection, setSelection] = useState<Selection | null>(null);
  const [inventory, setInventory] = useState<Selection[]>([]);
  const [past, setPast] = useState<LandingDocument[]>([]);
  const [future, setFuture] = useState<LandingDocument[]>([]);
  const [mobile, setMobile] = useState(false);
  const [interactive, setInteractive] = useState(true);
  const [confirmPublish, setConfirmPublish] = useState(false);
  const dirty = !!saved && JSON.stringify(doc) !== saved;
  const blocker = useBlocker(dirty);
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/admin/landing");
      setDoc(data.data.draft);
      setSaved(JSON.stringify(data.data.draft));
      setRevision(data.data.revision);
      setPast([]);
      setFuture([]);
      setSelection(null);
    } catch (e) {
      setError(message(e));
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    if (user?.role === "ADMIN") void load();
    else setLoading(false);
  }, [load, user?.role]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  const update = useCallback(
    (next: LandingDocument) => {
      if (busy) return;
      setPast((p) => [...p.slice(-39), doc]);
      setFuture([]);
      setDoc(next);
      setNotice("");
    },
    [doc, busy],
  );
  const send = useCallback(
    () =>
      frame.current?.contentWindow?.postMessage(
        { type: "cms:document", document: doc, interactive },
        location.origin,
      ),
    [doc, interactive],
  );
  useEffect(() => send(), [send]);
  useEffect(() => {
    const receive = (e: MessageEvent) => {
      if (
        e.origin !== location.origin ||
        e.source !== frame.current?.contentWindow
      )
        return;
      if (e.data?.type === "cms:ready") send();
      if (e.data?.type === "cms:inventory") setInventory(e.data.items);
      if (e.data?.type === "cms:selected") setSelection(e.data.selection);
      if (e.data?.type === "cms:action") {
        const s = e.data.selection as Selection;
        setSelection(s);
        if (e.data.action === "hide") {
          if (s.id.startsWith("block-"))
            update({
              ...doc,
              blocks: doc.blocks.map((b) =>
                `block-${b.id}` === s.id ? { ...b, hidden: true } : b,
              ),
            });
          else
            update({
              ...doc,
              elements: {
                ...doc.elements,
                [s.id]: { ...doc.elements[s.id], hidden: true },
              },
            });
        }
        if (e.data.action === "add")
          document.getElementById("cms-add")?.focus();
        if (e.data.action === "color")
          document.getElementById("cms-color")?.focus();
      }
    };
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, [doc, send, update]);
  const block = doc.blocks.find((b) => `block-${b.id}` === selection?.id);
  const patch = selection ? doc.elements[selection.id] || {} : {};
  const change = (values: ElementPatch & Partial<ContentBlock>) => {
    if (!selection) return;
    if (block)
      update({
        ...doc,
        blocks: doc.blocks.map((b) =>
          b.id === block.id ? { ...b, ...values } : b,
        ),
      });
    else
      update({
        ...doc,
        elements: { ...doc.elements, [selection.id]: { ...patch, ...values } },
      });
  };
  const add = (kind: "banner" | "article") => {
    if (doc.blocks.length >= 30) {
      setError("Tối đa 30 bài viết và banner.");
      return;
    }
    const b: ContentBlock = {
      id: crypto.randomUUID(),
      kind,
      title: kind === "banner" ? "Chương trình mới" : "Bài viết mới",
      body: "Nhập nội dung của bạn tại đây.",
      position: kind === "banner" ? "top" : "bottom",
      backgroundColor: "#132537",
      color: "#ffffff",
      buttonText: "Tìm hiểu thêm",
      href: "/register",
      buttonColor: "#56cddd",
    };
    update({ ...doc, blocks: [...doc.blocks, b] });
    setSelection({
      id: `block-${b.id}`,
      tag: "section",
      text: b.title,
      src: "",
      href: b.href!,
      alt: "",
      color: b.color!,
      backgroundColor: b.backgroundColor!,
    });
  };
  const validate = () => {
    for (const p of [...Object.values(doc.elements), ...doc.blocks]) {
      if (p.src && !validLink(p.src, true))
        return "Ảnh cần dùng URL HTTPS hoặc đường dẫn bắt đầu bằng /.";
      if (p.href && !validLink(p.href))
        return "Liên kết cần dùng HTTPS, / hoặc #.";
    }
    return "";
  };
  const save = async () => {
    const invalid = validate();
    if (invalid) {
      setError(invalid);
      return;
    }
    setBusy(true);
    setError("");
    try {
      const { data } = await api.put("/admin/landing", {
        revision,
        document: doc,
      });
      setRevision(data.data.revision);
      setSaved(JSON.stringify(doc));
      setNotice("Đã lưu bản nháp. Trang công khai chưa thay đổi.");
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  };
  const publish = async () => {
    setConfirmPublish(false);
    setBusy(true);
    setError("");
    try {
      const { data } = await api.post("/admin/landing/publish", { revision });
      setRevision(data.data.revision);
      setNotice(
        "Đã xuất bản. Khách truy cập sẽ thấy nội dung mới khi tải trang.",
      );
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  };
  const upload = async (file?: File) => {
    if (!file || !selection) return;
    if (file.size > 3 * 1024 * 1024) {
      setError("Ảnh tối đa 3 MB.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const body = new FormData();
      body.append("file", file);
      const { data } = await api.post("/admin/landing/assets", body, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const src = data.data.path;
      const next = block
        ? {
            ...doc,
            blocks: doc.blocks.map((b) =>
              b.id === block.id ? { ...b, src } : b,
            ),
          }
        : {
            ...doc,
            elements: { ...doc.elements, [selection.id]: { ...patch, src } },
          };
      setPast((p) => [...p.slice(-39), doc]);
      setFuture([]);
      setDoc(next);
      setNotice("Đã tải ảnh. Lưu bản nháp để giữ thay đổi.");
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  };
  const restore = () => {
    if (!selection) return;
    if (block) {
      update({ ...doc, blocks: doc.blocks.filter((b) => b.id !== block.id) });
      setSelection(null);
    } else {
      const elements = { ...doc.elements };
      delete elements[selection.id];
      update({ ...doc, elements });
    }
  };
  const move = (offset: number) => {
    if (!block) return;
    const index = doc.blocks.indexOf(block),
      target = index + offset;
    if (target < 0 || target >= doc.blocks.length) return;
    const blocks = [...doc.blocks];
    [blocks[index], blocks[target]] = [blocks[target], blocks[index]];
    update({ ...doc, blocks });
  };
  if (user?.role !== "ADMIN")
    return (
      <div className="le-page">
        <h1>Biên tập landing page</h1>
        <p>Chỉ quản trị viên ADMIN có quyền biên tập và xuất bản.</p>
      </div>
    );
  return (
    <div className="le-page">
      <header className="le-title">
        <div>
          <span>NỘI DUNG & GIAO DIỆN</span>
          <h1>Biên tập landing page</h1>
          <p>
            Chọn thành phần ngay trên trang. Chỉ xuất bản khi bạn đã sẵn sàng.
          </p>
        </div>
        <a href="/landing" target="_blank" rel="noreferrer">
          Mở trang công khai ↗
        </a>
      </header>
      <div className="le-toolbar">
        <div>
          <button
            title="Hoàn tác"
            aria-label="Hoàn tác"
            disabled={!past.length || busy}
            onClick={() => {
              setFuture((f) => [doc, ...f]);
              setDoc(past[past.length - 1]);
              setPast((p) => p.slice(0, -1));
            }}
          >
            <Undo2 size={17} />
          </button>
          <button
            title="Làm lại"
            aria-label="Làm lại"
            disabled={!future.length || busy}
            onClick={() => {
              setPast((p) => [...p, doc]);
              setDoc(future[0]);
              setFuture((f) => f.slice(1));
            }}
          >
            <Redo2 size={17} />
          </button>
          <button aria-pressed={!mobile} onClick={() => setMobile(false)}>
            <Monitor size={17} />
            Máy tính
          </button>
          <button aria-pressed={mobile} onClick={() => setMobile(true)}>
            <Smartphone size={17} />
            Điện thoại
          </button>
          <button
            aria-pressed={interactive}
            onClick={() => setInteractive((v) => !v)}
          >
            {interactive ? <MousePointer2 size={17} /> : <Eye size={17} />}{" "}
            {interactive ? "Đang biên tập" : "Xem trước"}
          </button>
        </div>
        <div>
          <span className="le-status">
            {dirty ? "Chưa lưu" : "Bản nháp đã lưu"}
          </span>
          <button disabled={busy || loading || !saved || !dirty} onClick={save}>
            <Save size={16} />
            Lưu nháp
          </button>
          <button
            className="le-primary"
            disabled={busy || loading || dirty || !saved}
            onClick={() => setConfirmPublish(true)}
          >
            <Upload size={16} />
            Xuất bản
          </button>
        </div>
      </div>
      {error && (
        <div className="le-error" role="alert">
          {error}{" "}
          <button
            disabled={busy}
            onClick={() => {
              if (
                !dirty ||
                window.confirm("Tải lại sẽ bỏ thay đổi chưa lưu. Tiếp tục?")
              )
                void load();
            }}
          >
            Tải lại bản nháp
          </button>
        </div>
      )}
      {notice && (
        <p className="le-notice" role="status">
          {notice}
        </p>
      )}
      {loading ? (
        <div className="le-loading">Đang tải bản nháp…</div>
      ) : !saved ? (
        <div className="le-loading">
          Chưa tải được bản nháp. Hãy thử lại để bắt đầu.
        </div>
      ) : (
        <div className="le-workspace">
          <div className={`le-canvas ${mobile ? "mobile" : ""}`}>
            <iframe
              ref={frame}
              src="/landing?editor=1"
              title="Bản xem trước landing page"
              onLoad={send}
            />
          </div>
          <aside className="le-inspector" aria-label="Thuộc tính thành phần">
            <fieldset disabled={busy}>
              <div className="le-add">
                <button id="cms-add" onClick={() => add("banner")}>
                  <Plus size={16} />
                  Banner
                </button>
                <button onClick={() => add("article")}>
                  <Plus size={16} />
                  Bài viết
                </button>
              </div>
              <label>
                Chọn thành phần
                <select
                  value={selection?.id || ""}
                  onChange={(e) =>
                    frame.current?.contentWindow?.postMessage(
                      { type: "cms:select", id: e.target.value },
                      location.origin,
                    )
                  }
                >
                  <option value="">Rê chuột hoặc chọn từ danh sách</option>
                  {inventory.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.id === "hero-image"
                        ? "Ảnh banner chính"
                        : `${item.tag} · ${item.text.slice(0, 45) || item.alt || "Ảnh"}`}
                    </option>
                  ))}
                </select>
              </label>
              {selection ? (
                <>
                  <div className="le-selected">
                    <strong>
                      {block
                        ? block.kind === "banner"
                          ? "Banner khuyến mãi"
                          : "Bài viết"
                        : selection.id === "hero-image"
                          ? "Ảnh banner chính"
                          : `Thành phần ${selection.tag}`}
                    </strong>
                    <code>{selection.id}</code>
                  </div>
                  {block ? (
                    <>
                      <label>
                        Tiêu đề
                        <input
                          maxLength={2000}
                          value={block.title}
                          onChange={(e) => change({ title: e.target.value })}
                        />
                      </label>
                      <label>
                        Nội dung bài viết
                        <textarea
                          rows={7}
                          maxLength={8000}
                          value={block.body}
                          onChange={(e) => change({ body: e.target.value })}
                        />
                      </label>
                      <label>
                        Nhãn nút
                        <input
                          maxLength={100}
                          value={block.buttonText || ""}
                          onChange={(e) =>
                            change({ buttonText: e.target.value })
                          }
                        />
                      </label>
                      <label>
                        Vị trí
                        <select
                          value={block.position}
                          onChange={(e) =>
                            change({
                              position: e.target.value as "top" | "bottom",
                            })
                          }
                        >
                          <option value="top">Sau banner chính</option>
                          <option value="bottom">Trước chân trang</option>
                        </select>
                      </label>
                      <div className="le-add">
                        <button
                          aria-label="Đưa lên"
                          disabled={doc.blocks.indexOf(block) === 0}
                          onClick={() => move(-1)}
                        >
                          <ArrowUp size={16} />
                          Lên
                        </button>
                        <button
                          aria-label="Đưa xuống"
                          disabled={
                            doc.blocks.indexOf(block) === doc.blocks.length - 1
                          }
                          onClick={() => move(1)}
                        >
                          <ArrowDown size={16} />
                          Xuống
                        </button>
                      </div>
                    </>
                  ) : (
                    !["section", "header", "footer", "img", "div"].includes(
                      selection.tag,
                    ) && (
                      <label>
                        Nội dung hiển thị
                        <textarea
                          rows={4}
                          maxLength={8000}
                          value={patch.text ?? selection.text}
                          onChange={(e) => change({ text: e.target.value })}
                        />
                      </label>
                    )
                  )}
                  {(block || selection.tag === "a") && (
                    <label>
                      Liên kết nút
                      <input
                        value={block?.href ?? patch.href ?? selection.href}
                        onChange={(e) => change({ href: e.target.value })}
                        placeholder="/register hoặc https://..."
                      />
                    </label>
                  )}
                  {(block ||
                    selection.tag === "img" ||
                    selection.id === "hero-image") && (
                    <>
                      <label>
                        Ảnh (URL)
                        <input
                          value={block?.src ?? patch.src ?? selection.src}
                          onChange={(e) => change({ src: e.target.value })}
                          placeholder="https://..."
                        />
                      </label>
                      <label className="le-file">
                        <Upload size={16} />
                        Tải ảnh từ máy
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          onChange={(e) => {
                            void upload(e.target.files?.[0]);
                            e.target.value = "";
                          }}
                        />
                      </label>
                      <small>PNG, JPEG, WebP · tối đa 3 MB</small>
                      <label>
                        Mô tả ảnh
                        <input
                          maxLength={500}
                          value={block?.alt ?? patch.alt ?? selection.alt}
                          onChange={(e) => change({ alt: e.target.value })}
                        />
                      </label>
                    </>
                  )}
                  <div className="le-colors">
                    <label>
                      Màu chữ
                      <input
                        id="cms-color"
                        type="color"
                        value={hex(
                          block?.color ?? patch.color ?? selection.color,
                        )}
                        onChange={(e) => change({ color: e.target.value })}
                      />
                    </label>
                    <label>
                      Màu nền
                      <input
                        type="color"
                        value={hex(
                          block?.backgroundColor ??
                            patch.backgroundColor ??
                            selection.backgroundColor,
                        )}
                        onChange={(e) =>
                          change({ backgroundColor: e.target.value })
                        }
                      />
                    </label>
                    {block && (
                      <label>
                        Màu nút
                        <input
                          type="color"
                          value={block.buttonColor || "#56cddd"}
                          onChange={(e) =>
                            change({ buttonColor: e.target.value })
                          }
                        />
                      </label>
                    )}
                  </div>
                  <label className="le-check">
                    <input
                      type="checkbox"
                      checked={block?.hidden ?? patch.hidden ?? false}
                      onChange={(e) => change({ hidden: e.target.checked })}
                    />
                    Ẩn khỏi trang công khai
                  </label>
                  <p className="le-hint">
                    Thành phần bị ẩn vẫn xuất hiện mờ trong chế độ biên tập để
                    bạn khôi phục.
                  </p>
                  <button className="le-reset" onClick={restore}>
                    <RotateCcw size={15} />
                    {block ? "Xóa khối này" : "Khôi phục mặc định"}
                  </button>
                </>
              ) : (
                <div className="le-help">
                  <MousePointer2 size={25} />
                  <h2>Chọn để chỉnh sửa</h2>
                  <p>
                    Rê chuột lên tiêu đề, nút, ảnh hoặc khối nội dung. Nhấn
                    “Sửa” để điều chỉnh ở đây.
                  </p>
                  <p>
                    Thêm banner cho chiến dịch hoặc bài viết mới bằng hai nút
                    phía trên.
                  </p>
                </div>
              )}
            </fieldset>
          </aside>
        </div>
      )}
      {(confirmPublish || blocker.state === "blocked") && (
        <div
          className="le-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="le-dialog-title"
        >
          <div>
            <h2 id="le-dialog-title">
              {confirmPublish
                ? "Xuất bản bản nháp hiện tại?"
                : "Bạn có thay đổi chưa lưu"}
            </h2>
            <p>
              {confirmPublish
                ? "Nội dung, hình ảnh và màu sắc đã lưu sẽ thay thế phiên bản công khai."
                : "Ở lại để lưu bản nháp hoặc rời trang và bỏ thay đổi."}
            </p>
            <div className="le-add">
              <button
                autoFocus
                onClick={() => {
                  setConfirmPublish(false);
                  if (blocker.state === "blocked") blocker.reset();
                }}
              >
                Quay lại
              </button>
              <button
                className="le-primary"
                onClick={() => {
                  if (confirmPublish) void publish();
                  else if (blocker.state === "blocked") blocker.proceed();
                }}
              >
                {confirmPublish ? "Xuất bản ngay" : "Rời trang"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
