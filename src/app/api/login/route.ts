import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { SESSION_COOKIE, sign } from "@/lib/session";

const Body = z.object({ userId: z.string().uuid() });

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const [user] = await db.select().from(users).where(eq(users.id, parsed.data.userId)).limit(1);
  if (!user) return NextResponse.json({ error: "User not found." }, { status: 404 });

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, sign(user.id), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
