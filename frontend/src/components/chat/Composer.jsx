import { useRef, useEffect } from "react";
import { ArrowUp, Sparkle, Languages, Paperclip, Loader2 } from "lucide-react";

const TONES = [
  { value: "casual", label: "Casual" },
  { value: "professional", label: "Professional" },
  { value: "humorous", label: "Humorous" },
];

// A small, practical set of languages. "auto" = English / match the document.
const LANGUAGES = [
  { value: "", label: "English" },
  { value: "Hindi", label: "हिन्दी" },
  { value: "Tamil", label: "தமிழ்" },
  { value: "Telugu", label: "తెలుగు" },
  { value: "Kannada", label: "ಕನ್ನಡ" },
  { value: "Malayalam", label: "മലയാളം" },
  { value: "Marathi", label: "मराठी" },
  { value: "Bengali", label: "বাংলা" },
  { value: "Gujarati", label: "ગુજરાતી" },
  { value: "Spanish", label: "Español" },
  { value: "French", label: "Français" },
  { value: "German", label: "Deutsch" },
  { value: "Arabic", label: "العربية" },
];

export function Composer({
  value, onChange, onSend, disabled, placeholder,
  tone, onToneChange, language, onLanguageChange,
  onUpload, uploading,
}) {
  const ref = useRef();
  const fileRef = useRef();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  }, [value]);

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && value.trim()) onSend();
    }
  };

  return (
    <div className="border-t border-slate-200 dark:border-slate-800 bg-parchment/80 dark:bg-surface-dark/80 backdrop-blur px-4 py-3">
      <div className="max-w-3xl mx-auto">
        {/* tone + language controls */}
        <div className="flex items-center gap-2 mb-2 px-1">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Sparkle className="w-3.5 h-3.5" />
            <select
              value={tone}
              onChange={(e) => onToneChange(e.target.value)}
              className="text-xs bg-transparent text-slate-500 dark:text-slate-400 border-0 focus:outline-none focus:ring-0 cursor-pointer hover:text-ink dark:hover:text-slate-200"
            >
              {TONES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <span className="text-slate-300 dark:text-slate-600">·</span>
          <div className="flex items-center gap-1.5 text-slate-400">
            <Languages className="w-3.5 h-3.5" />
            <select
              value={language}
              onChange={(e) => onLanguageChange(e.target.value)}
              className="text-xs bg-transparent text-slate-500 dark:text-slate-400 border-0 focus:outline-none focus:ring-0 cursor-pointer hover:text-ink dark:hover:text-slate-200"
            >
              {LANGUAGES.map((l) => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-end gap-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-surface-dark-raised p-2 shadow-soft focus-within:border-iris focus-within:ring-2 focus-within:ring-iris/15 transition-all">
          {/* attach / upload a document */}
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex-shrink-0 w-9 h-9 rounded-xl text-slate-400 hover:text-iris hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors disabled:opacity-50"
            aria-label="Attach a document"
            title="Attach a document"
          >
            {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Paperclip className="w-5 h-5" />}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.docx,.txt,.md,.pptx,.xlsx,.csv"
            className="hidden"
            onChange={(e) => { onUpload?.(e.target.files); e.target.value = ""; }}
          />
          <textarea
            ref={ref}
            rows={1}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKey}
            placeholder={placeholder || "Ask anything about your documents…"}
            className="flex-1 resize-none bg-transparent px-2 py-1.5 text-[15px] text-ink dark:text-slate-100
              placeholder:text-slate-400 focus:outline-none max-h-[200px]"
          />
          <button
            onClick={onSend}
            disabled={disabled || !value.trim()}
            className="flex-shrink-0 w-9 h-9 rounded-xl bg-iris text-white flex items-center justify-center
              hover:bg-iris-deep disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Send message"
          >
            <ArrowUp className="w-5 h-5" />
          </button>
        </div>
        <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-2">
          Answers cite the exact page they came from.
        </p>
      </div>
    </div>
  );
}
