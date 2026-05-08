# Submission — Ajaia LLC Full Stack Assignment

**Candidate:** Usman Ali
**Email:** usmanali0044444@gmail.com
**Submitted:** May 8, 2026

---

## Live Links

| | URL |
|-|-----|
| **Frontend** | https://ajaia-docs-cloud.vercel.app |
| **Backend API** | https://ajaia-docs-backend-bk81.onrender.com |
| **Walkthrough Video** | https://www.loom.com/share/cd4cb5cf547b4bd79e3cdc8c88556724 |
| **GitHub** | https://github.com/UsmanAli-1/ajaia-docs |

---

## Test Credentials

| User | Email | Password |
|------|-------|----------|
| Usman (User A) | usmanali@gmail.com | usmanali |
| Rehan (User B) | rehanali@gmail.com | rehanali |

**To test the full sharing flow:**
1. Log in as Usman → create a new document → click Share → enter rehanali@gmail.com
2. Log in as Rehan → open "Shared With Me" tab → open and edit the document
3. Log in as Rehan → create a new document → click Share → enter usmanali@gmail.com
4. Log in as Usman → check "Shared With Me" tab
5. Either account → click "Upload .txt / .md" → select a file → editor opens with content

> Note: The backend is on Render's free tier and may take up to 30-60 seconds
> to respond after a period of inactivity. This is a hosting limitation,
> not a bug. Wait 30-60 seconds and refresh if the page appears to hang.

---

## What Is Included

| Item | Status |
|------|--------|
| Source code (frontend + backend) | ✅ Complete |
| README.md with local setup instructions | ✅ Complete |
| ARCHITECTURE_NOTE.md | ✅ Complete |
| AI_WORKFLOW_NOTE.md | ✅ Complete |
| SUBMISSION.md | ✅ This file |
| Live frontend (Vercel) | ✅ https://ajaia-docs-cloud.vercel.app |
| Live backend (Render) | ✅ https://ajaia-docs-backend-bk81.onrender.com |
| Walkthrough video | ✅ Link above |
| Automated tests (Jest + Supertest) | ✅ 5 tests passing |
| Seeded test accounts | ✅ usmanali / rehanali |

---

## Feature Completion

| Feature | Status | Notes |
|---------|--------|-------|
| Document creation | ✅ | Instant blank document |
| Document rename | ✅ | Inline on dashboard card + editor title input |
| Rich text — bold | ✅ | Ctrl+B and toolbar |
| Rich text — italic | ✅ | Ctrl+I and toolbar |
| Rich text — underline | ✅ | Ctrl+U and toolbar |
| Rich text — headings H1/H2/H3 | ✅ | Dropdown in toolbar |
| Rich text — bullet list | ✅ | Toolbar button |
| Rich text — numbered list | ✅ | Toolbar button |
| Rich text — blockquote | ✅ | Toolbar button |
| Rich text — inline code | ✅ | Toolbar button |
| Auto-save (2s debounce) | ✅ | Fires after 2s of inactivity |
| Manual save (Ctrl+S) | ✅ | Bypasses debounce |
| Save status indicator | ✅ | Unsaved / Saving / Saved |
| Document persistence | ✅ | Tiptap JSON stored in PostgreSQL |
| Reopen document | ✅ | Full formatting preserved on reload |
| File upload (.txt) | ✅ | Converts to editable document |
| File upload (.md) | ✅ | Converts to editable document |
| File type restriction | ✅ | Only .txt and .md accepted |
| JWT authentication | ✅ | Register, login, protected routes |
| Share by email | ✅ | Owner only |
| Remove shared access | ✅ | From share modal |
| Owned vs shared tabs | ✅ | Separate dashboard sections with counts |
| Delete document | ✅ | Owner only, with confirmation |
| Access control | ✅ | Non-owners/non-shared users get 403 |
| Input validation | ✅ | express-validator on all routes |
| Error handling | ✅ | All routes + frontend error states |
| Automated test | ✅ | 5 passing tests (Jest + Supertest) |

---

## Intentionally Deprioritized

- Real-time collaboration — no WebSocket; out of scope for timebox
- Role-based sharing (viewer vs editor) — all shared users get edit access
- Email notifications on share
- Export to PDF or Markdown
- Document version history with restore
- Comments or suggestion mode

---

## What I Would Build Next (2–4 More Hours)

1. **Viewer vs editor roles** — add `role` field to SharedDocument,
   restrict editor toolbar for viewer role
2. **Export to Markdown** — serialize Tiptap JSON using turndown,
   trigger browser download
3. **Version history** — snapshot content JSON on each save,
   display timeline panel with restore
4. **Broader file support** — parse `.docx` using mammoth,
   map heading styles to Tiptap heading nodes