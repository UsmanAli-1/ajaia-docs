const express = require('express');
const router = express.Router();
// ✅ Correct - uses your configured instance with the adapter
const { prisma } = require('../lib/prisma')
const authMiddleware = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { body, validationResult } = require('express-validator');


// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ['.txt', '.md'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only .txt and .md files are allowed'), false);
  }
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

// Apply auth to all document routes
router.use(authMiddleware);

// POST /api/documents - Create new blank document
router.post('/', async (req, res) => {
  try {
    const document = await prisma.document.create({
      data: {
        title: 'Untitled Document',
        content: {},
        ownerId: req.user.id,
      },
    });
    res.status(201).json(document);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create document' });
  }
});

// GET /api/documents - Get all owned documents
router.get('/', async (req, res) => {
  try {
    const documents = await prisma.document.findMany({
      where: { ownerId: req.user.id },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        updatedAt: true,
        createdAt: true,
        ownerId: true,
      },
    });
    res.json(documents);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// GET /api/documents/shared - Get documents shared with me
router.get('/shared', async (req, res) => {
  try {
    const shared = await prisma.sharedDocument.findMany({
      where: { userId: req.user.id },
      include: {
        document: {
          select: {
            id: true,
            title: true,
            updatedAt: true,
            createdAt: true,
            owner: {
              select: { name: true, email: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const documents = shared.map((s) => ({
      ...s.document,
      sharedAt: s.createdAt,
    }));

    res.json(documents);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch shared documents' });
  }
});

// GET /api/documents/:id - Get single document
router.get('/:id', async (req, res) => {
  try {
    const document = await prisma.document.findUnique({
      where: { id: req.params.id },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        shares: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    if (!document) return res.status(404).json({ error: 'Document not found' });

    // Check access: must be owner or shared user
    const isOwner = document.ownerId === req.user.id;
    const isShared = document.shares.some((s) => s.userId === req.user.id);

    if (!isOwner && !isShared) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ ...document, isOwner });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch document' });
  }
});

// PATCH /api/documents/:id/rename - Rename document
router.patch(
  '/:id/rename',
  [body('title').notEmpty().withMessage('Title is required')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const document = await prisma.document.findUnique({ where: { id: req.params.id } });
      if (!document) return res.status(404).json({ error: 'Document not found' });
      if (document.ownerId !== req.user.id) return res.status(403).json({ error: 'Only owner can rename' });

      const updated = await prisma.document.update({
        where: { id: req.params.id },
        data: { title: req.body.title.trim() },
      });

      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: 'Failed to rename document' });
    }
  }
);

// PUT /api/documents/:id - Save document content
router.put('/:id', async (req, res) => {
  const { content, title } = req.body;

  try {
    const document = await prisma.document.findUnique({ where: { id: req.params.id } });
    if (!document) return res.status(404).json({ error: 'Document not found' });

    const isOwner = document.ownerId === req.user.id;
    const isShared = await prisma.sharedDocument.findUnique({
      where: { documentId_userId: { documentId: req.params.id, userId: req.user.id } },
    });

    if (!isOwner && !isShared) return res.status(403).json({ error: 'Access denied' });

    const updateData = {};
    if (content !== undefined) updateData.content = content;
    if (title !== undefined) updateData.title = title.trim();

    const updated = await prisma.document.update({
      where: { id: req.params.id },
      data: updateData,
    });

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save document' });
  }
});

// DELETE /api/documents/:id - Delete document
router.delete('/:id', async (req, res) => {
  try {
    const document = await prisma.document.findUnique({ where: { id: req.params.id } });
    if (!document) return res.status(404).json({ error: 'Document not found' });
    if (document.ownerId !== req.user.id) return res.status(403).json({ error: 'Only owner can delete' });

    await prisma.document.delete({ where: { id: req.params.id } });
    res.json({ message: 'Document deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

// POST /api/documents/upload - Upload .txt or .md and create document
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded. Only .txt and .md allowed.' });

    const fileContent = fs.readFileSync(req.file.path, 'utf-8');
    const fileName = path.basename(req.file.originalname, path.extname(req.file.originalname));

    // Convert plain text into Tiptap-compatible JSON
    const paragraphs = fileContent
      .split('\n')
      .filter((line) => line.trim() !== '')
      .map((line) => ({
        type: 'paragraph',
        content: [{ type: 'text', text: line }],
      }));

    const tiptapContent = {
      type: 'doc',
      content: paragraphs.length > 0 ? paragraphs : [{ type: 'paragraph' }],
    };

    const document = await prisma.document.create({
      data: {
        title: fileName,
        content: tiptapContent,
        ownerId: req.user.id,
      },
    });

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.status(201).json(document);
  } catch (err) {
    console.error(err);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: 'Failed to process uploaded file' });
  }
});

module.exports = router;