import app from './app.js';
import pool from './db.js';

const PORT = process.env.PORT || 3000;

// Test database connection
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Successfully connected to MySQL database');
    connection.release();
  } catch (error) {
    console.error('❌ Failed to connect to MySQL database:', error.message);
  }
};

app.listen(PORT, async () => {
  console.log(`Server is running on port: ${PORT}`);
  await testConnection();
});
