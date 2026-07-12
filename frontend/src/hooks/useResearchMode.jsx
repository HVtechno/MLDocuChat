import { useAuth } from "./useAuth";

/* Each profession (except "other") gets a tailored action bar. "Other" is
 * the clean generic chat with no action buttons. The action SET differs by
 * profession — see SynthesisActions. */
const ACTION_PROFESSIONS = new Set(["researcher", "student", "professional"]);

export function useResearchMode() {
  const { user } = useAuth();
  const profession = user?.profession || null;
  return {
    profession,
    // Does this profession get an action bar at all?
    hasActions: profession ? ACTION_PROFESSIONS.has(profession) : false,
    hasChosenProfession: !!profession,
  };
}

export const PROFESSIONS = [
  { value: "researcher", label: "Researcher", hint: "PhD, academic, or research work" },
  { value: "student", label: "Student", hint: "Studying, writing a thesis or reviews" },
  { value: "professional", label: "Professional", hint: "Work documents, reports, contracts" },
  { value: "other", label: "Something else", hint: "Just here to chat with documents" },
];
