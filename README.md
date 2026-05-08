# Ajaia Docs

A lightweight collaborative document editor inspired by Google Docs.
Built as a full stack assignment for Ajaia LLC.

**Live Demo:** https://ajaia-docs-cloud.vercel.app
**Backend API:** https://ajaia-docs-backend-bk81.onrender.com

---

## Test Accounts

Use these to test the sharing flow without registering:

| Role | Email | Password |
|------|-------|----------|
| User A | usmanali@gmail.com | usmanali |
| User B | rehanali@gmail.com | rehanali |

**Suggested test flow:**
1. Log in as Usman → create a document → share it with rehanali@gmail.com
2. Log in as Rehan → check "Shared With Me" tab → open and edit the document
3. Log in as Rehan → create a document → share it with usmanali@gmail.com
4. Log in as Usman → check "Shared With Me" tab
5. Either account → click "Upload .txt / .md" → select a plain text file → editor opens with content

---

## Features

- Register and login with JWT authentication
- Create, rename, edit, and delete documents
- Rich text editing: bold, italic, underline, headings H1–H3, bullet lists,
  numbered lists, blockquote, inline code
- Auto-save (2 second debounce) and manual save (Ctrl+S)
- Upload a `.txt` or `.md` file and convert it into an editable document
- Share a document with another user by email
- Remove shared access from the share modal
- Separate views for owned documents and shared documents
- Full persistence in PostgreSQL via Neon

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, TailwindCSS v3, React Router v6, Tiptap |
| Backend | Node.js, Express.js, Prisma ORM v7 |
| Database | PostgreSQL on Neon |
| Auth | JWT + bcryptjs |
| File Upload | Multer |
| Frontend Deploy | Vercel |
| Backend Deploy | Render |

---

## Local Setup

### Prerequisites
- Node.js 18 or higher
- A Neon PostgreSQL database (free at neon.tech)
- Git

---

### 1. Clone the repository

```bash
git clone https://github.com/UsmanAli-1/ajaia-docs.git
cd ajaia-docs
```

### 2. Backend setup

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"
JWT_SECRET="your-secret-key-here"
PORT=5000
FRONTEND_URL="http://localhost:3000"
```

Push schema and generate Prisma client:

```bash
npx prisma generate
npx prisma db push
```

Seed test accounts:

```bash
node prisma/seed.js
```

Start the backend:

```bash
npm run dev
```

Backend runs at: `http://localhost:5000`

---

### 3. Frontend setup

Open a new terminal:

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000
```

Start the frontend:

```bash
npm run dev
```

Frontend runs at: `http://localhost:3000`

---

### 4. Run tests

```bash
cd backend
npm test
```

---

## Supported File Upload Types

Only `.txt` and `.md` files are accepted.
The file content is converted line by line into a Tiptap JSON document.
PDF, DOCX, and other formats are not supported in this version.

---

## Notes on Prisma v7

This project uses Prisma v7 which moved database connection config
out of `schema.prisma`. Connection is handled via `prisma/prisma.config.ts`
using `@prisma/adapter-pg` with a `pg.Pool` instance.
Runtime files use `src/lib/prisma.js` (CommonJS).
Do not use `new PrismaClient()` directly anywhere in route files.

---

## What Was Intentionally Deprioritized

- Real-time collaboration (no WebSocket or CRDT)
- Role-based permissions (viewer vs editor) — all shared users get edit access
- Email notifications when a document is shared
- Export to PDF or Markdown
- Document version history
- Comments or suggestion mode
- Mobile-optimized editor layout

---

## What I Would Build Next (2–4 More Hours)

1. **Export to Markdown** — serialize Tiptap JSON to `.md` using turndown
2. **Viewer vs editor roles** — add a `role` field to the SharedDocument table
3. **Version history** — snapshot content on each save, allow restore
4. **Broader file support** — parse `.docx` using mammoth on the backend

---

## Project Structure

```
ajaia-docs/
├── frontend/                   # React + Vite app
│   └── src/
│       ├── api/axios.js        # Axios instance with interceptors
│       ├── components/         # Navbar, ShareModal, ProtectedRoute
│       ├── context/            # AuthContext (JWT + user state)
│       └── pages/              # Login, Register, Dashboard, Editor
│
└── backend/                    # Express REST API
    ├── prisma/
    │   ├── schema.prisma       # DB schema (Prisma v7, no url in datasource)
    │   ├── prisma.config.ts    # Prisma v7 connection config (pg.Pool adapter)
    │   └── seed.js             # Test account seeder
    ├── src/
    │   ├── lib/
    │   │   ├── prisma.ts       # CLI-only Prisma client
    │   │   └── prisma.js       # Runtime CommonJS Prisma client
    │   ├── middleware/auth.js  # JWT verification
    │   └── routes/             # auth.js, documents.js, sharing.js
    └── tests/
        └── documents.test.js  # Jest + Supertest (5 tests)
```