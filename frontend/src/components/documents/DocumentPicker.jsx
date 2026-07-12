import { useState } from "react";
import { FileText, Check, Loader2 } from "lucide-react";

/* Shown inline in a fresh chat when the user has documents from other
 * chats. Multi-select: tick the documents to bring into this chat, then
 * "Add & continue" attaches them all and re-runs the original question. */
export function DocumentPicker({ documents, onConfirm, busy }) {
  const [selected, setSelected] = useState(() => new Set());

  if (!documents?.length) return null;

  const toggle = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const count = selected.size;

  return (
    <div className="mt-4 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-700">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
          Your previous documents — select any to use here
        </p>
      </div>

      <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-64 overflow-y-auto">
        {documents.map((doc) => {
          const isSel = selected.has(doc.id);
          return (
            <button
              key={doc.id}
              onClick={() => toggle(doc.id)}
              disabled={busy}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left
                hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors disabled:opacity-50"
            >
              {/* checkbox */}
              <span className={`flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors
                ${isSel ? "bg-iris border-iris" : "border-slate-300 dark:border-slate-600"}`}>
                {isSel && <Check className="w-3 h-3 text-white" />}
              </span>
              <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <span className="flex-1 min-w-0">
                <span className="block text-sm text-ink dark:text-slate-200 truncate">{doc.filename}</span>
                {doc.page_count ? (
                  <span className="block text-xs text-slate-400">{doc.page_count} pages</span>
                ) : null}
              </span>
            </button>
          );
        })}
      </div>

      <div className="px-3 py-2.5 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
        <span className="text-xs text-slate-400">
          {count === 0 ? "None selected" : `${count} selected`}
        </span>
        <button
          onClick={() => onConfirm([...selected])}
          disabled={busy || count === 0}
          className="inline-flex items-center gap-1.5 rounded-lg bg-iris text-white text-sm font-medium
            px-3 py-1.5 hover:bg-iris-deep disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {busy ? "Adding…" : "Add & continue"}
        </button>
      </div>
    </div>
  );
}
