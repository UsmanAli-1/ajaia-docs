const request = require('supertest');
const app = require('../src/index');
const { prisma } = require('../src/lib/prisma');

let token = '';
let documentId = '';
const testEmail = `test_${Date.now()}@example.com`;

beforeAll(async () => {
  const res = await request(app).post('/api/auth/register').send({
    name: 'Test User',
    email: testEmail,
    password: 'password123',
  });
  token = res.body.token;
});

afterAll(async () => {
  await prisma.sharedDocument.deleteMany({});
  await prisma.document.deleteMany({ where: { owner: { email: testEmail } } });
  await prisma.user.deleteMany({ where: { email: testEmail } });
  await prisma.$disconnect();
});

describe('Document API', () => {
  test('Creates a new document', async () => {
    const res = await request(app)
      .post('/api/documents')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.title).toBe('Untitled Document');
    documentId = res.body.id;
  });

  test('Gets owned documents', async () => {
    const res = await request(app)
      .get('/api/documents')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('Renames a document', async () => {
    const res = await request(app)
      .patch(`/api/documents/${documentId}/rename`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'My Test Document' });
    expect(res.statusCode).toBe(200);
    expect(res.body.title).toBe('My Test Document');
  });

  test('Saves document content', async () => {
    const content = {
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Hello world' }] }],
    };
    const res = await request(app)
      .put(`/api/documents/${documentId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content });
    expect(res.statusCode).toBe(200);
    expect(res.body.content).toEqual(content);
  });

  test('Rejects access without token', async () => {
    const res = await request(app).get('/api/documents');
    expect(res.statusCode).toBe(401);
  });
});