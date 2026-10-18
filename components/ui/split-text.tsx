import { Children, cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";
import { SplitRoot, SplitWord } from "./split-text-motion";

/*
 * Deliberately not a client module: the children are split where they are
 * authored. Walking children that crossed the server→client boundary sees
 * serialized elements and produces different markup than the server did.
 */

/** Flattens a node tree to plain text (for the screen-reader copy). */
export function nodeText(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(nodeText).join("");
  if (isValidElement<{ children?: ReactNode }>(node)) return nodeText(node.props.children);
  return "";
}

/**
 * Splits strings into masked words while keeping inline elements (e.g. the
 * serif <Accent>) intact around their own split words.
 */
function splitWords(node: ReactNode, counter: { i: number }): ReactNode[] {
  return Children.toArray(node).flatMap((child, ci): ReactNode[] => {
    if (typeof child === "string" || typeof child === "number") {
      return String(child)
        .split(/(\s+)/)
        .filter(Boolean)
        .map((part, pi) =>
          /^\s+$/.test(part) ? (
            " "
          ) : (
            <SplitWord key={`${ci}-${pi}`} i={counter.i++}>
              {part}
            </SplitWord>
          ),
        );
    }
    if (isValidElement<{ children?: ReactNode }>(child)) {
      return [
        cloneElement(child as ReactElement<{ children?: ReactNode }>, {
          key: ci,
          children: splitWords(child.props.children, counter),
        }),
      ];
    }
    return [child];
  });
}

interface SplitTextProps {
  children: ReactNode;
  className?: string;
  as?: "h2" | "h3" | "p" | "span";
  id?: string;
}

/**
 * Masked word-by-word rise when scrolled into view. The visual copy is
 * aria-hidden; screen readers get one clean text node instead.
 */
export function SplitText({ children, className, as = "h2", id }: SplitTextProps) {
  return (
    <SplitRoot as={as} id={id} className={className}>
      <span className="sr-only">{nodeText(children)}</span>
      <span aria-hidden>{splitWords(children, { i: 0 })}</span>
    </SplitRoot>
  );
}
