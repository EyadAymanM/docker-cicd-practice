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

  describe('PUT /users/:id', () => {
    it('should update a user with valid data', async () => {
      // First create a user to update
      const uniqueEmail = `update-test-${Date.now()}@example.com`;
      const createResponse = await request(app).post('/users').send({
        name: 'Original Name',
        email: uniqueEmail,
      });
      const userId = createResponse.body.data.id;

      // Then update it
      const updateResponse = await request(app).put(`/users/${userId}`).send({
        name: 'Updated Name',
        email: `updated-${Date.now()}@example.com`,
      });
      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body).toHaveProperty('data');
      expect(updateResponse.body).toHaveProperty('status', 'success');
      expect(updateResponse.body.data.name).toBe('Updated Name');
      expect(updateResponse.body.data.email).toBe(`updated-${Date.now()}@example.com`);
    });

    it('should update only name when only name is provided', async () => {
      // First create a user to update
      const uniqueEmail = `update-name-test-${Date.now()}@example.com`;
      const createResponse = await request(app).post('/users').send({
        name: 'Original Name',
        email: uniqueEmail,
      });
      const userId = createResponse.body.data.id;

      // Update only name
      const updateResponse = await request(app).put(`/users/${userId}`).send({
        name: 'New Name',
      });
      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.data.name).toBe('New Name');
      expect(updateResponse.body.data.email).toBe(uniqueEmail);
    });

    it('should update only email when only email is provided', async () => {
      // First create a user to update
      const uniqueEmail = `update-email-test-${Date.now()}@example.com`;
      const createResponse = await request(app).post('/users').send({
        name: 'Original Name',
        email: uniqueEmail,
      });
      const userId = createResponse.body.data.id;

      // Update only email
      const newEmail = `newemail-${Date.now()}@example.com`;
      const updateResponse = await request(app).put(`/users/${userId}`).send({
        email: newEmail,
      });
      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.data.name).toBe('Original Name');
      expect(updateResponse.body.data.email).toBe(newEmail);
    });

    it('should return 404 when updating non-existent user', async () => {
      const response = await request(app).put('/users/9999').send({
        name: 'Updated Name',
      });
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 when no fields are provided for update', async () => {
      const response = await request(app).put('/users/1').send({});
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body).toHaveProperty('message');
    });

    it('should return 409 when trying to update email to an existing one', async () => {
      // Create two users
      const email1 = `user1-${Date.now()}@example.com`;
      const email2 = `user2-${Date.now()}@example.com`;
      
      const user1Response = await request(app).post('/users').send({
        name: 'User 1',
        email: email1,
      });
      const user1Id = user1Response.body.data.id;

      await request(app).post('/users').send({
        name: 'User 2',
        email: email2,
      });

      // Try to update user1 with user2's email
      const updateResponse = await request(app).put(`/users/${user1Id}`).send({
        email: email2,
      });
      expect(updateResponse.status).toBe(409);
      expect(updateResponse.body).toHaveProperty('status', 'error');
      expect(updateResponse.body).toHaveProperty('message', 'Email already exists');
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
