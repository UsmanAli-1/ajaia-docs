const { prisma } = require('../src/lib/prisma')
const bcrypt = require('bcryptjs')

async function main() {
  console.log('Seeding database...')

  // Clean previous seed data safely
  await prisma.sharedDocument.deleteMany({
    where: {
      user: {
        email: { in: ['usmanali@gmail.com', 'rehanali@gmail.com'] },
      },
    },
  })
  await prisma.document.deleteMany({
    where: {
      owner: {
        email: { in: ['usmanali@gmail.com', 'rehanali@gmail.com'] },
      },
    },
  })
  await prisma.user.deleteMany({
    where: {
      email: { in: ['usmanali@gmail.com', 'rehanali@gmail.com'] },
    },
  })

  // Create Usman
  const usmanPassword = await bcrypt.hash('usmanali', 10)
  const usman = await prisma.user.create({
    data: {
      name: 'Usman Ali',
      email: 'usmanali@gmail.com',
      password: usmanPassword,
    },
  })

  // Create Rehan
  const rehanPassword = await bcrypt.hash('rehanali', 10)
  const rehan = await prisma.user.create({
    data: {
      name: 'Rehan Ali',
      email: 'rehanali@gmail.com',
      password: rehanPassword,
    },
  })

  // Usman creates a document and shares it with Rehan
  const usmanDoc = await prisma.document.create({
    data: {
      title: 'Project Kickoff Notes',
      ownerId: usman.id,
      content: {
        type: 'doc',
        content: [
          {
            type: 'heading',
            attrs: { level: 1 },
            content: [{ type: 'text', text: 'Project Kickoff Notes' }],
          },
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'This document was created by Usman and shared with Rehan.',
              },
            ],
          },
          {
            type: 'heading',
            attrs: { level: 2 },
            content: [{ type: 'text', text: 'Action Items' }],
          },
          {
            type: 'bulletList',
            content: [
              {
                type: 'listItem',
                content: [
                  {
                    type: 'paragraph',
                    content: [
                      { type: 'text', text: 'Review the architecture document' },
                    ],
                  },
                ],
              },
              {
                type: 'listItem',
                content: [
                  {
                    type: 'paragraph',
                    content: [
                      { type: 'text', text: 'Set up local development environment' },
                    ],
                  },
                ],
              },
              {
                type: 'listItem',
                content: [
                  {
                    type: 'paragraph',
                    content: [
                      { type: 'text', text: 'Schedule first team standup' },
                    ],
                  },
                ],
              },
            ],
          },
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                marks: [{ type: 'bold' }],
                text: 'Note: ',
              },
              {
                type: 'text',
                text: 'Formatting is preserved as Tiptap JSON in PostgreSQL.',
              },
            ],
          },
        ],
      },
    },
  })

  await prisma.sharedDocument.create({
    data: { documentId: usmanDoc.id, userId: rehan.id },
  })

  // Rehan creates a document and shares it with Usman
  const rehanDoc = await prisma.document.create({
    data: {
      title: 'Rehan\'s Meeting Notes',
      ownerId: rehan.id,
      content: {
        type: 'doc',
        content: [
          {
            type: 'heading',
            attrs: { level: 1 },
            content: [{ type: 'text', text: "Rehan's Meeting Notes" }],
          },
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'This document was created by Rehan and shared with Usman.',
              },
            ],
          },
          {
            type: 'heading',
            attrs: { level: 2 },
            content: [{ type: 'text', text: 'Discussion Points' }],
          },
          {
            type: 'orderedList',
            content: [
              {
                type: 'listItem',
                content: [
                  {
                    type: 'paragraph',
                    content: [{ type: 'text', text: 'Review last sprint deliverables' }],
                  },
                ],
              },
              {
                type: 'listItem',
                content: [
                  {
                    type: 'paragraph',
                    content: [{ type: 'text', text: 'Plan next sprint goals' }],
                  },
                ],
              },
              {
                type: 'listItem',
                content: [
                  {
                    type: 'paragraph',
                    content: [{ type: 'text', text: 'Assign ownership of open tasks' }],
                  },
                ],
              },
            ],
          },
        ],
      },
    },
  })

  await prisma.sharedDocument.create({
    data: { documentId: rehanDoc.id, userId: usman.id },
  })

  // Usman's private document (not shared)
  await prisma.document.create({
    data: {
      title: 'My Private Notes',
      ownerId: usman.id,
      content: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: 'This document is only visible to Usman.' },
            ],
          },
        ],
      },
    },
  })

  console.log('✅ Seed complete')
  console.log('   usmanali@gmail.com / usmanali')
  console.log('   rehanali@gmail.com / rehanali')
  console.log('')
  console.log('   Usman has shared "Project Kickoff Notes" with Rehan')
  console.log('   Rehan has shared "Rehan\'s Meeting Notes" with Usman')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })