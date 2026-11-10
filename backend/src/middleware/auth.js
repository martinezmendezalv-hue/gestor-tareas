// Álvaro Martínez
const jwt = require('jsonwebtoken');
const env = require('../config/env');

module.exports = (req, res, next) => {
  // La cabecera debe tener la forma: Authorization: Bearer <token>
  const [tipo, token] = (req.headers.authorization || '').split(' ');
  if (tipo !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Token requerido' });
  }
  try {
    // Comprueba la firma y la caducidad. Si algo falla, lanza un error
    req.user = jwt.verify(token, env.jwtSecret); // { id, role, iat, exp }
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido o caducado' });
  }
};
