import { api, getAccessToken } from "./client";

export const deleteAllChats = () => api.del("/account/chats");
export const deleteAccountData = () => api.del("/account/data");

export const deleteDocumentsBatch = (documentIds) =>
  api.post("/documents/delete-batch", { document_ids: documentIds });

// Export downloads a JSON file directly.
export async function exportData() {
  const res = await fetch(`${api.base}/account/export`, {
    headers: { Authorization: `Bearer ${getAccessToken()}` },
  });
  if (!res.ok) throw new Error("Export failed.");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "foliq-export.json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
