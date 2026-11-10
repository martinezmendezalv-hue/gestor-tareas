// Álvaro Martínez
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const env = require('./config/env');
const logger = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Cabeceras HTTP de seguridad (y oculta X-Powered-By)
app.use(helmet());

// CORS restringido: solo el frontend configurado en CORS_ORIGIN puede leer las respuestas
app.use(cors({ origin: env.corsOrigin }));

// Registra cada petición en la consola
app.use(logger);

// Lee el cuerpo JSON, con un límite de tamaño
app.use(express.json({ limit: '10kb' }));

// Ruta de comprobación: sirve para saber que la API está viva
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Rutas de la API
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/admin', require('./routes/admin.routes'));
app.use('/api/teams', require('./routes/teams.routes'));
app.use('/api/teams/:teamId/tasks', require('./routes/tasks.routes'));
app.use('/api/teams/:teamId/stats', require('./routes/stats.routes'));

// Cualquier ruta que no exista devuelve 404 en JSON
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Gestor de errores: SIEMPRE el último
app.use(errorHandler);

module.exports = app;
