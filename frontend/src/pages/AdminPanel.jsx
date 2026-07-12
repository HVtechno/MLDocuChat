import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Loader2, Users, FileText, MessageSquare, HardDrive } from "lucide-react";
import { getAdminMetrics } from "../api/billing";
import { Logo } from "../components/ui/Logo";

/* Owner-only aggregate analytics. Never shows document contents — just
 * totals, breakdowns, and feedback. Access is gated server-side by
 * ADMIN_EMAILS; non-admins get a 403 which we show as "not authorized". */
export function AdminPanel() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    getAdminMetrics().then(setData).catch((e) => setError(e.message));
  }, []);

  if (error) {
    return (
      <Shell>
        <p className="text-slate-500">{error.includes("403") || error.toLowerCase().includes("admin")
          ? "You're not authorized to view this page." : error}</p>
      </Shell>
    );
  }
  if (!data) {
    return <Shell><Loader2 className="w-6 h-6 animate-spin text-iris" /></Shell>;
  }

  return (
    <Shell>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Stat icon={Users} label="Users" value={data.users.total}
          sub={`${data.users.pro} Pro · ${data.users.free} Free`} />
        <Stat icon={FileText} label="Documents" value={data.documents.total}
          sub={`${data.documents.total_pages} pages`} />
        <Stat icon={HardDrive} label="Storage" value={`${data.documents.total_mb} MB`} />
        <Stat icon={MessageSquare} label="Feedback" value={data.feedback.count}
          sub={data.feedback.average_rating ? `avg ${data.feedback.average_rating}★` : "no ratings yet"} />
      </div>

      {/* File types */}
      <Section title="Documents by type">
        {Object.keys(data.documents.by_type).length === 0 ? (
          <p className="text-sm text-slate-400">No documents yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {Object.entries(data.documents.by_type)
              .sort((a, b) => b[1] - a[1])
              .map(([ext, count]) => (
                <span key={ext} className="inline-flex items-center gap-1.5 rounded-full bg-white border border-slate-200 px-3 py-1.5 text-sm">
                  <span className="font-mono text-slate-500">{ext}</span>
                  <span className="text-ink font-medium">{count}</span>
                </span>
              ))}
          </div>
        )}
      </Section>

      {/* Recent feedback */}
      <Section title="Recent feedback">
        {data.feedback.recent.length === 0 ? (
          <p className="text-sm text-slate-400">No feedback yet.</p>
        ) : (
          <div className="space-y-2">
            {data.feedback.recent.map((f, i) => (
              <div key={i} className="bg-white border border-slate-100 rounded-xl p-3">
                <div className="flex items-center justify-between">
                  <span className="text-citation-amber text-sm">{"★".repeat(f.rating)}<span className="text-slate-300">{"★".repeat(5 - f.rating)}</span></span>
                  <span className="text-xs text-slate-400">{f.email || "anonymous"}</span>
                </div>
                {f.comment && <p className="text-sm text-slate-600 mt-1">{f.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </Section>
    </Shell>
  );
}

function Shell({ children }) {
  return (
    <div className="min-h-screen bg-parchment">
      <nav className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/chat" className="flex items-center gap-2">
          <Logo size={30} />
          <span className="font-display text-xl font-semibold text-ink">Foliq</span>
          <span className="text-xs font-mono text-slate-400 ml-1">admin</span>
        </Link>
        <Link to="/chat" className="text-sm font-medium text-slate-600 hover:text-ink px-4 py-2">Back to app</Link>
      </nav>
      <div className="max-w-5xl mx-auto px-6 py-8">{children}</div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, sub }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-soft p-5">
      <div className="flex items-center gap-2 text-slate-400 mb-2">
        <Icon className="w-4 h-4" />
        <span className="text-xs uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-2xl font-semibold text-ink">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="mb-8">
      <h2 className="font-display text-lg font-semibold text-ink mb-3">{title}</h2>
      {children}
    </div>
  );
}
