import pool from '../db.js';

export const getAllUsers = async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [users] = await connection.query('SELECT * FROM users');
    connection.release();

    res.status(200).json({ data: users, status: 'success' });
  } catch (error) {
    res.status(500).json({ message: error.message, status: 'error' });
  }
};

export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();
    const [user] = await connection.query('SELECT * FROM users WHERE id = ?', [id]);
    connection.release();

    if (user.length === 0) {
      return res.status(404).json({ message: 'User not found', status: 'error' });
    }

    res.status(200).json({ data: user[0], status: 'success' });
  } catch (error) {
    res.status(500).json({ message: error.message, status: 'error' });
  }
};

export const createUser = async (req, res) => {
  try {
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required', status: 'error' });
    }

    const connection = await pool.getConnection();
    const [result] = await connection.query('INSERT INTO users (name, email) VALUES (?, ?)', [name, email]);
    connection.release();

    res.status(201).json({ data: { id: result.insertId, name, email }, status: 'success' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Email already exists', status: 'error' });
    }
    res.status(500).json({ message: error.message, status: 'error' });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email } = req.body;

    if (!name && !email) {
      return res.status(400).json({ message: 'At least one field (name or email) is required', status: 'error' });
    }

    const connection = await pool.getConnection();
    
    // Check if user exists
    const [user] = await connection.query('SELECT * FROM users WHERE id = ?', [id]);
    if (user.length === 0) {
      connection.release();
      return res.status(404).json({ message: 'User not found', status: 'error' });
    }

    // Build update query dynamically
    let updateQuery = 'UPDATE users SET ';
    const updateValues = [];
    const updates = [];

    if (name) {
      updates.push('name = ?');
      updateValues.push(name);
    }
    if (email) {
      updates.push('email = ?');
      updateValues.push(email);
    }

    updateQuery += updates.join(', ') + ' WHERE id = ?';
    updateValues.push(id);

    const [result] = await connection.query(updateQuery, updateValues);
    connection.release();

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found', status: 'error' });
    }

    res.status(200).json({ 
      data: { id, name: name || user[0].name, email: email || user[0].email }, 
      status: 'success' 
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Email already exists', status: 'error' });
    }
    res.status(500).json({ message: error.message, status: 'error' });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();
    const [result] = await connection.query('DELETE FROM users WHERE id = ?', [id]);
    connection.release();

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found', status: 'error' });
    }

    res.status(200).json({ message: 'User deleted successfully', status: 'success' });
  } catch (error) {
    res.status(500).json({ message: error.message, status: 'error' });
  }
};
