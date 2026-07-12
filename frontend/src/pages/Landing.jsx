import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  FileText, Library, GitCompare, Quote, ShieldCheck, ArrowRight,
  Microscope, GraduationCap, Briefcase, MessageCircle, Sun, Moon,
} from "lucide-react";
import { CitationChip } from "../components/chat/CitationChip";
import { Logo } from "../components/ui/Logo";
import { useTheme } from "../hooks/useTheme";

/* Landing page. Dual positioning: built for researchers (persistent library +
 * cross-paper synthesis), works for anyone. Consistent CTAs ("Start free" /
 * "Log in"), pricing in the header, dark-mode toggle, and a profession-tools
 * section that makes the tailored one-click actions visible. */
export function Landing() {
  const { theme, toggle } = useTheme();

  // Subtle scroll-fade: reveal sections as they enter the viewport.
  const reveal = useReveal();

  return (
    <div className="min-h-screen bg-parchment dark:bg-surface-dark">
      {/* Nav */}
      <nav className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Logo size={30} />
          <span className="font-display text-xl font-semibold text-ink dark:text-slate-100">Foliq</span>
        </div>
        <div className="flex items-center gap-5">
          <a href="#how" className="hidden sm:inline text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-ink dark:hover:text-white">How it works</a>
          <Link to="/pricing" className="hidden sm:inline text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-ink dark:hover:text-white">Pricing</Link>
          <button onClick={toggle} aria-label="Toggle dark mode" className="text-slate-500 dark:text-slate-400 hover:text-ink dark:hover:text-white">
            {theme === "dark" ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
          </button>
          <Link to="/login" className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-ink dark:hover:text-white">Log in</Link>
          <Link to="/login" className="text-sm font-medium bg-iris text-white rounded-xl px-4 py-2 hover:bg-iris-deep transition-colors">Start free</Link>
        </div>
      </nav>

      {/* Hero */}
      <header className="max-w-6xl mx-auto px-6 pt-16 pb-20 grid lg:grid-cols-2 gap-12 items-center">
        <div ref={reveal}>
          <p className="font-mono text-xs uppercase tracking-widest text-citation-ink mb-4">
            Built for research · works for anything
          </p>
          <h1 className="font-display text-display-lg font-semibold text-ink dark:text-slate-100 mb-5 leading-[1.1]">
            Ask across <span className="text-iris">all</span> your papers, not one at a time.
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-8 max-w-md">
            Foliq is a research library that thinks. Add your papers, then ask
            questions that span the whole collection — with every answer citing
            the exact paper and page. Perfect for literature reviews.
          </p>
          <div className="flex items-center gap-3">
            <Link to="/login" className="bg-iris text-white rounded-xl px-6 py-3 font-medium hover:bg-iris-deep shadow-soft hover:shadow-lift transition-all inline-flex items-center gap-2">
              Start free <ArrowRight className="w-4 h-4" />
            </Link>
            <span className="text-sm text-slate-500 dark:text-slate-400">No card required</span>
          </div>
        </div>

        {/* Signature moment: a cross-paper answer citing MULTIPLE papers */}
        <div ref={reveal} className="bg-white dark:bg-surface-dark-raised rounded-2xl shadow-lift border border-slate-100 dark:border-slate-800 p-6">
          <div className="flex items-center gap-2 pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
            <Library className="w-4 h-4 text-iris" />
            <span className="font-mono text-xs text-slate-500 dark:text-slate-400">Thesis library · 24 papers</span>
          </div>
          <div className="space-y-4">
            <div className="flex justify-end">
              <span className="bg-iris text-white rounded-2xl rounded-tr-md px-4 py-2 text-sm max-w-[85%]">
                Where do these papers disagree on transformer efficiency?
              </span>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0"><Logo size={28} /></div>
              <p className="text-[15px] leading-[1.7] text-ink dark:text-slate-200">
                Two camps emerge. Vaswani et al. argue attention scales
                acceptably with sequence length
                <CitationChip citation={{ n: 1, filename: "attention-is-all-you-need.pdf", page: 6, snippet: "Self-attention layers connect all positions with a constant number of sequential operations." }} />,
                while Tay et al. show quadratic cost becomes prohibitive past
                long contexts
                <CitationChip citation={{ n: 2, filename: "efficient-transformers-survey.pdf", page: 3, snippet: "The O(n²) memory and compute of standard attention limits practical sequence length." }} />
                — a direct tension your review should address
                <CitationChip citation={{ n: 3, filename: "long-range-arena.pdf", page: 8, snippet: "Benchmarks reveal efficiency claims often fail to hold under long-context evaluation." }} />.
              </p>
            </div>
          </div>
          <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
            One question, answered across three papers — hover a chip for the source
          </p>
        </div>
      </header>

      {/* Why not just a chatbot */}
      <section id="how" ref={reveal} className="max-w-6xl mx-auto px-6 py-8">
        <h2 className="font-display text-2xl font-semibold text-ink dark:text-slate-100 text-center mb-2">
          Why not just a chatbot?
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-center mb-12 max-w-xl mx-auto">
          A general chatbot forgets your papers between chats. Foliq remembers
          your whole library and reasons across it — the way a literature review
          actually works.
        </p>
        <div className="grid sm:grid-cols-3 gap-8">
          <Point icon={Library} title="A library that persists">
            Add papers over weeks or months into a project. Foliq keeps the
            whole collection and searches all of it — not one PDF you re-upload
            each session.
          </Point>
          <Point icon={GitCompare} title="Synthesis across papers">
            Ask what your sources agree on, where they conflict, which support a
            claim, or what's missing — answered across the entire collection at once.
          </Point>
          <Point icon={Quote} title="Citations you can defend">
            Every claim points to the exact paper and page. Drop it straight into
            your literature review, confident you can trace every source.
          </Point>
        </div>
      </section>

      {/* Tools that fit how you work — profession actions */}
      <section ref={reveal} className="max-w-6xl mx-auto px-6 py-12">
        <h2 className="font-display text-2xl font-semibold text-ink dark:text-slate-100 text-center mb-2">
          Tools that fit how you work
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-center mb-10 max-w-xl mx-auto">
          Tell Foliq what you do, and it gives you one-click actions built for
          your work — each profession gets its own. Every answer still cited.
        </p>
        <div className="grid sm:grid-cols-2 gap-4 max-w-4xl mx-auto">
          <ProfCard icon={Microscope} tint="iris" title="Researchers"
            actions={["Find agreements", "Find conflicts", "Spot gaps", "Summarize the landscape"]} />
          <ProfCard icon={GraduationCap} tint="violet" title="Students"
            actions={["Explain simply", "Key concepts", "Quiz me", "Make study notes"]} />
          <ProfCard icon={Briefcase} tint="emerald" title="Professionals"
            actions={["Summarize key points", "Extract action items", "Find red flags", "Compare documents"]} />
          <ProfCard icon={MessageCircle} tint="slate" title="Everyone else"
            note="Just a clean, direct chat with your documents — no extra buttons, ask anything." />
        </div>
      </section>

      {/* On-ramp for everyone else */}
      <section ref={reveal} className="max-w-6xl mx-auto px-6 py-12">
        <div className="bg-white dark:bg-surface-dark-raised rounded-2xl border border-slate-100 dark:border-slate-800 shadow-soft p-8 sm:p-12 flex flex-col sm:flex-row items-start sm:items-center gap-8 justify-between">
          <div className="max-w-lg">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-5 h-5 text-slate-400" />
              <span className="font-mono text-xs uppercase tracking-widest text-slate-400">Not writing a thesis?</span>
            </div>
            <h3 className="font-display text-2xl font-semibold text-ink dark:text-slate-100 mb-2">
              It works for any document, too.
            </h3>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[15px]">
              Reports, contracts, manuals, handbooks — upload anything and ask.
              Word, PowerPoint, Excel, PDF, and more. Every answer sourced,
              nothing shared, nothing public.
            </p>
          </div>
          <Link to="/login" className="flex-shrink-0 bg-ink dark:bg-white text-white dark:text-ink rounded-xl px-6 py-3 font-medium hover:bg-ink-soft dark:hover:bg-slate-200 transition-colors inline-flex items-center gap-2">
            Start free <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Trust strip */}
      <section className="max-w-6xl mx-auto px-6 pb-10">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 text-sm text-slate-500 dark:text-slate-400">
          <ShieldCheck className="w-4 h-4 text-iris" />
          <span>Your documents stay private to your account. We never train on your files.</span>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500 dark:text-slate-400">
          <span>© {new Date().getFullYear()} Foliq</span>
          <div className="flex items-center gap-5">
            <Link to="/pricing" className="hover:text-ink dark:hover:text-white">Pricing</Link>
            <Link to="/privacy" className="hover:text-ink dark:hover:text-white">Privacy</Link>
            <Link to="/cookies" className="hover:text-ink dark:hover:text-white">Cookies</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Point({ icon: Icon, title, children }) {
  return (
    <div>
      <div className="w-10 h-10 rounded-xl bg-iris-wash dark:bg-iris/20 flex items-center justify-center mb-3">
        <Icon className="w-5 h-5 text-iris" />
      </div>
      <h3 className="font-display text-lg font-semibold text-ink dark:text-slate-100 mb-1.5">{title}</h3>
      <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[15px]">{children}</p>
    </div>
  );
}

const TINTS = {
  iris: "bg-iris-wash dark:bg-iris/20 text-iris",
  violet: "bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-300",
  emerald: "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300",
  slate: "bg-slate-100 dark:bg-slate-700/40 text-slate-500 dark:text-slate-300",
};

function ProfCard({ icon: Icon, tint, title, actions, note }) {
  return (
    <div className="bg-white dark:bg-surface-dark-raised border border-slate-100 dark:border-slate-800 rounded-2xl p-5">
      <div className="flex items-center gap-2.5 mb-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${TINTS[tint]}`}>
          <Icon className="w-4 h-4" />
        </div>
        <span className="font-medium text-ink dark:text-slate-100">{title}</span>
      </div>
      {note ? (
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{note}</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {actions.map((a) => (
            <span key={a} className="text-xs border border-slate-200 dark:border-slate-700 rounded-full px-2.5 py-1 text-slate-600 dark:text-slate-300">
              {a}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* Returns a callback ref you attach to multiple elements; each fades/rises in
 * once when it first scrolls into view. Respects reduced-motion. */
function useReveal() {
  const els = useRef([]);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      els.current.forEach((el) => el && el.classList.add("reveal-shown"));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("reveal-shown"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    els.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);
  return (el) => { if (el && !els.current.includes(el)) { el.classList.add("reveal"); els.current.push(el); } };
}
