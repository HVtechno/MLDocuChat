import {
  Handshake, Swords, SearchX, Layers,
  Lightbulb, GraduationCap, NotebookPen, ListChecks,
  FileText, AlertTriangle, GitCompare, Sparkles,
} from "lucide-react";

/* Profession-tailored one-click actions. Each profession gets tools suited
 * to how they actually work with documents. "Other" gets none (clean chat).
 * Each action sends a tuned question through the normal ask flow, so the
 * answer streams and cites like any typed question, and chat continues. */

const RESEARCHER_ACTIONS = [
  { key: "agreements", label: "Find agreements", icon: Handshake,
    question: "Looking across all the documents in this project, where do they agree? Identify the points of consensus and cite which documents support each one." },
  { key: "conflicts", label: "Find conflicts", icon: Swords,
    question: "Looking across all the documents in this project, where do they disagree or contradict each other? Name each point of tension and cite which documents hold which position." },
  { key: "gaps", label: "Spot gaps", icon: SearchX,
    question: "Looking across all the documents in this project, what is missing or unaddressed? Identify gaps the documents themselves point to or leave open, and cite where relevant." },
  { key: "landscape", label: "Summarize the landscape", icon: Layers,
    question: "Give me a synthesised overview of what these documents collectively say. Organise it by theme rather than document by document, note where sources align or differ, and cite throughout." },
];

const STUDENT_ACTIONS = [
  { key: "explain", label: "Explain simply", icon: Lightbulb,
    question: "Explain the key ideas in these documents in simple, clear terms, as if teaching someone new to the topic. Use plain language and cite where each idea comes from." },
  { key: "concepts", label: "Key concepts", icon: Sparkles,
    question: "List and briefly define the key concepts and terms across these documents, so I can study them. Cite where each concept appears." },
  { key: "quiz", label: "Quiz me", icon: GraduationCap,
    question: "Create a short set of quiz questions (with answers) based on the content of these documents, to help me test my understanding. Cite the source for each answer." },
  { key: "notes", label: "Make study notes", icon: NotebookPen,
    question: "Turn the content of these documents into clear, organised study notes with headings and bullet points, so I can revise efficiently. Cite sources throughout." },
];

const PROFESSIONAL_ACTIONS = [
  { key: "summary", label: "Summarize key points", icon: FileText,
    question: "Summarise the key points across these documents concisely, organised for quick reading. Cite where each point comes from." },
  { key: "actions", label: "Extract action items", icon: ListChecks,
    question: "Extract any action items, obligations, deadlines, or required next steps mentioned across these documents, as a clear list. Cite the source for each." },
  { key: "risks", label: "Find red flags", icon: AlertTriangle,
    question: "Identify anything across these documents that looks like a risk, red flag, unusual term, or point needing attention. Cite where each appears. Note: this is not professional advice." },
  { key: "compare", label: "Compare documents", icon: GitCompare,
    question: "Compare these documents against each other. Highlight where they differ, overlap, or are inconsistent, and cite the specifics." },
];

export const ACTION_SETS = {
  researcher: { label: "Analyze across", actions: RESEARCHER_ACTIONS },
  student: { label: "Study across", actions: STUDENT_ACTIONS },
  professional: { label: "Work across", actions: PROFESSIONAL_ACTIONS },
};

export function SynthesisActions({ profession, onRun, disabled }) {
  const set = ACTION_SETS[profession];
  if (!set) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {set.actions.map((a) => {
        const Icon = a.icon;
        return (
          <button
            key={a.key}
            onClick={() => onRun(a.question)}
            disabled={disabled}
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 dark:border-slate-700
              bg-white dark:bg-surface-dark-raised px-3 py-1.5 text-sm text-slate-600 dark:text-slate-300
              hover:border-iris hover:text-iris hover:bg-iris-wash dark:hover:bg-iris/10 transition-colors
              disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Icon className="w-3.5 h-3.5" />
            {a.label}
          </button>
        );
      })}
    </div>
  );
}
