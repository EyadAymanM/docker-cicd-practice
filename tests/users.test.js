import request from 'supertest';
import app from '../src/app.js';

describe('Users API', () => {
  describe('GET /users', () => {
    it('should return all users with success status', async () => {
      const response = await request(app).get('/users');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('status', 'success');
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /users/:id', () => {
    it('should return a user by id when user exists', async () => {
      const response = await request(app).get('/users/1');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('name');
      expect(response.body.data).toHaveProperty('email');
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app).get('/users/9999');
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('POST /users', () => {
    it('should create a new user with valid data', async () => {
      const uniqueEmail = `test-${Date.now()}@example.com`;
      const response = await request(app).post('/users').send({
        name: 'Test User',
        email: uniqueEmail,
      });
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.email).toBe(uniqueEmail);
    });

    it('should return 400 if name or email is missing', async () => {
      const response = await request(app).post('/users').send({ name: 'Test' });
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('DELETE /users/:id', () => {
    it('should delete a user when user exists', async () => {
      // First create a user to delete
      const uniqueEmail = `delete-test-${Date.now()}@example.com`;
      const createResponse = await request(app).post('/users').send({
        name: 'Delete Test User',
        email: uniqueEmail,
      });
      const userId = createResponse.body.data.id;

      // Then delete it
      const deleteResponse = await request(app).delete(`/users/${userId}`);
      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body).toHaveProperty('status', 'success');
      expect(deleteResponse.body).toHaveProperty('message');
    });

    it('should return 404 when trying to delete non-existent user', async () => {
      const response = await request(app).delete('/users/9999');
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body).toHaveProperty('message');
    });
  });
});
