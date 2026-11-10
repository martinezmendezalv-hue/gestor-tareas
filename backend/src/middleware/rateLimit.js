// Álvaro Martínez
const rateLimit = require('express-rate-limit');
const env = require('../config/env');

// Limita los intentos de login por IP: pasado el límite, responde 429
exports.loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // ventana de 15 minutos
  limit: env.loginMaxAttempts, // intentos permitidos por ventana
  skipSuccessfulRequests: true, // los logins correctos no cuentan
  standardHeaders: 'draft-7', // cabeceras RateLimit-* estándar
  legacyHeaders: false, // sin las antiguas X-RateLimit-*
  message: { error: 'Demasiados intentos de inicio de sesión. Inténtalo de nuevo en 15 minutos' },
});
