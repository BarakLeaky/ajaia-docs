import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { documents } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";
import { listDocsForUser } from "@/lib/docs";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  return NextResponse.json(await listDocsForUser(user.id));
}

const Create = z.object({ title: z.string().trim().min(1).max(200).optional() });

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const parsed = Create.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Title must be 1–200 characters." }, { status: 400 });

  const [doc] = await db
    .insert(documents)
    .values({ ownerId: user.id, ...(parsed.data.title ? { title: parsed.data.title } : {}) })
    .returning({ id: documents.id });
  return NextResponse.json(doc, { status: 201 });
}
