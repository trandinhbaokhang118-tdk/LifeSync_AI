import { landingImageUrl } from "./media";
import {
  Children,
  cloneElement,
  isValidElement,
  type CSSProperties,
  type ReactNode,
  type ReactElement,
} from "react";
import type { LandingDocument } from "./content";
import { validLink } from "./content";
type Props = {
  children?: ReactNode;
  style?: CSSProperties;
  "data-cms"?: string;
  "data-cms-image"?: boolean;
  src?: string;
  to?: string;
  href?: string;
  customImage?: string;
  hidden?: boolean;
};
// Only explicitly marked React elements can be edited. No HTML or CSS is executed.
export function renderContent(
  tree: ReactNode,
  document: LandingDocument,
  editing: boolean,
): ReactNode {
  return Children.map(tree, (node) => {
    if (!isValidElement<Props>(node)) return node;
    const id = node.props["data-cms"];
    const patch = id ? document.elements[id] : undefined;
    if (patch?.hidden && !editing) return null;
    const props: Record<string, unknown> = {};
    if (patch) {
      props.style = {
        ...node.props.style,
        ...(patch.color ? { color: patch.color } : {}),
        ...(patch.backgroundColor
          ? { backgroundColor: patch.backgroundColor }
          : {}),
        ...(patch.text !== undefined ? { whiteSpace: "pre-line" } : {}),
        ...(patch.hidden ? { opacity: 0.35 } : {}),
      };
      if (patch.src && validLink(patch.src, true)) {
        if (typeof node.type === "string")
          props.src = landingImageUrl(patch.src);
        else props.customImage = landingImageUrl(patch.src);
      }
      if (patch.alt !== undefined) props.alt = patch.alt;
      if (patch.href && validLink(patch.href)) {
        if (node.props.to !== undefined) props.to = patch.href;
        else props.href = patch.href;
      }
    }
    const children =
      patch?.text !== undefined
        ? patch.text
        : renderContent(node.props.children, document, editing);
    return node.props.children !== undefined
      ? cloneElement(node as ReactElement<Props>, props, children)
      : cloneElement(node, props);
  });
}
