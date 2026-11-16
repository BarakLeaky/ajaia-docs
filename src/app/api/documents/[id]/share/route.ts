import { NextResponse } from "next/server";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { documentShares, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";
import { getDocForUser, isUuid } from "@/lib/docs";
import { canManage } from "@/lib/access";

type Ctx = { params: Promise<{ id: string }> };

async function authorize(params: Ctx["params"]) {
  const user = await getCurrentUser();
  if (!user) return { error: NextResponse.json({ error: "Not signed in." }, { status: 401 }) };
  const found = await getDocForUser((await params).id, user.id);
  if (!found) return { error: NextResponse.json({ error: "Document not found." }, { status: 404 }) };
  if (!canManage(found.role)) {
    return { error: NextResponse.json({ error: "Only the owner can manage sharing." }, { status: 403 }) };
  }
  return { user, doc: found.doc };
}

export async function GET(_req: Request, { params }: Ctx) {
  const auth = await authorize(params);
  if ("error" in auth) return auth.error;
  const shares = await db
    .select({ userId: users.id, name: users.name, email: users.email, role: documentShares.role })
    .from(documentShares)
    .innerJoin(users, eq(users.id, documentShares.userId))
    .where(eq(documentShares.documentId, auth.doc.id));
  return NextResponse.json({ shares });
}

const Grant = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  role: z.enum(["viewer", "editor"]),
});

export async function POST(req: Request, { params }: Ctx) {
  const auth = await authorize(params);
  if ("error" in auth) return auth.error;

  const parsed = Grant.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request." }, { status: 400 });
  }
  const [target] = await db.select().from(users).where(eq(users.email, parsed.data.email)).limit(1);
  if (!target) return NextResponse.json({ error: "No user with that email." }, { status: 404 });
  if (target.id === auth.user.id) {
    return NextResponse.json({ error: "You already own this document." }, { status: 400 });
  }

  await db
    .insert(documentShares)
    .values({ documentId: auth.doc.id, userId: target.id, role: parsed.data.role })
    .onConflictDoUpdate({
      target: [documentShares.documentId, documentShares.userId],
      set: { role: parsed.data.role },
    });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request, { params }: Ctx) {
  const auth = await authorize(params);
  if ("error" in auth) return auth.error;
  const userId = new URL(req.url).searchParams.get("userId") ?? "";
  if (!isUuid(userId)) return NextResponse.json({ error: "Invalid user." }, { status: 400 });
  await db
    .delete(documentShares)
    .where(and(eq(documentShares.documentId, auth.doc.id), eq(documentShares.userId, userId)));
  return NextResponse.json({ ok: true });
}
