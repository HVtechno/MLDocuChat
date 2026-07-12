import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, Loader2, ArrowRight } from "lucide-react";
import { createCheckout } from "../api/billing";
import { useAuth } from "../hooks/useAuth";
import { Logo } from "../components/ui/Logo";

/* Free vs Pro. Upgrade sends the user to Polar's hosted checkout (which
 * handles EU VAT as merchant of record). If billing isn't configured yet,
 * the button explains it's coming soon rather than erroring. */
const FREE = [
  "Up to 3 documents",
  "1 project",
  "30 questions / month",
  "All formats (PDF, Word, PowerPoint, Excel…)",
  "Citations to the exact page",
];
const PRO = [
  "Up to 500 documents",
  "Unlimited projects",
  "Unlimited questions",
  "Larger files (50 MB)",
  "All synthesis & research tools",
  "Priority processing",
];

export function Pricing() {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const upgrade = async () => {
    setError(null);
    if (!user) { window.location.href = "/login"; return; }
    setBusy(true);
    try {
      const { url } = await createCheckout();
      window.location.href = url;   // Polar hosted checkout
    } catch (e) {
      setError(e.message || "Checkout isn't available right now.");
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-parchment">
      <nav className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <Logo size={30} />
          <span className="font-display text-xl font-semibold text-ink">Foliq</span>
        </Link>
        <Link to={user ? "/chat" : "/login"} className="text-sm font-medium text-slate-600 hover:text-ink px-4 py-2">
          {user ? "Back to app" : "Log in"}
        </Link>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="font-display text-3xl font-semibold text-ink mb-2">Simple pricing</h1>
          <p className="text-slate-600">Start free. Upgrade when your library grows.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* Free */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-soft p-7">
            <h2 className="font-display text-xl font-semibold text-ink">Free</h2>
            <p className="text-slate-500 text-sm mt-1">To try Foliq properly</p>
            <p className="mt-4 mb-6"><span className="text-3xl font-semibold text-ink">€0</span></p>
            <ul className="space-y-2.5 mb-6">
              {FREE.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
                  <Check className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" /> {f}
                </li>
              ))}
            </ul>
            <Link to={user ? "/chat" : "/login"}
              className="block text-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-ink hover:bg-slate-50 transition-colors">
              {user ? "Current plan" : "Get started"}
            </Link>
          </div>

          {/* Pro */}
          <div className="bg-white rounded-2xl border-2 border-iris shadow-lift p-7 relative">
            <span className="absolute -top-3 left-7 bg-iris text-white text-xs font-medium px-3 py-1 rounded-full">
              Most popular
            </span>
            <h2 className="font-display text-xl font-semibold text-ink">Pro</h2>
            <p className="text-slate-500 text-sm mt-1">Your real research library</p>
            <p className="mt-4 mb-6">
              <span className="text-3xl font-semibold text-ink">€12</span>
              <span className="text-slate-500 text-sm"> / month</span>
            </p>
            <ul className="space-y-2.5 mb-6">
              {PRO.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-slate-700">
                  <Check className="w-4 h-4 text-iris flex-shrink-0 mt-0.5" /> {f}
                </li>
              ))}
            </ul>
            <button
              onClick={upgrade}
              disabled={busy}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-iris text-white px-4 py-2.5 text-sm font-medium hover:bg-iris-deep disabled:opacity-60 transition-colors"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Upgrade to Pro <ArrowRight className="w-4 h-4" /></>}
            </button>
            {error && <p className="text-xs text-red-600 mt-2 text-center">{error}</p>}
            <p className="text-xs text-slate-400 mt-3 text-center">
              Secure checkout via Polar · VAT included · cancel anytime
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
