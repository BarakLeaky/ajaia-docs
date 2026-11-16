import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";

export const SESSION_COOKIE = "ajaia_session";

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16) throw new Error("SESSION_SECRET must be set (16+ characters).");
  return s;
}

const mac = (value: string) => createHmac("sha256", secret()).update(value).digest("hex");

export const sign = (userId: string) => `${userId}.${mac(userId)}`;

export function verify(token: string | undefined): string | null {
  if (!token) return null;
  const i = token.lastIndexOf(".");
  if (i < 1) return null;
  const id = token.slice(0, i);
  const a = Buffer.from(token.slice(i + 1));
  const b = Buffer.from(mac(id));
  return a.length === b.length && timingSafeEqual(a, b) ? id : null;
}

/** Mock auth: a signed cookie holding a seeded user's id. Not production auth. */
export async function getCurrentUser() {
  const jar = await cookies();
  const id = verify(jar.get(SESSION_COOKIE)?.value);
  if (!id) return null;
  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return user ?? null;
}
