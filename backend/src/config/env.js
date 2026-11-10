// Álvaro Martínez
require('dotenv').config({
  path: process.env.NODE_ENV === 'test' ? '.env.test' : '.env',
});

module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3000,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpires: process.env.JWT_EXPIRES || '2h',
  // Varios orígenes se separan con comas
  corsOrigin: (process.env.CORS_ORIGIN || 'http://localhost:5500')
    .split(',')
    .map((origen) => origen.trim()),
  // Intentos de login fallidos permitidos por ventana de 15 minutos
  loginMaxAttempts: Number(process.env.LOGIN_MAX_ATTEMPTS) || 5,
};
