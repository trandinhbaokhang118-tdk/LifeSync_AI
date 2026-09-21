import { landingImageUrl } from "./media";
import type { ContentBlock } from "./content";
import { validLink } from "./content";
export function ContentBlocks({
  blocks,
  position,
  editing,
}: {
  blocks: ContentBlock[];
  position: "top" | "bottom";
  editing: boolean;
}) {
  return (
    <>
      {blocks
        .filter((b) => b.position === position && (editing || !b.hidden))
        .map((b) => (
          <section
            key={b.id}
            data-cms={`block-${b.id}`}
            className={`cms-block cms-block--${b.kind}`}
            style={{
              color: b.color,
              backgroundColor: b.backgroundColor,
              opacity: b.hidden ? 0.35 : 1,
            }}
          >
            {b.src && validLink(b.src, true) && (
              <img
                src={landingImageUrl(b.src)}
                alt={b.alt || b.title}
                loading="lazy"
              />
            )}
            <div>
              <p className="landing-label">
                {b.kind === "banner"
                  ? "Chương trình nổi bật"
                  : "Tin từ LifeSync"}
              </p>
              <h2>{b.title}</h2>
              <p className="cms-block-body">{b.body}</p>
              {b.buttonText && b.href && validLink(b.href) && (
                <a
                  className="landing-button landing-button--primary"
                  href={b.href}
                  style={{ backgroundColor: b.buttonColor }}
                >
                  {b.buttonText}
                </a>
              )}
            </div>
          </section>
        ))}
    </>
  );
}
