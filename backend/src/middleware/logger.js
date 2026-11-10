module.exports = (req, res, next) => {
  const inicio = Date.now();

  // Se ejecuta cuando la respuesta ya se ha enviado
  res.on('finish', () => {
    const duracion = Date.now() - inicio;
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} - ${duracion}ms`);
  });

  next(); // pasa al siguiente middleware o ruta
};
