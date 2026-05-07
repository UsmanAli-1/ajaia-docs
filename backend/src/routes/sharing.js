const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
// ✅ Correct - uses your configured instance with the adapter
const { prisma } = require('../lib/prisma')


router.use(authMiddleware);

// POST /api/sharing/:documentId - Share document with a user by email
router.post(
  '/:documentId',
  [body('email').isEmail().withMessage('Valid email required')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { documentId } = req.params;
    const { email } = req.body;

    try {
      // Check document exists and caller is owner
      const document = await prisma.document.findUnique({ where: { id: documentId } });
      if (!document) return res.status(404).json({ error: 'Document not found' });
      if (document.ownerId !== req.user.id) {
        return res.status(403).json({ error: 'Only the owner can share this document' });
      }

      // Find the target user
      const targetUser = await prisma.user.findUnique({ where: { email } });
      if (!targetUser) return res.status(404).json({ error: 'No user found with that email' });

      // Can't share with yourself
      if (targetUser.id === req.user.id) {
        return res.status(400).json({ error: 'You cannot share a document with yourself' });
      }

      // Check if already shared
      const existing = await prisma.sharedDocument.findUnique({
        where: { documentId_userId: { documentId, userId: targetUser.id } },
      });
      if (existing) return res.status(400).json({ error: 'Document already shared with this user' });

      const share = await prisma.sharedDocument.create({
        data: { documentId, userId: targetUser.id },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      });

      res.status(201).json({
        message: `Document shared with ${targetUser.name}`,
        share,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to share document' });
    }
  }
);

// GET /api/sharing/:documentId - Get list of users this doc is shared with
router.get('/:documentId', async (req, res) => {
  try {
    const document = await prisma.document.findUnique({ where: { id: req.params.documentId } });
    if (!document) return res.status(404).json({ error: 'Document not found' });
    if (document.ownerId !== req.user.id) return res.status(403).json({ error: 'Access denied' });

    const shares = await prisma.sharedDocument.findMany({
      where: { documentId: req.params.documentId },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    res.json(shares);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch shares' });
  }
});

// DELETE /api/sharing/:documentId/:userId - Remove share
router.delete('/:documentId/:userId', async (req, res) => {
  try {
    const document = await prisma.document.findUnique({ where: { id: req.params.documentId } });
    if (!document) return res.status(404).json({ error: 'Document not found' });
    if (document.ownerId !== req.user.id) return res.status(403).json({ error: 'Only owner can remove access' });

    await prisma.sharedDocument.delete({
      where: {
        documentId_userId: {
          documentId: req.params.documentId,
          userId: req.params.userId,
        },
      },
    });

    res.json({ message: 'Access removed' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove share' });
  }
});

module.exports = router;