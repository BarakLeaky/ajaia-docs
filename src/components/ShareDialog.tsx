"use client";
import { useCallback, useEffect, useState } from "react";

type Share = { userId: string; name: string; email: string; role: "viewer" | "editor" };

export default function ShareDialog({ docId, onClose }: { docId: string; onClose: () => void }) {
  const [shares, setShares] = useState<Share[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"viewer" | "editor">("editor");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/documents/${docId}/share`);
    if (res.ok) setShares((await res.json()).shares);
  }, [docId]);

  useEffect(() => { load(); }, [load]);

  async function grant() {
    setBusy(true);
    setError("");
    const res = await fetch(`/api/documents/${docId}/share`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, role }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setError(data.error ?? "Could not share."); return; }
    setEmail("");
    load();
  }

  async function revoke(userId: string) {
    await fetch(`/api/documents/${docId}/share?userId=${userId}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div className="dialog" role="dialog" aria-modal="true" aria-label="Share document" onClick={(e) => e.stopPropagation()}>
        <h2>Share this document</h2>
        <div className="row">
          <input type="email" placeholder="bob@ajaia.test" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Email address" />
          <select value={role} onChange={(e) => setRole(e.target.value as "viewer" | "editor")} aria-label="Permission">
            <option value="editor">Can edit</option>
            <option value="viewer">View only</option>
          </select>
          <button className="primary" disabled={busy || !email} onClick={grant}>Share</button>
        </div>
        {error && <p className="error" role="alert">{error}</p>}
        <ul className="sharelist">
          {shares.length === 0 && <li className="hint">Not shared with anyone yet.</li>}
          {shares.map((s) => (
            <li key={s.userId}>
              <span>{s.name} <span className="hint">{s.email} · {s.role === "editor" ? "Can edit" : "View only"}</span></span>
              <button className="link danger" onClick={() => revoke(s.userId)}>Remove</button>
            </li>
          ))}
        </ul>
        <p style={{ textAlign: "right", marginBottom: 0 }}><button onClick={onClose}>Done</button></p>
      </div>
    </div>
  );
}
