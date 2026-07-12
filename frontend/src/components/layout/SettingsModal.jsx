import { useState, useEffect, useCallback } from "react";
import {
  X, FileText, Trash2, Check, Loader2, Download,
  Database, FolderOpen, AlertTriangle, User,
} from "lucide-react";
import { listLibrary, deleteDocument } from "../../api/documents";
import {
  deleteAllChats, deleteAccountData, deleteDocumentsBatch, exportData,
} from "../../api/account";
import { useAuth } from "../../hooks/useAuth";
import { PROFESSIONS } from "../../hooks/useResearchMode";

/* ChatGPT-style Settings modal. Tabs:
 *   Profile       — nickname + profession (drives research mode).
 *   Documents     — list all documents, multi-select, delete permanently.
 *   Data controls — delete all chats, export data, delete account.
 */
export function SettingsModal({ open, onClose, onChanged }) {
  const [tab, setTab] = useState("profile");
  const { logout } = useAuth();

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/50" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[85vh] rounded-2xl bg-white dark:bg-surface-dark-raised
        shadow-lift border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col animate-fade-up">

        {/* header */}
        <div className="flex items-center justify-between px-5 h-14 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
          <h2 className="font-display text-lg font-semibold text-ink dark:text-slate-100">Settings</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-ink dark:hover:text-slate-100 p-1" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* tab rail */}
          <div className="w-44 border-r border-slate-100 dark:border-slate-800 p-2 flex-shrink-0">
            <TabButton active={tab === "profile"} onClick={() => setTab("profile")} icon={User}>
              Profile
            </TabButton>
            <TabButton active={tab === "documents"} onClick={() => setTab("documents")} icon={FolderOpen}>
              Documents
            </TabButton>
            <TabButton active={tab === "data"} onClick={() => setTab("data")} icon={Database}>
              Data controls
            </TabButton>
          </div>

          {/* content */}
          <div className="flex-1 overflow-y-auto p-5 min-h-0">
            {tab === "profile"
              ? <ProfileTab onChanged={onChanged} />
              : tab === "documents"
              ? <DocumentsTab onChanged={onChanged} />
              : <DataControlsTab onChanged={onChanged} onLogout={logout} />}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------- Profile tab ----------------
function ProfileTab({ onChanged }) {
  const { user, updateProfile } = useAuth();
  const [nickname, setNickname] = useState(user?.nickname || "");
  const [profession, setProfession] = useState(user?.profession || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = async () => {
    setSaving(true); setSaved(false);
    try {
      await updateProfile({
        nickname: nickname.trim() || null,
        profession: profession || null,
      });
      setSaved(true);
      onChanged?.();
      setTimeout(() => setSaved(false), 2000);
    } catch {}
    setSaving(false);
  };

  const isResearch = profession === "researcher" || profession === "student";
  const hasTools = ["researcher", "student", "professional"].includes(profession);

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-ink dark:text-slate-100 mb-1.5">Nickname</label>
        <p className="text-xs text-slate-400 mb-2">Shown across Foliq instead of your email.</p>
        <input
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="What should we call you?"
          className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-surface-dark
            px-3 py-2 text-sm text-ink dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-iris"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-ink dark:text-slate-100 mb-1.5">What describes you?</label>
        <p className="text-xs text-slate-400 mb-2">
          Researchers and students get synthesis tools for working across many papers.
        </p>
        <div className="space-y-2">
          {PROFESSIONS.map((p) => (
            <button
              key={p.value}
              onClick={() => setProfession(p.value)}
              className={`w-full flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors
                ${profession === p.value
                  ? "border-iris bg-iris-wash dark:bg-iris/10"
                  : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"}`}
            >
              <span className={`flex-shrink-0 w-4 h-4 rounded-full border flex items-center justify-center
                ${profession === p.value ? "bg-iris border-iris" : "border-slate-300 dark:border-slate-600"}`}>
                {profession === p.value && <Check className="w-2.5 h-2.5 text-white" />}
              </span>
              <span className="flex-1">
                <span className="block text-sm text-ink dark:text-slate-100">{p.label}</span>
                <span className="block text-xs text-slate-400">{p.hint}</span>
              </span>
            </button>
          ))}
        </div>
        {hasTools && (
          <p className="text-xs text-iris mt-2">
            One-click tools are on — you'll see quick actions tailored to you in projects with 2+ documents.
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-1.5 rounded-lg bg-iris text-white text-sm font-medium px-4 py-2
            hover:bg-iris-deep disabled:opacity-50 transition-colors"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Save changes
        </button>
        {saved && <span className="text-sm text-emerald-600">Saved ✓</span>}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, children }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors
        ${active
          ? "bg-iris-wash dark:bg-iris/20 text-ink dark:text-slate-100 font-medium"
          : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
    >
      <Icon className="w-4 h-4" /> {children}
    </button>
  );
}

// ---------------- Documents tab ----------------
function DocumentsTab({ onChanged }) {
  const [docs, setDocs] = useState([]);
  const [selected, setSelected] = useState(() => new Set());
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const all = await listLibrary();
      // de-dupe by filename so copies (from "attach") don't clutter
      const seen = new Set();
      const unique = [];
      for (const d of all) {
        if (seen.has(d.filename)) continue;
        seen.add(d.filename);
        unique.push(d);
      }
      setDocs(unique);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggle = (id) => setSelected((p) => {
    const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n;
  });

  const deleteSelected = async () => {
    if (selected.size === 0) return;
    if (!window.confirm(`Permanently delete ${selected.size} document(s)? This can't be undone.`)) return;
    setBusy(true);
    try {
      await deleteDocumentsBatch([...selected]);
      setSelected(new Set());
      await load();
      onChanged?.();
    } catch {}
    setBusy(false);
  };

  if (loading) return <Center><Loader2 className="w-5 h-5 animate-spin text-iris" /></Center>;

  if (docs.length === 0)
    return <p className="text-sm text-slate-400 dark:text-slate-500 py-8 text-center">No documents yet.</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {selected.size > 0 ? `${selected.size} selected` : `${docs.length} document(s)`}
        </p>
        <button
          onClick={deleteSelected}
          disabled={selected.size === 0 || busy}
          className="inline-flex items-center gap-1.5 rounded-lg text-sm font-medium px-3 py-1.5
            text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          Delete selected
        </button>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-800">
        {docs.map((doc) => {
          const isSel = selected.has(doc.id);
          return (
            <button
              key={doc.id}
              onClick={() => toggle(doc.id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
            >
              <span className={`flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center
                ${isSel ? "bg-iris border-iris" : "border-slate-300 dark:border-slate-600"}`}>
                {isSel && <Check className="w-3 h-3 text-white" />}
              </span>
              <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <span className="flex-1 min-w-0">
                <span className="block text-sm text-ink dark:text-slate-200 truncate">{doc.filename}</span>
                {doc.page_count ? <span className="block text-xs text-slate-400">{doc.page_count} pages</span> : null}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------------- Data controls tab ----------------
function DataControlsTab({ onChanged, onLogout }) {
  const [busy, setBusy] = useState(null);
  const [confirmText, setConfirmText] = useState("");

  const doDeleteChats = async () => {
    if (!window.confirm("Delete ALL projects? Your documents will be kept. This can't be undone.")) return;
    setBusy("chats");
    try { await deleteAllChats(); onChanged?.(); } catch {}
    setBusy(null);
  };

  const doExport = async () => {
    setBusy("export");
    try { await exportData(); } catch {}
    setBusy(null);
  };

  const [error, setError] = useState(null);

  const doDeleteAccount = async () => {
    setError(null);
    setBusy("account");
    try {
      await deleteAccountData();
      // Only sign out if the delete actually succeeded.
      onLogout();
    } catch (e) {
      setError(e.message || "Could not delete account. Please try again.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-5">
      <Row
        title="Export my data"
        desc="Download all your projects and document list as a JSON file."
        action={
          <button onClick={doExport} disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-medium px-3 py-1.5
              text-ink dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50">
            {busy === "export" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Export
          </button>
        }
      />

      <Row
        title="Delete all projects"
        desc="Remove every project. Your uploaded documents are kept."
        action={
          <button onClick={doDeleteChats} disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-lg text-sm font-medium px-3 py-1.5
              text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors disabled:opacity-50">
            {busy === "chats" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Delete all
          </button>
        }
      />

      {/* danger zone */}
      <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 p-4">
        <div className="flex items-start gap-2 mb-2">
          <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-ink dark:text-slate-100">Delete account</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Permanently deletes all your projects, documents, and files, and signs you out.
              This cannot be undone.
            </p>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="Type DELETE to confirm"
            className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-surface-dark
              px-3 py-1.5 text-sm text-ink dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-red-400"
          />
          <button
            onClick={doDeleteAccount}
            disabled={confirmText !== "DELETE" || busy}
            className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 text-white text-sm font-medium px-3 py-1.5
              hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {busy === "account" ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Delete account
          </button>
        </div>
        {error && (
          <p className="text-sm text-red-600 mt-2">{error}</p>
        )}
      </div>
    </div>
  );
}

function Row({ title, desc, action }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-ink dark:text-slate-100">{title}</p>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{desc}</p>
      </div>
      <div className="flex-shrink-0">{action}</div>
    </div>
  );
}

function Center({ children }) {
  return <div className="flex items-center justify-center py-10">{children}</div>;
}
