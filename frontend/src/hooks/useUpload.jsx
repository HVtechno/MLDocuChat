import { useState, useCallback } from "react";
import { uploadDocument } from "../api/documents";

const OK_EXT = [".pdf", ".docx", ".txt", ".md", ".pptx", ".xlsx", ".csv"];

/* Shared document-upload logic. Both the welcome greeting and the composer
 * paperclip use this so upload behaviour lives in one place.
 *
 * ensureChatId: async () => chatId  (creates a chat if needed)
 * onUploaded:  async () => void     (refresh docs/library after upload)
 */
export function useUpload({ ensureChatId, onUploaded }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const validate = (file) => {
    const lower = file.name.toLowerCase();
    if (!OK_EXT.some((e) => lower.endsWith(e))) {
      return "Supported: PDF, Word, PowerPoint, Excel, CSV, text, markdown.";
    }
    return null;
  };

  const upload = useCallback(async (files) => {
    const list = Array.from(files || []);
    if (list.length === 0) return false;

    // validate all first
    for (const f of list) {
      const v = validate(f);
      if (v) { setError(`${f.name}: ${v}`); return false; }
    }
    setError(null);
    setUploading(true);
    try {
      const chatId = await ensureChatId();
      // upload sequentially so each attaches reliably to the same chat
      for (const f of list) {
        await uploadDocument(f, chatId);
      }
      await onUploaded?.();
      return true;
    } catch (e) {
      setError(e.message);
      return false;
    } finally {
      setUploading(false);
    }
  }, [ensureChatId, onUploaded]);

  return { upload, uploading, error, setError };
}
