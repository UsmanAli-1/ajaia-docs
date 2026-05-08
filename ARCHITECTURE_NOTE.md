# Architecture Note

## Overview

Ajaia Docs is a full stack document editor with a React frontend,
an Express REST API, and PostgreSQL on Neon. The architecture is
intentionally simple — every decision was made to maximize working
features within the 4–6 hour timebox.

---

## System Diagram

Browser (React + Vite)
https://ajaia-docs-cloud.vercel.app
│
│  HTTPS REST (Axios)
▼
Express REST API (Render)
https://ajaia-docs-backend-bk81.onrender.com
│
│  Prisma ORM v7 (pg.Pool adapter)
▼
PostgreSQL (Neon)

---

## Database Schema

User
id (uuid), email (unique), password (bcrypt), name, createdAt
Document
id (uuid), title, content (Json), ownerId → User, createdAt, updatedAt
SharedDocument
id (uuid), documentId → Document, userId → User, createdAt
UNIQUE(documentId, userId)

**Why store content as JSON?**
Tiptap uses a ProseMirror document model. Storing raw JSON preserves
all formatting (bold, italic, headings, lists) with zero serialization
loss. On load the JSON is fed directly back into `editor.commands.setContent()`
with no HTML parsing or markdown conversion needed.

---

## Prisma v7 Setup

Prisma v7 removed the `url` field from `schema.prisma`'s datasource block.
Connection is now configured in `prisma/prisma.config.ts`:

```ts
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
export { adapter }
```

Runtime code uses `src/lib/prisma.js` (CommonJS) which passes
the adapter to the Prisma client constructor.
The `src/lib/prisma.ts` file exists only for the Prisma CLI
(db push, generate) and is never required at runtime.

---

## Auth Flow

1. User registers → password hashed with bcryptjs (10 rounds)
2. Server returns a signed JWT (7 day expiry)
3. Token stored in localStorage
4. Every API request sends `Authorization: Bearer <token>`
5. Auth middleware verifies token and attaches `req.user`
6. 401 response triggers automatic logout and redirect via Axios interceptor

---

## Document Access Control

- Every document has exactly one owner (`ownerId`)
- Shared access lives in the `SharedDocument` join table
- All API routes check ownership or shared membership before allowing access
- Only the owner can rename, delete, or share a document
- Shared users can open and edit content but cannot manage shares

---

## File Upload Flow

1. Multer receives the file, saves temporarily to `src/uploads/`
2. Only `.txt` and `.md` are accepted — enforced by Multer's `fileFilter`
3. Backend reads the file as UTF-8 text
4. Content is split by newline; each non-empty line becomes a Tiptap paragraph node
5. A new Document record is created with this JSON as its content
6. The temp file is deleted immediately after processing

---

## Auto-Save Design

- Tiptap's `onUpdate` callback fires on every change
- A 2-second debounce timer resets on each update
- After 2 seconds of inactivity the content is PUT to `/api/documents/:id`
- Title changes use a separate 1.5-second debounce
- Ctrl+S fires an immediate save bypassing the debounce
- Save status indicator: `● Unsaved` → `Saving...` → `✓ Saved`

---

## Key Prioritization Decisions

| Decision | Reason |
|----------|--------|
| No WebSocket | Largest scope risk, not required by spec |
| JWT in localStorage | Simpler than httpOnly cookies for this scope |
| Tiptap JSON in DB | Zero-loss formatting, direct round-trip |
| Multer temp-file cleanup | Prevents disk buildup on free Render tier |
| Single shared role | Spec required basic access distinction only |
| Vercel + Render + Neon | All free tiers, zero cost for reviewers |

---

## Trade-offs Accepted

- **No refresh tokens** — JWT expires after 7 days, no rotation
- **localStorage auth** — acceptable for demo, not production-grade
- **Free tier cold starts** — Render free tier sleeps after 15 min;
  first request after sleep takes ~30 seconds
- **No rate limiting** — would add `express-rate-limit` in production
- **No HTTPS enforcement** — handled at infrastructure level by Render/Vercel

