import { Logo } from "../ui/Logo";
import { DocumentGrid } from "../documents/DocumentGrid";

/* The friendly landing moment inside a fresh chat. Greets the user, then
 * shows one unified grid where they can upload new documents AND/OR select
 * from their previous ones, then continue — all in one action. */
export function WelcomeGreeting({
  name, previousDocs, onStageUpload, onContinue, proceeding,
}) {
  const { greeting, emoji, quip } = timeOfDay();
  const firstName = (name || "there").split("@")[0];

  return (
    <div className="animate-fade-up">
      <div className="flex gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <Logo size={28} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[15px] leading-[1.7] text-ink dark:text-slate-200">
            {greeting}, <span className="font-semibold">{firstName}</span> {emoji}
          </p>
          <p className="text-[15px] leading-[1.7] text-ink dark:text-slate-200 mt-2">
            {quip}
          </p>
          <p className="text-[15px] leading-[1.7] text-ink dark:text-slate-200 mt-2">
            {previousDocs?.length > 0
              ? "Upload new documents, pick from your previous ones, or both — then we'll dive in."
              : "Upload one or more documents to get started and we'll dive right in."}
          </p>

          <DocumentGrid
            previousDocs={previousDocs}
            onStageUpload={onStageUpload}
            onContinue={onContinue}
            proceeding={proceeding}
          />
        </div>
      </div>
    </div>
  );
}

function timeOfDay() {
  const h = new Date().getHours();
  if (h < 5)
    return { greeting: "Still up", emoji: "🌙",
      quip: "Burning the midnight oil? I don't sleep either — let's make it count." };
  if (h < 12)
    return { greeting: "Good morning", emoji: "☀️",
      quip: "Fresh coffee, fresh documents. What are we digging into today?" };
  if (h < 17)
    return { greeting: "Good afternoon", emoji: "🌤️",
      quip: "Perfect time to make a stack of documents actually useful." };
  if (h < 21)
    return { greeting: "Good evening", emoji: "🌆",
      quip: "Winding down or just getting started? Either way, I'm ready." };
  return { greeting: "Good night", emoji: "🌙",
    quip: "One more document before bed? I promise to be quick about it." };
}
