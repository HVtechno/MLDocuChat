import { useRef, useState } from "react";
import { FileText, Check, Upload, Loader2, AlertCircle } from "lucide-react";

/* Unified document grid for the welcome greeting.
 *
 * Layout (top -> bottom): upload area -> staged uploads + previous documents
 * as one vertical checkbox list -> "Add and continue".
 *
 * Flow: uploading a file STAGES it (uploads to this chat's id, shows it in
 * the list already-ticked) instead of jumping into the chat. Previous docs
 * are ticked to reuse. "Add and continue" then proceeds with everything —
 * new uploads plus selected previous docs — in one action.
 */
export function DocumentGrid({ previousDocs = [], onStageUpload, onContinue, proceeding }) {
  const inputRef = useRef();
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [staged, setStaged] = useState([]);
  const [selectedPrev, setSelectedPrev] = useState(() => new Set());

  const handleFiles = async (files) => {
    const list = Array.from(files || []);
    if (!list.length) return;
    setError(null);
    setUploading(true);
    try {
      const created = await onStageUpload(list);
      if (created?.length) setStaged((s) => [...s, ...created]);
    } catch (e) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  };

  const togglePrev = (id) => setSelectedPrev((p) => {
    const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n;
  });

  const totalSelected = staged.length + selectedPrev.size;
  const busy = uploading || proceeding;

  return (
    <div className="mt-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-surface-dark-raised p-3">

      <button
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
        disabled={busy}
        className={`w-full rounded-lg border-2 border-dashed px-4 py-5 text-center transition-colors disabled:opacity-60
          ${dragging ? "border-iris bg-iris-wash dark:bg-iris/10" : "border-slate-200 dark:border-slate-700 hover:border-iris hover:bg-iris-wash dark:hover:bg-iris/10"}`}
      >
        {uploading ? (
          <span className="flex flex-col items-center gap-1.5 text-slate-500">
            <Loader2 className="w-5 h-5 animate-spin text-iris" />
            <span className="text-sm">Uploading…</span>
          </span>
        ) : (
          <span className="flex flex-col items-center gap-1.5">
            <span className="w-8 h-8 rounded-lg bg-iris-wash dark:bg-iris/20 flex items-center justify-center">
              <Upload className="w-4 h-4 text-iris" />
            </span>
            <span className="text-sm text-iris font-medium">Upload documents</span>
            <span className="text-xs text-slate-400">or drop them here — several at once is fine</span>
          </span>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".pdf,.docx,.txt,.md,.pptx,.xlsx,.csv"
        className="hidden"
        onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }}
      />

      {error && (
        <p className="mt-2 text-sm text-red-600 flex items-start gap-1.5">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />{error}
        </p>
      )}

      {/* Scrollable document list: staged uploads + previous docs */}
      {(staged.length > 0 || previousDocs.length > 0) && (
        <div className="mt-3 max-h-[320px] overflow-y-auto scroll-smooth pr-1 -mr-1">
          {staged.length > 0 && (
            <div>
              <p className="text-xs text-slate-400 dark:text-slate-500 px-1 mb-1.5">Selected to add:</p>
              {staged.map((doc) => (
                <Row key={doc.id} doc={doc} checked disabled
                     note={doc.status === "processing" ? "just uploaded · processing…" : "just uploaded"} />
              ))}
            </div>
          )}

          {previousDocs.length > 0 && (
            <div className={staged.length > 0 ? "mt-3" : ""}>
              {staged.length > 0 && <div className="h-px bg-slate-100 dark:bg-slate-800 mb-3" />}
              <p className="text-xs text-slate-400 dark:text-slate-500 px-1 mb-1.5">Or reuse a previous document:</p>
              {previousDocs.map((doc) => (
                <Row key={doc.id} doc={doc} checked={selectedPrev.has(doc.id)}
                     onClick={() => togglePrev(doc.id)}
                     note={doc.page_count ? `${doc.page_count} pages` : ""} />
              ))}
            </div>
          )}
        </div>
      )}

      {(staged.length > 0 || previousDocs.length > 0) && (
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
          <span className="text-xs text-slate-400">
            {totalSelected === 0
              ? "Upload or select documents"
              : `${totalSelected} selected` +
                (staged.length && selectedPrev.size
                  ? ` (${staged.length} new, ${selectedPrev.size} previous)`
                  : "")}
          </span>
          <button
            onClick={() => onContinue([...selectedPrev])}
            disabled={busy || totalSelected === 0}
            className="inline-flex items-center gap-1.5 rounded-lg bg-iris text-white text-sm font-medium
              px-4 py-1.5 hover:bg-iris-deep disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {proceeding ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {proceeding ? "Adding…" : "Add and continue"}
          </button>
        </div>
      )}
    </div>
  );
}

function Row({ doc, checked, onClick, disabled, note }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-left transition-colors mb-0.5
        ${checked ? "bg-iris-wash dark:bg-iris/10" : "hover:bg-slate-50 dark:hover:bg-slate-800/60"}
        ${disabled ? "cursor-default" : ""}`}
    >
      <span className={`flex-shrink-0 w-4 h-4 rounded flex items-center justify-center
        ${checked ? "bg-iris border border-iris" : "border border-slate-300 dark:border-slate-600"}`}>
        {checked && <Check className="w-3 h-3 text-white" />}
      </span>
      <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
      <span className="flex-1 min-w-0">
        <span className="block text-sm text-ink dark:text-slate-200 truncate">{doc.filename}</span>
        {note && <span className="block text-xs text-slate-400 flex items-center gap-1">
          {doc.status === "processing" && <Loader2 className="w-3 h-3 animate-spin" />}
          {note}
        </span>}
      </span>
    </button>
  );
}
