import ReactMarkdown from "react-markdown";
import { CitationChip } from "./CitationChip";
import { Logo } from "../ui/Logo";

/* Renders one message. For assistant messages, inline [n] markers are
 * rendered as interactive CitationChips WITHOUT breaking the surrounding
 * markdown (lists, paragraphs, bold) — we convert [n] into a placeholder
 * token that a custom renderer swaps for a chip, so the full markdown
 * structure is parsed as one piece. */
export function Message({ role, content, citations = [], streaming = false }) {
  const isUser = role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end animate-fade-up">
        <div className="max-w-[80%] rounded-2xl rounded-tr-md bg-iris text-white px-4 py-2.5 text-[15px] leading-relaxed shadow-soft">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 animate-fade-up">
      <div className="flex-shrink-0 mt-0.5">
        <Logo size={28} />
      </div>
      <div className="flex-1 min-w-0 prose-answer">
        <CitedMarkdown text={content} citations={citations} />
        {streaming && (
          <span className="inline-block w-[7px] h-[15px] bg-iris ml-0.5 animate-blink align-text-bottom rounded-sm" />
        )}
      </div>
    </div>
  );
}

/* Renders the WHOLE answer as markdown in one pass (so lists, numbering,
 * paragraphs, and bold all render correctly), then replaces [n] citation
 * markers with chips inside the rendered text nodes. */
function CitedMarkdown({ text, citations }) {
  const byNumber = Object.fromEntries((citations || []).map((c) => [String(c.n), c]));

  // Walk rendered children and replace [n] tokens in text nodes with chips.
  const renderWithChips = (children) => {
    return childrenToArray(children).map((child, i) => {
      if (typeof child !== "string") return child;
      const parts = child.split(/(\[\d+\])/g);
      if (parts.length === 1) return child;
      return parts.map((part, j) => {
        const m = part.match(/^\[(\d+)\]$/);
        if (m && byNumber[m[1]]) {
          return <CitationChip key={`${i}-${j}`} citation={byNumber[m[1]]} />;
        }
        if (m) return null; // marker with no matching citation
        return part;
      });
    });
  };

  return (
    <ReactMarkdown
      components={{
        p: ({ children }) => <p>{renderWithChips(children)}</p>,
        li: ({ children }) => <li>{renderWithChips(children)}</li>,
        strong: ({ children }) => <strong>{renderWithChips(children)}</strong>,
        em: ({ children }) => <em>{renderWithChips(children)}</em>,
      }}
    >
      {text}
    </ReactMarkdown>
  );
}

function childrenToArray(children) {
  return Array.isArray(children) ? children : [children];
}
