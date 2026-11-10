module.exports = (schema) => (req, res, next) => {
  const resultado = schema.safeParse(req.body);

  if (!resultado.success) {
    return res.status(400).json({
      error: 'Datos inválidos',
      detalles: resultado.error.issues.map((i) => ({
        campo: i.path.join('.'),
        mensaje: i.message,
      })),
    });
  }

  req.body = resultado.data; // datos ya validados y limpios
  next();
};
