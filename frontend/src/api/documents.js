import { api } from "./client";

// Documents in a specific chat
export const listDocuments = (chatId) =>
  api.get(`/documents?chat_id=${encodeURIComponent(chatId)}`);

// The user's whole library (for the pick-from-previous picker)
export const listLibrary = () => api.get("/documents");

export const deleteDocument = (id) => api.del(`/documents/${id}`);

export function uploadDocument(file, chatId) {
  const form = new FormData();
  form.append("file", file);
  form.append("chat_id", chatId);
  return api.upload("/documents", form);
}

// Attach a previously-uploaded document to a chat
export function attachDocument(documentId, chatId) {
  const form = new FormData();
  form.append("chat_id", chatId);
  return api.upload(`/documents/${documentId}/attach`, form);
}
