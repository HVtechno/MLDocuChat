import { Link } from "react-router-dom";
import { Logo } from "../components/ui/Logo";

function LegalShell({ title, updated, children }) {
  return (
    <div className="min-h-screen bg-parchment">
      <nav className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <Logo size={30} />
          <span className="font-display text-xl font-semibold text-ink">Foliq</span>
        </Link>
        <Link to="/" className="text-sm font-medium text-slate-600 hover:text-ink px-4 py-2">Home</Link>
      </nav>
      <div className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="font-display text-3xl font-semibold text-ink mb-1">{title}</h1>
        <p className="text-sm text-slate-400 mb-8">Last updated: {updated}</p>
        <div className="prose-answer space-y-5 text-[15px] text-slate-700 leading-relaxed">
          {children}
        </div>
        <p className="text-xs text-slate-400 mt-12">© {new Date().getFullYear()} Foliq</p>
      </div>
    </div>
  );
}

export function PrivacyPage() {
  return (
    <LegalShell title="Privacy Policy" updated="July 2026">
      <p>
        Foliq ("we") respects your privacy. This policy explains what we collect,
        why, and your rights. We aim to collect as little as possible.
      </p>
      <h2 className="font-display text-lg font-semibold text-ink">What we collect</h2>
      <p>
        Your account email and nickname; the documents you upload and the
        questions you ask; and basic technical data needed to run the service.
        Your documents are stored securely and are accessible only to your
        account. We do not sell your data, and we do not use your documents to
        train AI models.
      </p>
      <h2 className="font-display text-lg font-semibold text-ink">How we use it</h2>
      <p>
        To provide the service — storing your documents, answering your
        questions, and maintaining your account. Answering questions involves
        sending relevant excerpts to our AI provider (OpenAI) to generate a
        response; they process it to return an answer and do not use it to train
        their models under our agreement.
      </p>
      <h2 className="font-display text-lg font-semibold text-ink">Your rights</h2>
      <p>
        You can export or delete your data at any time from Settings. Deleting
        your account permanently removes your documents and chats. If you are in
        the EU/EEA, you have rights under the GDPR including access, correction,
        and erasure.
      </p>
      <h2 className="font-display text-lg font-semibold text-ink">Payments</h2>
      <p>
        Payments are handled by Polar, our merchant of record, who process your
        payment details securely. We never see or store your card information.
      </p>
      <h2 className="font-display text-lg font-semibold text-ink">Contact</h2>
      <p>
        For any privacy questions or requests, contact us through the feedback
        option in the app.
      </p>
    </LegalShell>
  );
}

export function CookiePage() {
  return (
    <LegalShell title="Cookie Policy" updated="July 2026">
      <p>
        Foliq uses a small number of cookies and similar technologies. We keep
        this minimal.
      </p>
      <h2 className="font-display text-lg font-semibold text-ink">Necessary</h2>
      <p>
        These keep you logged in and the app working. They can't be switched off
        as the service won't function without them.
      </p>
      <h2 className="font-display text-lg font-semibold text-ink">Optional</h2>
      <p>
        With your consent, we may use basic analytics to understand how the
        service is used so we can improve it. You can decline these via the
        cookie banner and still use Foliq fully.
      </p>
      <h2 className="font-display text-lg font-semibold text-ink">Managing cookies</h2>
      <p>
        You can change your choice at any time by clearing the site's storage in
        your browser, which will bring the cookie banner back.
      </p>
    </LegalShell>
  );
}
