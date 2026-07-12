import { useState } from "react";
import { Menu, X, Plus } from "lucide-react";
import { Logo } from "../ui/Logo";
import { AccountMenu } from "./AccountMenu";

/* Responsive shell: persistent sidebar on desktop, slide-over drawer on
 * tablet/mobile. Sidebar holds documents + chat history; footer is the
 * ChatGPT-style account menu. Surfaces are dark-mode aware. */
export function AppShell({ sidebar, children, onNewChat, onManageDocuments }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="h-screen flex bg-parchment dark:bg-surface-dark overflow-hidden">
      {open && (
        <div className="fixed inset-0 bg-ink/40 z-30 lg:hidden" onClick={() => setOpen(false)} />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-[300px] flex flex-col transition-transform duration-300 lg:translate-x-0
          bg-white dark:bg-surface-dark-raised border-r border-slate-200 dark:border-slate-800
          ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex items-center justify-between px-4 h-14 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Logo size={26} />
            <span className="font-display text-lg font-semibold text-ink dark:text-slate-100">Foliq</span>
          </div>
          <button
            className="lg:hidden text-slate-400 hover:text-ink dark:hover:text-slate-100 p-1"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-4 py-3">
          <button
            onClick={() => { onNewChat?.(); setOpen(false); }}
            className="w-full flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2.5
              text-sm font-medium text-ink dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600
              hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <Plus className="w-4 h-4" /> New project
          </button>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0">{sidebar}</div>

        <div className="border-t border-slate-100 dark:border-slate-800 p-2">
          <AccountMenu onManageDocuments={onManageDocuments} />
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden flex items-center gap-3 px-4 h-14 border-b border-slate-200 dark:border-slate-800
          bg-white dark:bg-surface-dark-raised">
          <button
            className="text-slate-500 hover:text-ink dark:hover:text-slate-100 p-1"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Logo size={22} />
          <span className="font-display text-lg font-semibold text-ink dark:text-slate-100">Foliq</span>
        </header>
        <main className="flex-1 min-h-0 flex flex-col">{children}</main>
      </div>
    </div>
  );
}
