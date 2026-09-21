import { useEffect, useState } from "react";
import { emptyLanding, type LandingDocument, type Selection } from "./content";
function describe(el: HTMLElement): Selection {
  const style = getComputedStyle(el);
  const image = el instanceof HTMLImageElement ? el : el.querySelector("img");
  return {
    id: el.dataset.cms!,
    tag: el.tagName.toLowerCase(),
    text: el.innerText?.slice(0, 8000) || "",
    src: image?.getAttribute("src") || "",
    alt: image?.getAttribute("alt") || "",
    href: el.getAttribute("href") || "",
    color: style.color,
    backgroundColor: style.backgroundColor,
  };
}
export function useLandingPreview() {
  const preview =
    window.parent !== window &&
    new URLSearchParams(window.location.search).get("editor") === "1";
  const [document, setDocument] = useState<LandingDocument>(emptyLanding);
  const [interactive, setInteractive] = useState(true);
  useEffect(() => {
    if (!preview) return;
    const receive = (event: MessageEvent) => {
      if (event.origin !== location.origin || event.source !== window.parent)
        return;
      if (
        event.data?.type === "cms:document" &&
        event.data.document?.version === 1
      ) {
        setDocument(event.data.document);
        setInteractive(event.data.interactive !== false);
      }
      if (
        event.data?.type === "cms:select" &&
        typeof event.data.id === "string"
      ) {
        const el = [
          ...window.document.querySelectorAll<HTMLElement>("[data-cms]"),
        ].find((e) => e.dataset.cms === event.data.id);
        if (el) {
          el.scrollIntoView({ block: "center", behavior: "smooth" });
          window.parent.postMessage(
            { type: "cms:selected", selection: describe(el) },
            location.origin,
          );
        }
      }
    };
    window.addEventListener("message", receive);
    window.parent.postMessage({ type: "cms:ready" }, location.origin);
    return () => window.removeEventListener("message", receive);
  }, [preview]);
  useEffect(() => {
    if (!preview) return;
    const timer = window.setTimeout(
      () =>
        window.parent.postMessage(
          {
            type: "cms:inventory",
            items: [
              ...window.document.querySelectorAll<HTMLElement>("[data-cms]"),
            ].map(describe),
          },
          location.origin,
        ),
      100,
    );
    return () => clearTimeout(timer);
  }, [preview, document]);
  useEffect(() => {
    if (!preview || !interactive) return;
    const outline = window.document.createElement("div");
    outline.className = "cms-selection-outline";
    const toolbar = window.document.createElement("div");
    toolbar.className = "cms-hover-toolbar";
    let current: HTMLElement | null = null;
    const send = (action: string) => {
      if (current)
        window.parent.postMessage(
          { type: "cms:action", action, selection: describe(current) },
          location.origin,
        );
    };
    for (const [label, action] of [
      ["Sửa", "edit"],
      ["Đổi màu", "color"],
      ["Ẩn", "hide"],
      ["Thêm khối", "add"],
    ]) {
      const button = window.document.createElement("button");
      button.textContent = label;
      button.type = "button";
      button.onclick = () => send(action);
      toolbar.append(button);
    }
    window.document.body.append(outline, toolbar);
    const move = (event: MouseEvent) => {
      if (toolbar.contains(event.target as Node)) return;
      const el = (event.target as Element).closest<HTMLElement>("[data-cms]");
      current = el;
      outline.hidden = toolbar.hidden = !el;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      Object.assign(outline.style, {
        left: `${rect.left}px`,
        top: `${rect.top}px`,
        width: `${rect.width}px`,
        height: `${rect.height}px`,
      });
      Object.assign(toolbar.style, {
        left: `${Math.max(4, Math.min(rect.left, innerWidth - 255))}px`,
        top: `${Math.max(4, rect.top - 35)}px`,
      });
    };
    const click = (event: MouseEvent) => {
      if (toolbar.contains(event.target as Node)) return;
      event.preventDefault();
      event.stopPropagation();
      const el = (event.target as Element).closest<HTMLElement>("[data-cms]");
      if (el) {
        current = el;
        send("edit");
      }
    };
    const scroll = () => {
      outline.hidden = toolbar.hidden = true;
    };
    window.document.addEventListener("mousemove", move);
    window.document.addEventListener("click", click, true);
    window.addEventListener("scroll", scroll);
    return () => {
      outline.remove();
      toolbar.remove();
      window.document.removeEventListener("mousemove", move);
      window.document.removeEventListener("click", click, true);
      window.removeEventListener("scroll", scroll);
    };
  }, [preview, interactive]);
  return { preview, document, interactive };
}
