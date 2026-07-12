import { useState } from "react";
import { Star, Loader2, X } from "lucide-react";
import { submitFeedback } from "../api/billing";

/* Star rating + optional comment. Opens from the account menu. */
export function FeedbackModal({ open, onClose }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  if (!open) return null;

  const close = () => {
    setRating(0); setHover(0); setComment(""); setBusy(false); setDone(false);
    onClose?.();
  };

  const send = async () => {
    if (rating < 1) return;
    setBusy(true);
    try {
      await submitFeedback(rating, comment.trim() || null);
      setDone(true);
      setTimeout(close, 1200);
    } catch {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm" onClick={close}>
      <div className="w-full max-w-sm bg-white dark:bg-surface-dark-raised rounded-2xl shadow-lift p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-display text-lg font-semibold text-ink dark:text-slate-100">Send feedback</h2>
          <button onClick={close} className="text-slate-400 hover:text-ink dark:hover:text-slate-200"><X className="w-5 h-5" /></button>
        </div>

        {done ? (
          <p className="text-sm text-emerald-600 py-6 text-center">Thanks for the feedback! 🙏</p>
        ) : (
          <>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">How's your experience with Foliq?</p>
            <div className="flex gap-1 mb-4">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onMouseEnter={() => setHover(n)}
                  onMouseLeave={() => setHover(0)}
                  onClick={() => setRating(n)}
                  className="p-1"
                >
                  <Star
                    className={`w-7 h-7 transition-colors ${
                      n <= (hover || rating)
                        ? "fill-citation-amber text-citation-amber"
                        : "text-slate-300 dark:text-slate-600"
                    }`}
                  />
                </button>
              ))}
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Anything you'd like us to know? (optional)"
              rows={3}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-surface-dark px-3 py-2 text-sm text-ink dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-iris resize-none"
            />
            <button
              onClick={send}
              disabled={busy || rating < 1}
              className="w-full mt-4 inline-flex items-center justify-center gap-2 rounded-lg bg-iris text-white text-sm font-medium px-4 py-2.5 hover:bg-iris-deep disabled:opacity-40 transition-colors"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send feedback"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
