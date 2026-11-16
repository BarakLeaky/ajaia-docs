"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type U = { id: string; name: string; email: string };

export default function LoginPicker({ users }: { users: U[] }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  async function login(id: string) {
    setBusy(id);
    setError("");
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: id }),
    });
    if (!res.ok) {
      setError((await res.json().catch(() => ({}))).error ?? "Sign-in failed.");
      setBusy(null);
      return;
    }
    router.push("/");
    router.refresh();
  }

  if (users.length === 0) {
    return <p className="empty">No users found. Run <code>npm run db:seed</code> and reload.</p>;
  }
  return (
    <>
      <div className="userlist">
        {users.map((u) => (
          <button key={u.id} disabled={busy !== null} onClick={() => login(u.id)}>
            {u.name}
            <small>{u.email}</small>
          </button>
        ))}
      </div>
      {error && <p className="error" role="alert">{error}</p>}
    </>
  );
}
