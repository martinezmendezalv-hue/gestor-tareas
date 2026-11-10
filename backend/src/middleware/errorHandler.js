module.exports = (err, req, res, next) => {
  // Cuerpo con JSON mal formado
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'JSON no válido' });
  }

  const status = err.status || 500;

  // Los errores del servidor se registran en consola, pero no se muestran al cliente
  if (status >= 500) console.error(err);

  res.status(status).json({
    error: status >= 500 ? 'Error interno del servidor' : err.message,
  });
};
