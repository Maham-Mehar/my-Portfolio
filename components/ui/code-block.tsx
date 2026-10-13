import { Fragment } from "react";

/**
 * Minimal TS/TSX highlighter — enough for short illustrative snippets without
 * shipping a syntax-highlighting library.
 */
const TOKEN =
  /(\/\/.*$)|(`(?:\\`|[^`])*`|"(?:\\"|[^"])*")|\b(const|let|type|export|function|return|async|await|if|switch|case|throw|new|as|import|from|default)\b|(<\/?[A-Z][\w.]*|\/>)|\b([A-Z][A-Za-z0-9]*)\b|\b(\d+)\b/gm;

const classFor = ["", "text-subtle italic", "text-[#9be3c6]", "text-violet", "text-accent-soft", "text-cyan", "text-[#f5c98b]"];

function highlight(code: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  let last = 0;
  let key = 0;
  for (const match of code.matchAll(TOKEN)) {
    const start = match.index ?? 0;
    if (start > last) out.push(code.slice(last, start));
    const group = match.findIndex((m, i) => i > 0 && m !== undefined);
    out.push(
      <span key={key++} className={classFor[group]}>
        {match[0]}
      </span>,
    );
    last = start + match[0].length;
  }
  if (last < code.length) out.push(code.slice(last));
  return out;
}

export function CodeBlock({ code, filename }: { code: string; filename: string }) {
  const lines = code.split("\n");
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-ink-950/80">
      <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
        <span className="font-mono text-[0.7rem] text-muted">{filename}</span>
        <span className="label-mono text-[0.6rem] text-subtle">Example</span>
      </div>
      <pre className="no-scrollbar overflow-x-auto p-4 font-mono text-[0.75rem] leading-[1.7] text-fg/90 sm:text-[0.8rem]">
        <code>
          {lines.map((line, i) => (
            <Fragment key={i}>
              <span aria-hidden className="mr-4 inline-block w-5 text-right text-subtle/50 select-none">
                {i + 1}
              </span>
              {highlight(line)}
              {"\n"}
            </Fragment>
          ))}
        </code>
      </pre>
    </div>
  );
}
