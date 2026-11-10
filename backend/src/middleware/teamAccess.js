// Álvaro Martínez
const db = require('../config/db');

// Debe ir DESPUÉS de auth, que es el que rellena req.user
// Lee el equipo de la URL (:teamId) y comprueba que el usuario puede acceder a él
module.exports = async (req, res, next) => {
  const teamId = Number(req.params.teamId);
  if (!Number.isInteger(teamId)) {
    return res.status(404).json({ error: 'Equipo no encontrado' });
  }

  const team = await db('teams').where({ id: teamId }).first();
  if (!team) {
    return res.status(404).json({ error: 'Equipo no encontrado' });
  }

  // El administrador accede a todos los equipos; el miembro, solo a los suyos
  if (req.user.role !== 'admin') {
    const membresia = await db('team_members')
      .where({ team_id: teamId, user_id: req.user.id })
      .first();
    if (!membresia) {
      return res.status(403).json({ error: 'No perteneces a este equipo' });
    }
  }

  req.team = team; // los controladores ya no necesitan buscar el equipo
  next();
};
