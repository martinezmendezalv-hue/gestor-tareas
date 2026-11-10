// Álvaro Martínez
const service = require('../services/tasks.service');

// teamAccess ya ha comprobado el acceso y ha dejado el equipo en req.team
exports.byStatus = async (req, res) => {
  const porEstado = await service.countByStatus(req.team.id);
  res.json({
    team_id: req.team.id,
    team_name: req.team.name,
    total: porEstado.pendiente + porEstado.en_curso + porEstado.hecha,
    por_estado: porEstado,
  });
};
