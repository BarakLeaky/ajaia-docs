import { NextResponse } from "next/server";
import { db } from "@/db";
import { documents } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";
import { fileToHtml, ImportError, titleFromFilename } from "@/lib/importer";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Choose a file to import." }, { status: 400 });

  try {
    const html = await fileToHtml(file.name, Buffer.from(await file.arrayBuffer()));
    const [doc] = await db
      .insert(documents)
      .values({ ownerId: user.id, title: titleFromFilename(file.name), contentHtml: html })
      .returning({ id: documents.id });
    return NextResponse.json(doc, { status: 201 });
  } catch (e) {
    if (e instanceof ImportError) return NextResponse.json({ error: e.message }, { status: 400 });
    console.error(e);
    return NextResponse.json({ error: "Import failed unexpectedly." }, { status: 500 });
  }
}
