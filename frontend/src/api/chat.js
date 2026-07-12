import { api } from "./client";
import { getAccessToken } from "./client";

export const listChats = () => api.get("/chat/list");
export const createChat = () => api.post("/chat/create");
export const listMessages = (chatId) => api.get(`/chat/${chatId}/messages`);
export const deleteChat = (chatId) => api.del(`/chat/${chatId}`);

// Streams the answer. Calls onEvent for each parsed SSE event:
//   {type:"chat", chat_id}, {type:"citations", citations},
//   {type:"token", text}, {type:"done"}
export async function askStream({ question, chatId, documentIds, tone, language }, onEvent) {
  const res = await fetch(`${api.base}/chat/ask`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getAccessToken()}`,
    },
    body: JSON.stringify({
      question,
      chat_id: chatId || null,
      document_ids: documentIds || null,
      tone: tone || null,
      language: language || null,
    }),
  });
  if (!res.ok || !res.body) {
    let detail = "Could not get an answer.";
    try { const d = await res.json(); if (d.detail) detail = d.detail; } catch {}
    throw new Error(detail);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n\n");
    buffer = parts.pop(); // keep incomplete tail
    for (const part of parts) {
      const line = part.trim();
      if (!line.startsWith("data:")) continue;
      try { onEvent(JSON.parse(line.slice(5).trim())); } catch {}
    }
  }
}
