# Architecture note

## Stack
Next.js (App Router, TypeScript) for UI and API in one deployable. TipTap (ProseMirror) for rich text. Postgres via Drizzle ORM.

## What I prioritized and why
1. **Access control correctness.** Every API route resolves the caller's role through one pure function (`lib/access.ts`) and returns 404 for documents the caller can't see, so existence doesn't leak. It is unit-tested.
2. **A usable editing loop.** Toolbar with active states, debounced autosave, explicit save status, error messages, read-only mode for viewers.
3. **Import that is safe.** Files are converted to HTML (`marked`, `mammoth`) and run through an allow-list sanitizer before storage.
4. **A deployable, reviewable build.** Hosted Postgres plus a serverless-friendly app, seeded users, one setup command.

## Key decisions and tradeoffs
- **Content stored as sanitized HTML**, not editor JSON. Simpler import and export and easy to inspect; the cost is less structured data for future features like comments. Sanitization runs server-side on every save.
- **Mock auth** (signed cookie, seeded users). The brief allows it; it spends no time on credentials. Not production auth.
- **Sharing model:** one `document_shares(document_id, user_id, role)` table with `viewer` or `editor`. Only the owner can share or delete.
- **Last write wins** on concurrent edits. Acceptable for this scope.
- **`drizzle-kit push`** instead of migration files, to move faster; I'd add migrations before real use.

## Deliberately not built
Real-time collaboration, real authentication, version history, comments, export, image support, attaching files to existing documents, rate limiting.

## What I'd build next (2–4 hours)
Document version history, Markdown export, sharing by link, optimistic concurrency (reject saves from stale versions), and integration tests against a real test database.
