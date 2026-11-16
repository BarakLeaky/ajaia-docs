import { marked } from "marked";
import mammoth from "mammoth";
import { cleanHtml } from "./sanitize";

export const SUPPORTED_EXTENSIONS = [".txt", ".md", ".docx"];
export const MAX_IMPORT_BYTES = 2 * 1024 * 1024;

export class ImportError extends Error {}

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function titleFromFilename(name: string): string {
  return name.replace(/\.[^.]+$/, "").trim().slice(0, 200) || "Imported document";
}

/** Convert an uploaded file into sanitized editor HTML. Throws ImportError with a user-facing message. */
export async function fileToHtml(filename: string, data: Buffer): Promise<string> {
  const ext = filename.toLowerCase().match(/\.[^.]+$/)?.[0] ?? "";
  if (!SUPPORTED_EXTENSIONS.includes(ext)) {
    throw new ImportError(`Unsupported file type "${ext || "unknown"}". Use .txt, .md or .docx.`);
  }
  if (data.length === 0) throw new ImportError("The file is empty.");
  if (data.length > MAX_IMPORT_BYTES) throw new ImportError("The file is larger than 2 MB.");

  let html: string;
  if (ext === ".txt") {
    html = escapeHtml(data.toString("utf8"))
      .split(/\n{2,}/)
      .map((p) => `<p>${p.replace(/\n/g, "<br>")}</p>`)
      .join("");
  } else if (ext === ".md") {
    html = await marked.parse(data.toString("utf8"));
  } else {
    try {
      html = (await mammoth.convertToHtml({ buffer: data })).value;
    } catch {
      throw new ImportError("This .docx file could not be read. It may be corrupted.");
    }
  }
  return cleanHtml(html).trim() || "<p></p>";
}
