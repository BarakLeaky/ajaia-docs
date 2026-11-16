import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { documents, documentShares, users } from "@/db/schema";
import { canView, resolveRole } from "./access";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (s: string) => UUID.test(s);

/** Returns the document and the caller's role, or null if missing OR not permitted (no existence leak). */
export async function getDocForUser(docId: string, userId: string) {
  if (!isUuid(docId)) return null;
  const [row] = await db
    .select({ doc: documents, shareRole: documentShares.role })
    .from(documents)
    .leftJoin(
      documentShares,
      and(eq(documentShares.documentId, documents.id), eq(documentShares.userId, userId))
    )
    .where(eq(documents.id, docId))
    .limit(1);
  if (!row) return null;
  const role = resolveRole(row.doc.ownerId, userId, row.shareRole);
  return canView(role) ? { doc: row.doc, role } : null;
}

export async function listDocsForUser(userId: string) {
  const owned = await db
    .select({ id: documents.id, title: documents.title, updatedAt: documents.updatedAt })
    .from(documents)
    .where(eq(documents.ownerId, userId))
    .orderBy(desc(documents.updatedAt));

  const shared = await db
    .select({
      id: documents.id,
      title: documents.title,
      updatedAt: documents.updatedAt,
      role: documentShares.role,
      ownerName: users.name,
    })
    .from(documentShares)
    .innerJoin(documents, eq(documents.id, documentShares.documentId))
    .innerJoin(users, eq(users.id, documents.ownerId))
    .where(eq(documentShares.userId, userId))
    .orderBy(desc(documents.updatedAt));

  return { owned, shared };
}
