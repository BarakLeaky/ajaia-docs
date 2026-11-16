"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function NewDocActions() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function createDoc() {
    setBusy(true);
    setError("");
    const res = await fetch("/api/documents", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { setError(data.error ?? "Could not create the document."); setBusy(false); return; }
    router.push(`/docs/${data.id}`);
  }

  async function importFile(file: File) {
    setBusy(true);
    setError("");
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/import", { method: "POST", body: form });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { setError(data.error ?? "Import failed."); setBusy(false); return; }
    router.push(`/docs/${data.id}`);
  }

  return (
    <>
      <div className="actions">
        <button className="primary" disabled={busy} onClick={createDoc}>New document</button>
        <button disabled={busy} onClick={() => fileRef.current?.click()}>Import file</button>
        <span className="hint">Import supports .txt, .md and .docx up to 2 MB.</span>
        <input
          ref={fileRef}
          type="file"
          accept=".txt,.md,.docx"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (f) importFile(f);
          }}
        />
      </div>
      {error && <p className="error" role="alert">{error}</p>}
    </>
  );
}
