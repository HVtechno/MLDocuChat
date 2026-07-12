import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

/* Minimal cookie consent banner. Stores the choice in localStorage under
 * "cookieConsent" ("accepted" | "necessary"). No tracking is wired up — this
 * is the consent surface; if analytics are added later, gate them on
 * localStorage.getItem("cookieConsent") === "accepted". */
const KEY = "cookieConsent";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(KEY)) setVisible(true);
  }, []);

  const choose = (val) => {
    localStorage.setItem(KEY, val);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:max-w-md z-50">
      <div className="bg-white dark:bg-surface-dark-raised rounded-2xl shadow-lift border border-slate-100 dark:border-slate-800 p-4">
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          We use necessary cookies to keep you logged in, and optional analytics
          with your consent. See our{" "}
          <Link to="/cookies" className="text-iris hover:underline">Cookie Policy</Link>.
        </p>
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => choose("accepted")}
            className="flex-1 rounded-lg bg-iris text-white text-sm font-medium px-3 py-2 hover:bg-iris-deep transition-colors"
          >
            Accept all
          </button>
          <button
            onClick={() => choose("necessary")}
            className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-medium px-3 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Necessary only
          </button>
        </div>
      </div>
    </div>
  );
}
