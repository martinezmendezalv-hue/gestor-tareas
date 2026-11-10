// Álvaro Martínez
module.exports = (err, req, res, next) => {
  // Cuerpo con JSON mal formado
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'JSON no válido' });
  }

  // Cuerpo que supera el límite de tamaño
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'El cuerpo de la petición es demasiado grande' });
  }

  const status = err.status || 500;

  // Los errores del servidor se registran en consola, pero no se muestran al cliente
  if (status >= 500) console.error(err);

  res.status(status).json({
    error: status >= 500 ? 'Error interno del servidor' : err.message,
  });
};
