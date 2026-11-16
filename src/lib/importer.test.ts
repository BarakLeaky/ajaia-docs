import { describe, expect, it } from "vitest";
import { fileToHtml, ImportError, titleFromFilename } from "./importer";

const buf = (s: string) => Buffer.from(s, "utf8");

describe("fileToHtml", () => {
  it("turns .txt paragraphs into <p> and escapes markup", async () => {
    const html = await fileToHtml("a.txt", buf("one\n\ntwo <b>x</b>"));
    expect(html).toContain("<p>one</p>");
    expect(html).toContain("&lt;b&gt;x&lt;/b&gt;");
  });

  it("renders markdown headings and lists", async () => {
    const html = await fileToHtml("a.md", buf("# Title\n\n- a\n- b"));
    expect(html).toContain("<h1>");
    expect(html).toContain("<li>a</li>");
  });

  it("strips scripts and event handlers from markdown with raw HTML", async () => {
    const html = await fileToHtml("a.md", buf('hi <script>alert(1)</script><img src=x onerror=alert(1)>'));
    expect(html).not.toContain("script");
    expect(html).not.toContain("onerror");
  });

  it("rejects unsupported types and empty files with clear messages", async () => {
    await expect(fileToHtml("a.pdf", buf("x"))).rejects.toThrow(ImportError);
    await expect(fileToHtml("a.txt", buf(""))).rejects.toThrow("empty");
  });

  it("derives a title from the filename", () => {
    expect(titleFromFilename("Q4 plan.final.md")).toBe("Q4 plan.final");
  });
});
