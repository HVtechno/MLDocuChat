import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Sun, Moon, LogOut, Settings as SettingsIcon, ChevronsUpDown, Sparkles, MessageSquarePlus, BarChart3 } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../hooks/useTheme";
import { FeedbackModal } from "../FeedbackModal";

const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);

/* ChatGPT-style account control at the bottom of the sidebar. Clicking
 * the row opens a popover with account info, a theme toggle, a shortcut
 * to manage documents, and log out. Closes on outside-click or Escape. */
export function AccountMenu({ onManageDocuments }) {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const [open, setOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const initials = (user?.nickname || user?.email || "?").slice(0, 2).toUpperCase();
  const planLabel = (user?.plan || "free").replace(/^\w/, (c) => c.toUpperCase());
  const isAdmin = ADMIN_EMAILS.includes((user?.email || "").toLowerCase());
  // Admins see an "Admin" badge instead of their billing tier.
  const roleLabel = isAdmin ? "Admin" : planLabel;

  return (
    <div className="relative" ref={ref}>
      {/* Popover */}
      {open && (
        <div className="absolute bottom-full left-0 right-0 mb-2 rounded-xl border border-slate-200 dark:border-slate-700
          bg-white dark:bg-surface-dark-raised shadow-lift overflow-hidden animate-fade-up z-50">
          {/* account header */}
          <div className="px-3 py-3 border-b border-slate-100 dark:border-slate-700">
            <p className="text-sm font-medium text-ink dark:text-slate-100 truncate">{user?.nickname || user?.email?.split("@")[0]}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 truncate">{user?.email}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{roleLabel}</p>
          </div>

          <div className="p-1">
            {/* theme toggle */}
            <button
              onClick={toggle}
              className="w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-slate-700 dark:text-slate-300
                hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              <span className="flex-1 text-left">{theme === "dark" ? "Light mode" : "Dark mode"}</span>
            </button>

            {/* manage documents */}
            <button
              onClick={() => { onManageDocuments?.(); setOpen(false); }}
              className="w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-slate-700 dark:text-slate-300
                hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <SettingsIcon className="w-4 h-4" />
              <span className="flex-1 text-left">Settings</span>
            </button>

            {/* upgrade — free non-admin users only */}
            {!isAdmin && (user?.plan || "free") !== "pro" && (
              <Link
                to="/pricing"
                onClick={() => setOpen(false)}
                className="w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-iris font-medium
                  hover:bg-iris-wash dark:hover:bg-iris/10 transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                <span className="flex-1 text-left">Upgrade to Pro</span>
              </Link>
            )}

            {/* feedback */}
            <button
              onClick={() => { setFeedbackOpen(true); setOpen(false); }}
              className="w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-slate-700 dark:text-slate-300
                hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <MessageSquarePlus className="w-4 h-4" />
              <span className="flex-1 text-left">Send feedback</span>
            </button>

            {/* admin — only for admin emails */}
            {isAdmin && (
              <Link
                to="/admin"
                onClick={() => setOpen(false)}
                className="w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-slate-700 dark:text-slate-300
                  hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <BarChart3 className="w-4 h-4" />
                <span className="flex-1 text-left">Admin</span>
              </Link>
            )}
          </div>

          <div className="p-1 border-t border-slate-100 dark:border-slate-700">
            <button
              onClick={logout}
              className="w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-red-600
                hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="flex-1 text-left">Log out</span>
            </button>
          </div>
        </div>
      )}

      {/* Trigger row */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2.5 rounded-xl px-2 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      >
        <span className="w-8 h-8 rounded-lg bg-iris text-white flex items-center justify-center text-xs font-semibold flex-shrink-0">
          {initials}
        </span>
        <span className="flex-1 min-w-0 text-left">
          <span className="block text-sm font-medium text-ink dark:text-slate-100 truncate">
            {user?.nickname || user?.email?.split("@")[0]}
          </span>
          <span className={`block text-xs ${isAdmin ? "text-iris font-medium" : "text-slate-400 dark:text-slate-500"}`}>{roleLabel}</span>
        </span>
        <ChevronsUpDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
      </button>

      <FeedbackModal open={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
    </div>
  );
}
