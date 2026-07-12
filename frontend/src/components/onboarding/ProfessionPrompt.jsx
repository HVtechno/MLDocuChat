import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { PROFESSIONS } from "../../hooks/useResearchMode";
import { Logo } from "../ui/Logo";

/* Shown once, after first login, when the user hasn't chosen a profession
 * yet. Their choice decides whether Foliq runs in research mode (synthesis
 * tools) or the general experience. Can be changed later in Settings. */
export function ProfessionPrompt() {
  const { user, updateProfile } = useAuth();
  const [saving, setSaving] = useState(null);

  const choose = async (profession) => {
    setSaving(profession);
    try {
      await updateProfile({ profession });
    } catch {
      setSaving(null);
    }
  };

  const firstName = (user?.nickname || user?.email || "there").split("@")[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-parchment dark:bg-surface-dark">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-6">
          <Logo size={30} />
          <span className="font-display text-xl font-semibold text-ink dark:text-slate-100">Foliq</span>
        </div>

        <div className="bg-white dark:bg-surface-dark-raised rounded-2xl shadow-lift border border-slate-100 dark:border-slate-800 p-6">
          <h1 className="font-display text-xl font-semibold text-ink dark:text-slate-100 mb-1">
            Welcome, {firstName} 👋
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
            What best describes you? This tailors Foliq to how you work — you can
            change it anytime in settings.
          </p>

          <div className="space-y-2">
            {PROFESSIONS.map((p) => (
              <button
                key={p.value}
                onClick={() => choose(p.value)}
                disabled={!!saving}
                className="w-full flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-700
                  px-4 py-3 text-left hover:border-iris hover:bg-iris-wash dark:hover:bg-iris/10 transition-colors
                  disabled:opacity-50"
              >
                <div className="flex-1">
                  <div className="text-sm font-medium text-ink dark:text-slate-100">{p.label}</div>
                  <div className="text-xs text-slate-400 dark:text-slate-500">{p.hint}</div>
                </div>
                {saving === p.value && <Loader2 className="w-4 h-4 animate-spin text-iris" />}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
