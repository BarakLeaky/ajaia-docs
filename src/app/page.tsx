import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { listDocsForUser } from "@/lib/docs";
import NewDocActions from "@/components/NewDocActions";
import LogoutButton from "@/components/LogoutButton";

export const dynamic = "force-dynamic";

const fmt = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

export default async function Dashboard() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { owned, shared } = await listDocsForUser(user.id);

  return (
    <>
      <header className="topbar">
        <Link href="/" className="brand">Ajaia Docs</Link>
        <div className="who">
          <span>{user.name}</span>
          <LogoutButton />
        </div>
      </header>
      <main className="page">
        <h1>Documents</h1>
        <p className="sub">Create, import, edit and share documents with your team.</p>
        <NewDocActions />

        <h2>My documents</h2>
        {owned.length === 0 ? (
          <p className="empty">You haven&rsquo;t created any documents yet. Start with New document or import a file.</p>
        ) : (
          <ul className="doclist">
            {owned.map((d) => (
              <li key={d.id}>
                <Link href={`/docs/${d.id}`}>
                  <span>{d.title}</span>
                  <span className="meta"><span className="badge">Owner</span>{fmt(d.updatedAt)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}

        <h2>Shared with me</h2>
        {shared.length === 0 ? (
          <p className="empty">Nothing has been shared with you yet.</p>
        ) : (
          <ul className="doclist">
            {shared.map((d) => (
              <li key={d.id}>
                <Link href={`/docs/${d.id}`}>
                  <span>{d.title}</span>
                  <span className="meta">
                    <span className="badge shared">{d.role === "editor" ? "Can edit" : "View only"}</span>
                    from {d.ownerName} · {fmt(d.updatedAt)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
