# Ajaia Docs

A lightweight collaborative document editor: create, rename, edit (rich text), import files, share with other users, and persist everything in Postgres.

## Features
- Create, rename, edit, save and reopen documents (autosave plus a Save button)
- Rich text: bold, italic, underline, H1/H2, bulleted and numbered lists
- File import: `.txt`, `.md`, `.docx` (up to 2 MB) become a new editable document
- Sharing: owner grants another user view-only or edit access; dashboard separates "My documents" from "Shared with me" with badges
- Persistence in Postgres; formatting is stored as sanitized HTML

## Test accounts (mock sign-in)
Pick a user on the login page. No passwords.
- alice@ajaia.test, bob@ajaia.test, carol@ajaia.test

To test sharing: sign in as Alice, create a document, click Share, enter `bob@ajaia.test`. Open a second browser profile (or a private window), sign in as Bob, and find it under "Shared with me".

## Run locally
Requires Node 20.6+ and a Postgres database (Neon or Supabase free tier works).

```bash
npm install
cp .env.example .env.local     # then edit DATABASE_URL and SESSION_SECRET
npm run setup                  # creates tables and seeds the 3 users
npm run dev                    # http://localhost:3000
npm test                       # automated tests
```

## Deploy (Vercel + Neon)
1. Push this repo to GitHub and import it in Vercel.
2. Add environment variables `DATABASE_URL` and `SESSION_SECRET` in Vercel.
3. From your machine (with `.env.local` pointing at the same database) run `npm run setup` once.
4. Deploy, then sign in with the test accounts above.

## Supported files
`.txt`, `.md`, `.docx` only, max 2 MB. Other types are rejected with a message. Imported content is sanitized; images and complex Word layouts are not preserved.

## Known limitations
See ARCHITECTURE.md ("Deliberately not built").
