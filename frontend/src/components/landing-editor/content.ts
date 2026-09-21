export type ElementPatch = {
  text?: string;
  src?: string;
  alt?: string;
  href?: string;
  color?: string;
  backgroundColor?: string;
  hidden?: boolean;
};
export type ContentBlock = ElementPatch & {
  id: string;
  kind: "banner" | "article";
  title: string;
  body: string;
  buttonText?: string;
  buttonColor?: string;
  position: "top" | "bottom";
};
export type LandingDocument = {
  version: 1;
  elements: Record<string, ElementPatch>;
  blocks: ContentBlock[];
};
export type Selection = {
  id: string;
  tag: string;
  text: string;
  src: string;
  href: string;
  alt: string;
  color: string;
  backgroundColor: string;
};
export const emptyLanding: LandingDocument = {
  version: 1,
  elements: {},
  blocks: [],
};
export function validLink(value: string, image = false) {
  if ([...value].some((char) => char.charCodeAt(0) <= 32 || char === "\\"))
    return false;
  if (/^\/(?!\/)/.test(value) || (!image && /^#[a-zA-Z0-9_-]+$/.test(value)))
    return true;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}
