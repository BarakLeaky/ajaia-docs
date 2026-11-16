import sanitizeHtml from "sanitize-html";

/** Allow-list matching what the editor can produce. Everything else is stripped. */
export function cleanHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      "p", "br", "strong", "b", "em", "i", "u", "s",
      "h1", "h2", "h3", "ul", "ol", "li", "blockquote", "code", "pre", "hr",
    ],
    allowedAttributes: {},
  });
}
