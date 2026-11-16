import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getDocForUser } from "@/lib/docs";
import { canEdit } from "@/lib/access";
import Editor from "@/components/Editor";
import LogoutButton from "@/components/LogoutButton";

export const dynamic = "force-dynamic";

export default async function DocPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const found = await getDocForUser((await params).id, user.id);
  if (!found) notFound();

  return (
    <>
      <header className="topbar">
        <Link href="/" className="brand">Ajaia Docs</Link>
        <div className="who">
          <span>{user.name}</span>
          <LogoutButton />
        </div>
      </header>
      <Editor
        docId={found.doc.id}
        initialTitle={found.doc.title}
        initialHtml={found.doc.contentHtml}
        role={found.role!}
        editable={canEdit(found.role)}
      />
    </>
  );
}
