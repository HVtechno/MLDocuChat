import { useState } from "react";
import { FileText } from "lucide-react";

/* The signature element: an inline source chip. Hovering reveals the
 * exact snippet and page it came from — the visible proof that an answer
 * is grounded in the user's documents. This is the whole product promise,
 * made tangible. */
export function CitationChip({ citation }) {
  const [open, setOpen] = useState(false);
  if (!citation) return null;

  return (
    <span
      className="relative inline-block align-baseline"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        className="mx-0.5 inline-flex items-center justify-center min-w-[20px] h-[20px] px-1
          rounded-md bg-citation-wash text-citation-ink font-mono text-[11px] font-medium
          border border-citation/30 hover:bg-citation hover:text-white transition-colors
          align-text-top translate-y-[-1px]"
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        aria-label={`Source ${citation.n}: ${citation.filename}, page ${citation.page}`}
      >
        {citation.n}
      </button>

      {open && (
        <span
          className="absolute z-20 bottom-full left-1/2 -translate-x-1/2 mb-2 w-72
            animate-fade-up pointer-events-none"
        >
          <span className="block rounded-xl bg-ink text-slate-100 p-3 shadow-lift text-left">
            <span className="flex items-center gap-1.5 text-citation mb-1.5">
              <FileText className="w-3 h-3" />
              <span className="font-mono text-[11px] truncate">{citation.filename}</span>
              <span className="text-slate-400 text-[11px]">· p.{citation.page}</span>
            </span>
            <span className="block text-[12.5px] leading-relaxed text-slate-300">
              {citation.snippet}
              {citation.snippet?.length >= 280 ? "…" : ""}
            </span>
          </span>
        </span>
      )}
    </span>
  );
}
