const express = require('express');
const logger = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Permite leer el cuerpo de las peticiones en formato JSON
app.use(express.json());

// Registra cada petición en la consola
app.use(logger);

// Ruta de comprobación: sirve para saber que la API está viva
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Rutas de la API
app.use('/api/teams', require('./routes/teams.routes'));
app.use('/api/teams/:teamId/tasks', require('./routes/tasks.routes'));

// Cualquier ruta que no exista devuelve 404 en JSON
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Gestor de errores: SIEMPRE el último
app.use(errorHandler);

module.exports = app;
