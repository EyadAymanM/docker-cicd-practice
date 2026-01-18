import express from 'express';
import { configDotenv } from 'dotenv';
import usersRouter from './routes/users.router.js';

configDotenv();

const app = express();

// Middleware
app.use(express.json());

// Routes
app.get('/', (_req, res) => {
  res.json({ message: 'app running successfully!', status: 'success' });
});

app.use('/users', usersRouter);

export default app;