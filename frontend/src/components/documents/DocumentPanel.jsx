import { useState } from "react";
import { FileText, Trash2, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { deleteDocument } from "../../api/documents";

/* Sidebar Documents section — DISPLAY ONLY. Lists the documents in the
 * current chat. Uploading happens in the welcome greeting (fresh chat)
 * and via the composer paperclip (ongoing chat), so there's no dropzone
 * here — which also gives the list room to breathe. */
export function DocumentPanel({ documents, onChange }) {
  const [error, setError] = useState(null);

  const handleDelete = async (id, filename) => {
    if (!window.confirm(`Delete "${filename}"? Foliq will no longer use it to answer questions.`)) return;
    try {
      await deleteDocument(id);
      await onChange();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="px-4 pt-3 pb-2 flex-shrink-0">
        <h2 className="font-display text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
          Documents
          {documents.length > 0 && (
            <span className="text-xs font-normal text-slate-400 dark:text-slate-500 normal-case">
              ({documents.length})
            </span>
          )}
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 px-3 pb-3 space-y-0.5">
        {documents.length === 0 ? (
          <p className="text-sm text-slate-400 dark:text-slate-500 px-1 py-2 leading-relaxed">
            No documents in this chat yet. Upload one to start asking questions.
          </p>
        ) : (
          documents.map((doc) => (
            <div
              key={doc.id}
              className="group flex items-center gap-2.5 rounded-lg px-2.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-ink dark:text-slate-200 truncate">{doc.filename}</p>
                <p className="text-xs text-slate-400 flex items-center gap-1">
                  <StatusBadge status={doc.status} />
                  {doc.page_count ? `${doc.page_count} pages` : ""}
                </p>
              </div>
              <button
                onClick={() => handleDelete(doc.id, doc.filename)}
                className="text-slate-400 hover:text-red-600 lg:opacity-0 lg:group-hover:opacity-100 transition-all p-1"
                aria-label={`Delete ${doc.filename}`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
        {error && (
          <p className="text-sm text-red-600 flex items-start gap-1.5 px-1 mt-1">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  if (status === "ready")
    return <CheckCircle2 className="w-3 h-3 text-emerald-500" />;
  if (status === "failed")
    return <AlertCircle className="w-3 h-3 text-red-500" />;
  return <Loader2 className="w-3 h-3 text-slate-400 animate-spin" />;
}
