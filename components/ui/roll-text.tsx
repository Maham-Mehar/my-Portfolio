/**
 * Letters roll vertically — alternating direction — when the nearest `.group`
 * is hovered. Pure CSS (see globals.css); screen readers get the plain label.
 */
export function RollText({ children }: { children: string }) {
  return (
    <span className="inline-block whitespace-nowrap">
      <span className="sr-only">{children}</span>
      <span aria-hidden>
        {Array.from(children).map((char, i) => {
          const c = char === " " ? " " : char;
          return (
            <span key={i} className="roll-char" style={{ "--i": i } as React.CSSProperties}>
              <span>{c}</span>
              <span>{c}</span>
            </span>
          );
        })}
      </span>
    </span>
  );
}
