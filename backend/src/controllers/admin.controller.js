// Álvaro Martínez
const db = require('../config/db');

// Lista todos los usuarios. Nunca se incluye password_hash
exports.listUsers = async (req, res) => {
  const users = await db('users')
    .select('id', 'name', 'email', 'role', 'created_at')
    .orderBy('id');
  res.json(users);
};
