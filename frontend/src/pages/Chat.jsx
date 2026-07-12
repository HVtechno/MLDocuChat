import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { DocumentPanel } from "../components/documents/DocumentPanel";
import { DocumentPicker } from "../components/documents/DocumentPicker";
import { ChatList } from "../components/chat/ChatList";
import { Message } from "../components/chat/Message";
import { Composer } from "../components/chat/Composer";
import { listDocuments, attachDocument, listLibrary, uploadDocument } from "../api/documents";
import { listChats, listMessages, deleteChat, askStream, createChat } from "../api/chat";
import { WelcomeGreeting } from "../components/chat/WelcomeGreeting";
import { SettingsModal } from "../components/layout/SettingsModal";
import { SynthesisActions, ACTION_SETS } from "../components/chat/SynthesisActions";
import { ProfessionPrompt } from "../components/onboarding/ProfessionPrompt";
import { useAuth } from "../hooks/useAuth";
import { useResearchMode } from "../hooks/useResearchMode";
import { useUpload } from "../hooks/useUpload";

export function Chat() {
  const { user } = useAuth();
  const { hasActions, hasChosenProfession, profession } = useResearchMode();
  const { chatId: urlChatId } = useParams();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);   // documents in THIS chat
  const [library, setLibrary] = useState([]);       // all user's docs (for greeting picker)
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(urlChatId || null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [pickerDocs, setPickerDocs] = useState([]); // "use a previous doc" options
  const [pendingQuestion, setPendingQuestion] = useState(null); // re-run after attach
  const [attaching, setAttaching] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [tone, setTone] = useState(() => localStorage.getItem("foliq_tone") || "casual");
  const [language, setLanguage] = useState(() => localStorage.getItem("foliq_language") || "");

  const changeTone = (t) => { setTone(t); localStorage.setItem("foliq_tone", t); };
  const changeLanguage = (l) => { setLanguage(l); localStorage.setItem("foliq_language", l); };
  const scrollRef = useRef();

  // Documents are scoped to the active chat. A fresh chat (no id) has none.
  const refreshDocuments = useCallback(async () => {
    if (!activeChatId) { setDocuments([]); return; }
    try { setDocuments(await listDocuments(activeChatId)); } catch {}
  }, [activeChatId]);

  const refreshChats = useCallback(async () => {
    try { setChats(await listChats()); } catch {}
  }, []);

  // The user's whole document library, de-duped by filename, for the
  // welcome greeting's "pick a previous document" picker.
  const refreshLibrary = useCallback(async () => {
    try {
      const all = await listLibrary();
      const seen = new Set();
      const deduped = [];
      for (const d of all) {
        if (d.status !== "ready" || seen.has(d.filename)) continue;
        seen.add(d.filename);
        deduped.push(d);
      }
      setLibrary(deduped);
    } catch {}
  }, []);

  useEffect(() => { refreshChats(); refreshLibrary(); }, [refreshChats, refreshLibrary]);
  useEffect(() => { refreshDocuments(); }, [refreshDocuments]);

  // Load the chat named in the URL so refresh / shared links land right.
  useEffect(() => {
    if (urlChatId && urlChatId !== activeChatId) {
      setActiveChatId(urlChatId);
      listMessages(urlChatId).then(setMessages).catch(() => setMessages([]));
      setPickerDocs([]);
    }
    if (!urlChatId) {
      setActiveChatId(null);
      setMessages([]);
      setPickerDocs([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlChatId]);

  // Poll while any document is still processing.
  useEffect(() => {
    if (!documents.some((d) => d.status === "processing")) return;
    const t = setInterval(refreshDocuments, 2500);
    return () => clearInterval(t);
  }, [documents, refreshDocuments]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, pickerDocs]);

  // Ensure a chat exists (used before uploading in a fresh chat). Returns
  // the chat id, creating and navigating to a new chat if needed.
  const ensureChatId = useCallback(async () => {
    if (activeChatId) return activeChatId;
    const chat = await createChat();
    setActiveChatId(chat.id);
    window.history.replaceState(null, "", `/chat/${chat.id}`);
    refreshChats();
    return chat.id;
  }, [activeChatId, refreshChats]);

  const openChat = (chatId) => navigate(`/chat/${chatId}`);

  // "New project" — always return to a clean, fresh project, even if we're
  // already on /chat. Reset state directly so it works from anywhere.
  const newChat = () => {
    setActiveChatId(null);
    setMessages([]);
    setPickerDocs([]);
    setInput("");
    if (window.location.pathname !== "/chat") {
      navigate("/chat");
    } else {
      window.history.replaceState(null, "", "/chat");
    }
    refreshLibrary();
  };

  // Shared upload: used by the greeting and the composer paperclip.
  const { upload, uploading, error: uploadError } = useUpload({
    ensureChatId,
    onUploaded: async () => {
      await refreshDocuments();
      await refreshLibrary();
      // If this was the first document in a fresh chat, replace the greeting
      // with a short ready message so the conversation can begin.
      setMessages((m) => (m.length === 0
        ? [{
            id: "ready-" + Date.now(), role: "assistant",
            content: "Got it — your document is ready. Ask me anything about it.",
            citations: [],
          }]
        : m));
    },
  });

  const removeChat = async (chatId) => {
    await deleteChat(chatId);
    if (chatId === activeChatId) navigate("/chat");
    refreshChats();
  };

  // --- Welcome-grid flow: stage uploads, then continue with everything ---

  // Upload files to this chat and RETURN the created document rows (so the
  // grid can stage them). Does NOT show the ready message — the user may
  // still want to pick previous documents before continuing.
  const stageUpload = async (files) => {
    const chatId = await ensureChatId();
    const created = [];
    for (const f of files) {
      const res = await uploadDocument(f, chatId);
      if (res?.document) created.push(res.document);
    }
    await refreshDocuments();
    await refreshLibrary();
    return created;
  };

  // Refresh documents a few times over the next several seconds, to catch
  // the processing→ready transition so the action bar appears promptly
  // (embedding takes a moment after upload/attach).
  const pollUntilReady = useCallback(async (chatId, tries = 6) => {
    if (!chatId) return;
    for (let i = 0; i < tries; i++) {
      await new Promise((r) => setTimeout(r, 1500));
      try {
        const docs = await listDocuments(chatId);
        setDocuments(docs);
        if (docs.length > 0 && docs.every((d) => d.status === "ready")) break;
      } catch { /* keep trying */ }
    }
  }, []);

  // Proceed with everything: uploaded docs are already attached to this
  // chat; attach the selected previous ones too, then show the ready
  // message so the conversation can begin in this session.
  const continueWithDocuments = async (prevIds) => {
    setAttaching(true);
    try {
      const chatId = await ensureChatId();
      for (const id of prevIds) {
        await attachDocument(id, chatId);
      }
      await refreshDocuments();
      await refreshLibrary();
      setMessages([{
        id: "ready-" + Date.now(),
        role: "assistant",
        content: "Ready! Your documents are attached. Ask me anything about them, or use the quick actions below.",
        citations: [],
      }]);
      pollUntilReady(chatId);  // keep refreshing so the action bar appears
    } catch (e) {
      setMessages((m) => [...m, {
        id: "e-" + Date.now(), role: "assistant", content: `⚠️ ${e.message}`,
      }]);
    } finally {
      setAttaching(false);
    }
  };

  // Attach the selected previous documents to this chat, then automatically
  // answer the question the user originally asked.
  const confirmDocuments = async (docIds) => {
    if (!docIds.length) return;
    setAttaching(true);
    try {
      const chatId = await ensureChatId();
      // attach all selected docs (sequentially keeps it simple/reliable)
      for (const id of docIds) {
        await attachDocument(id, chatId);
      }
      setPickerDocs([]);
      await refreshDocuments();
      await refreshLibrary();

      const q = pendingQuestion;
      setPendingQuestion(null);
      if (q) {
        // Came from a "no documents" answer to a real question — answer it now.
        await runQuestion(q);
      } else {
        // Came from the welcome greeting — just confirm we're ready, and
        // replace the greeting with a short ready message. No auto-question,
        // so no timing races and no title pollution.
        setMessages([{
          id: "ready-" + Date.now(),
          role: "assistant",
          content: "Ready! Your document(s) are attached. Ask me anything about them.",
          citations: [],
        }]);
      }
    } catch (e) {
      setMessages((m) => [...m, {
        id: "e-" + Date.now(), role: "assistant", content: `⚠️ ${e.message}`,
      }]);
    } finally {
      setAttaching(false);
    }
  };

  const send = async () => {
    const question = input.trim();
    if (!question || busy) return;
    setInput("");
    await runQuestion(question);
  };

  // Core ask flow, reusable by the composer and the post-attach auto-run.
  const runQuestion = async (question, { hideUserMessage = false } = {}) => {
    if (busy) return;
    setBusy(true);
    setPickerDocs([]);

    setMessages((m) => [
      ...m,
      ...(hideUserMessage
        ? []
        : [{ id: "u-" + Date.now(), role: "user", content: question }]),
      { id: "a-" + Date.now(), role: "assistant", content: "", citations: [], streaming: true },
    ]);

    try {
      let chatId = activeChatId;
      let noDocs = false;
      let offered = [];
      await askStream({ question, chatId, documentIds: null, tone, language }, (evt) => {
        if (evt.type === "chat") {
          chatId = evt.chat_id;
          if (!activeChatId) {
            setActiveChatId(evt.chat_id);
            window.history.replaceState(null, "", `/chat/${evt.chat_id}`);
          }
        } else if (evt.type === "no_documents") {
          noDocs = true;
          offered = evt.documents || [];
        } else if (evt.type === "citations") {
          setMessages((m) => patchLast(m, { citations: evt.citations }));
        } else if (evt.type === "token") {
          setMessages((m) => patchLast(m, (prev) => ({ content: prev.content + evt.text })));
        } else if (evt.type === "done") {
          setMessages((m) => patchLast(m, { streaming: false, _noDocs: noDocs }));
        }
      });
      if (noDocs) {
        setPickerDocs(offered);
        setPendingQuestion(question);   // remember it to auto-answer after attach
      }
      await refreshChats();
      await refreshDocuments();
    } catch (e) {
      setMessages((m) => patchLast(m, { content: `⚠️ ${e.message}`, streaming: false }));
    } finally {
      setBusy(false);
    }
  };

  const hasReadyDoc = documents.some((d) => d.status === "ready");
  const readyDocCount = documents.filter((d) => d.status === "ready").length;
  // Action bar appears for professions that have one (not "other"), and only
  // with 2+ papers (actions work across a collection).
  const showActions = hasActions && readyDocCount >= 2;

  // First-run: ask the user's profession once before showing the app.
  if (user && !hasChosenProfession) {
    return <ProfessionPrompt />;
  }

  return (
    <AppShell
      onNewChat={newChat}
      onManageDocuments={() => setSettingsOpen(true)}
      sidebar={
        <div className="flex flex-col h-full min-h-0">
          {/* Chats — takes the upper portion, scrolls on its own */}
          <div className="flex-1 overflow-y-auto min-h-0 basis-1/2">
            <ChatList
              chats={chats}
              activeChatId={activeChatId}
              onSelect={openChat}
              onDelete={removeChat}
            />
          </div>
          {/* Documents — display only, equal flexible space with its own scroll */}
          <div className="flex-1 min-h-0 basis-1/2 border-t border-slate-100 dark:border-slate-800 flex flex-col">
            <DocumentPanel
              documents={documents}
              onChange={refreshDocuments}
            />
          </div>
        </div>
      }
    >
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6">
          {messages.length === 0 ? (
            <WelcomeGreeting
              name={user?.nickname || user?.email}
              previousDocs={library.filter(
                (d) => !documents.some((cur) => cur.filename === d.filename)
              )}
              onStageUpload={stageUpload}
              onContinue={continueWithDocuments}
              proceeding={attaching}
            />
          ) : (
            <div className="space-y-5">
              {messages.map((m) => (
                <Message key={m.id} {...m} />
              ))}
              {pickerDocs.length > 0 && (
                <div className="pl-10">
                  <DocumentPicker
                    documents={pickerDocs}
                    onConfirm={confirmDocuments}
                    busy={attaching}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Profession-tailored one-click actions across the collection */}
      {showActions && (
        <div className="border-t border-slate-100 dark:border-slate-800 bg-parchment/60 dark:bg-surface-dark/60 px-4 py-2.5">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                {(ACTION_SETS[profession]?.label || "Across")} {readyDocCount} documents
              </span>
            </div>
            <SynthesisActions profession={profession} onRun={(q) => runQuestion(q)} disabled={busy} />
          </div>
        </div>
      )}
      <Composer
        value={input}
        onChange={setInput}
        onSend={send}
        disabled={busy}
        placeholder={hasReadyDoc ? undefined : "Ask a question, or attach a document to begin…"}
        tone={tone}
        onToneChange={changeTone}
        language={language}
        onLanguageChange={changeLanguage}
        onUpload={upload}
        uploading={uploading}
      />
      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onChanged={() => { refreshChats(); refreshDocuments(); refreshLibrary(); }}
      />
    </AppShell>
  );
}

function patchLast(list, patch) {
  if (!list.length) return list;
  const copy = [...list];
  const last = copy[copy.length - 1];
  const delta = typeof patch === "function" ? patch(last) : patch;
  copy[copy.length - 1] = { ...last, ...delta };
  return copy;
}

