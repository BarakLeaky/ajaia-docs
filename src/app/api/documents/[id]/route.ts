import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { documents } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";
import { getDocForUser } from "@/lib/docs";
import { canEdit, canManage } from "@/lib/access";
import { cleanHtml } from "@/lib/sanitize";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const found = await getDocForUser((await params).id, user.id);
  if (!found) return NextResponse.json({ error: "Document not found." }, { status: 404 });
  return NextResponse.json({ ...found.doc, role: found.role });
}

const Patch = z.object({
  title: z.string().trim().min(1, "Title can't be empty.").max(200).optional(),
  contentHtml: z.string().max(1_000_000, "Document is too large.").optional(),
});

export async function PATCH(req: Request, { params }: Ctx) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const found = await getDocForUser((await params).id, user.id);
  if (!found) return NextResponse.json({ error: "Document not found." }, { status: 404 });
  if (!canEdit(found.role)) return NextResponse.json({ error: "You have view-only access." }, { status: 403 });

  const parsed = Patch.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request." }, { status: 400 });
  }
  const { title, contentHtml } = parsed.data;
  await db
    .update(documents)
    .set({
      ...(title !== undefined ? { title } : {}),
      ...(contentHtml !== undefined ? { contentHtml: cleanHtml(contentHtml) } : {}),
      updatedAt: new Date(),
    })
    .where(eq(documents.id, found.doc.id));
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const found = await getDocForUser((await params).id, user.id);
  if (!found) return NextResponse.json({ error: "Document not found." }, { status: 404 });
  if (!canManage(found.role)) return NextResponse.json({ error: "Only the owner can delete." }, { status: 403 });
  await db.delete(documents).where(eq(documents.id, found.doc.id));
  return NextResponse.json({ ok: true });
}
