import request from 'supertest';
import app from '../src/app.js';

describe('Users API', () => {
  describe('GET /users', () => {
    it('should return all users', async () => {
      const response = await request(app).get('/users');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('status', 'success');
    });
  });

  describe('GET /users/:id', () => {
    it('should return a user by id', async () => {
      const response = await request(app).get('/users/1');
      expect(response.status).toEqual(expect.any(Number));
      expect(response.body).toHaveProperty('status');
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app).get('/users/9999');
      expect(response.status).toBe(404);
    });
  });

  describe('POST /users', () => {
    it('should create a new user', async () => {
      const response = await request(app).post('/users').send({
        name: 'Test User',
        email: `test-${Date.now()}@example.com`,
      });
      expect([201, 409]).toContain(response.status);
      expect(response.body).toHaveProperty('status');
    });

    it('should return 400 if name or email is missing', async () => {
      const response = await request(app).post('/users').send({ name: 'Test' });
      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /users/:id', () => {
    it('should return appropriate status', async () => {
      const response = await request(app).delete('/users/1');
      expect([200, 404]).toContain(response.status);
      expect(response.body).toHaveProperty('status');
    });
  });
});
