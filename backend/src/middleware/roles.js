// Álvaro Martínez
// Uso: roles('admin')  o  roles('admin', 'miembro')
// Debe ir DESPUÉS del middleware de autenticación, que es el que rellena req.user
module.exports = (...rolesPermitidos) => (req, res, next) => {
  if (!req.user || !rolesPermitidos.includes(req.user.role)) {
    return res.status(403).json({ error: 'No tienes permisos para esta acción' });
  }
  next();
};
