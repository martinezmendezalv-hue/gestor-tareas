// Álvaro Martínez
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const env = require('../config/env');
const { hashPassword, comparePassword } = require('../utils/password');

// Firma un token con el id y el rol del usuario (nunca la contraseña)
const firmarToken = (user) =>
  jwt.sign({ id: user.id, role: user.role }, env.jwtSecret, { expiresIn: env.jwtExpires });

exports.register = async (req, res) => {
  const { name, password } = req.body;
  // El email se guarda en minúsculas para que Ana@demo.com y ana@demo.com no cuenten como distintos
  const email = req.body.email.toLowerCase();

  const existe = await db('users').where({ email }).first();
  if (existe) {
    return res.status(409).json({ error: 'El email ya está registrado' });
  }

  // El rol NO viene del cliente: todo usuario nuevo es "miembro"
  const [id] = await db('users').insert({
    name,
    email,
    password_hash: await hashPassword(password),
  });

  const user = { id, name, email, role: 'miembro' };
  res.status(201).json({ user, token: firmarToken(user) });
};

exports.login = async (req, res) => {
  const { password } = req.body;
  const email = req.body.email.toLowerCase();

  const user = await db('users').where({ email }).first();

  // Mismo mensaje si falla el email o la contraseña: no se revela cuál de los dos es
  if (!user || !(await comparePassword(password, user.password_hash))) {
    return res.status(401).json({ error: 'Credenciales incorrectas' });
  }

  res.json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    token: firmarToken(user),
  });
};

// Devuelve el usuario de la sesión actual (requiere el middleware auth)
exports.me = async (req, res) => {
  const user = await db('users')
    .where({ id: req.user.id })
    .select('id', 'name', 'email', 'role')
    .first();

  // El token puede ser válido aunque el usuario ya se haya borrado
  if (!user) return res.status(401).json({ error: 'Usuario no encontrado' });
  res.json(user);
};
