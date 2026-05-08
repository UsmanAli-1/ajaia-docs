# AI Workflow Note

## Tools Used

| Tool | Purpose |
|------|---------|
| Claude (Anthropic) | Primary assistant — schema, routes, UI scaffolding |
| Chatgpt | Used for better quality of prompts |

---

## Where AI Materially Sped Up Work

### 1. Prisma schema and seed file
Described the three entities and their relationships in plain English.
Claude produced the full schema with the composite unique constraint
on SharedDocument and a complete seed file with realistic content.
Writing and testing this by hand would have taken 30–45 minutes.

### 2. Tiptap toolbar
The full formatting toolbar — with per-mark active state toggling,
heading dropdown, undo/redo, and onMouseDown prevention of focus loss —
was generated almost entirely by AI. Getting all the
`editor.isActive()` and `editor.chain().focus()` calls right
manually would have required reading the entire Tiptap extension docs.

### 3. Express route scaffolding
All route files (auth, documents, sharing) were scaffolded with
validation, Prisma queries, and error handling in one pass.
This saved approximately 60–90 minutes of boilerplate writing.

### 4. Tailwind UI
Dashboard grid, tab switcher, document cards, share modal, and
editor header bar were all generated from plain UI descriptions.
No CSS was hand-written.

---

## What AI-Generated Code I Changed or Rejected

### Changed: CORS configuration
Initial output used `origin: '*'`. Replaced with an allowlist
that reads `FRONTEND_URL` from env and filters null entries.
Wildcard origin does not work correctly with credentialed requests.

### Changed: Auto-save debounce timing
AI suggested 500ms. Changed to 2000ms because 500ms caused
too many API calls during normal typing and made the save
status indicator flicker visibly.

### Changed: Prisma client setup (significant)
AI generated standard `new PrismaClient()` with a `url` field
in `schema.prisma`. This does not work in Prisma v7.
I replaced this with the adapter pattern using `@prisma/adapter-pg`
and `pg.Pool` as required by v7. AI was not aware of this
breaking change — it required reading the Prisma v7 migration
docs directly and writing the config files manually.
This also required splitting into two client files:
one for the CLI (`prisma.ts`) and one for runtime (`prisma.js`).

### Changed: Import paths in test file
AI generated `require('../lib/prisma')` which did not exist.
Corrected to `require('../src/lib/prisma')` to match actual
project structure.

### Rejected: File upload via base64 to database
AI initially suggested encoding uploaded files as base64 and
storing them in the database. Rejected because it bloats the DB,
makes content harder to edit, and breaks the Tiptap JSON model.
Replaced with: read file as UTF-8, split by newline, map each
line to a Tiptap paragraph node, store as normal document content.

### Rejected: useEffect watching editor content string
AI suggested a `useEffect` watching a stringified version of
editor content to trigger saves. This caused stale closure bugs
where the save function captured an outdated title value.
Replaced with Tiptap's native `onUpdate` callback which always
has access to the latest editor state.

---

## How I Verified Correctness

- **API routes** — tested every endpoint in Postman with real
  request bodies before moving to the next feature
- **Sharing flow** — used Chrome and an incognito window
  simultaneously as usmanali@gmail.com and rehanali@gmail.com
  to verify the full share, view, edit, and remove cycle
- **File upload** — tested with a real `.txt` file and a real
  `.md` file; also tested that `.pdf` upload is correctly rejected
- **Editor persistence** — typed formatted content, saved, closed
  the browser, reopened and confirmed formatting was preserved exactly
- **Automated tests** — ran `npm test` after every route change
- **Production** — tested the complete user flow on the live
  Vercel URL after every deployment, not just locally

---

## Honest Assessment

AI handled approximately 70–75% of raw code volume.
The remaining 25–30% was engineering judgment: what to cut,
how to structure React state, fixing Prisma v7 compatibility,
debugging CORS in production, splitting the Prisma client
into CLI vs runtime files, and verifying the complete flow
end to end across two real user accounts.
AI accelerates execution but does not replace the judgment
required to ship something that actually works.