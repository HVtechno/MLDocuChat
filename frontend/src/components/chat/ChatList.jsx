import { MessageSquare, Trash2 } from "lucide-react";

export function ChatList({ chats, activeChatId, onSelect, onDelete }) {
  return (
    <div className="px-3 py-3">
      <h2 className="font-display text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-2 px-1">
        Projects
      </h2>

      {chats.length === 0 ? (
        <p className="text-sm text-slate-400 dark:text-slate-500 px-1 py-2 leading-relaxed">
          Your research projects will appear here. Each one keeps its own library of papers.
        </p>
      ) : (
        <div className="space-y-0.5">
          {chats.map((chat) => (
            <div
              key={chat.id}
              className={`group flex items-center gap-2 rounded-lg px-2.5 py-2 cursor-pointer transition-colors
                ${activeChatId === chat.id
                  ? "bg-iris-wash dark:bg-iris/20"
                  : "hover:bg-slate-100 dark:hover:bg-slate-800"}`}
              onClick={() => onSelect(chat.id)}
            >
              <MessageSquare
                className={`w-4 h-4 flex-shrink-0 ${activeChatId === chat.id ? "text-iris" : "text-slate-400"}`}
              />
              <span className={`flex-1 min-w-0 text-sm truncate ${activeChatId === chat.id
                ? "text-ink dark:text-slate-100 font-medium"
                : "text-slate-600 dark:text-slate-300"}`}>
                {chat.title}
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(chat.id); }}
                className="text-slate-400 hover:text-red-600 lg:opacity-0 lg:group-hover:opacity-100 transition-all p-0.5"
                aria-label="Delete project"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
