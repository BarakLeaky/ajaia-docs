import { redirect } from "next/navigation";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";
import LoginPicker from "@/components/LoginPicker";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/");
  const all = await db.select().from(users).orderBy(asc(users.name));
  return (
    <main className="page">
      <h1>Sign in to Ajaia Docs</h1>
      <p className="sub">Choose your account to continue.</p>
      <LoginPicker users={all.map((u) => ({ id: u.id, name: u.name, email: u.email }))} />
    </main>
  );
}
