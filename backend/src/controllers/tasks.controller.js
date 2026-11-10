// Álvaro Martínez
const db = require('../config/db');
const service = require('../services/tasks.service');

// Devuelve el equipo o undefined si no existe
const findTeam = (teamId) =>
  Number.isInteger(teamId) ? db('teams').where({ id: teamId }).first() : undefined;

// Comprueba que el usuario asignado pertenece al equipo
const isMember = async (teamId, userId) =>
  !!(await db('team_members').where({ team_id: teamId, user_id: userId }).first());

exports.list = async (req, res) => {
  const teamId = Number(req.params.teamId);
  if (!(await findTeam(teamId))) {
    return res.status(404).json({ error: 'Equipo no encontrado' });
  }
  res.json(await service.listByTeam(teamId));
};

exports.create = async (req, res) => {
  const teamId = Number(req.params.teamId);
  if (!(await findTeam(teamId))) {
    return res.status(404).json({ error: 'Equipo no encontrado' });
  }
  const { title, description, status, assigned_to } = req.body;
  if (assigned_to && !(await isMember(teamId, assigned_to))) {
    return res.status(400).json({ error: 'El usuario asignado no pertenece al equipo' });
  }
  const task = await service.create({
    title,
    description,
    status: status || 'pendiente',
    team_id: teamId,
    assigned_to: assigned_to ?? null,
  });
  res.status(201).json(task);
};

exports.update = async (req, res) => {
  const teamId = Number(req.params.teamId);
  const actual = await service.findInTeam(Number(req.params.taskId), teamId);
  if (!actual) return res.status(404).json({ error: 'Tarea no encontrada' });

  const { title, description, status, assigned_to } = req.body;
  if (assigned_to && !(await isMember(teamId, assigned_to))) {
    return res.status(400).json({ error: 'El usuario asignado no pertenece al equipo' });
  }
  const data = { title, description };
  if (status !== undefined) data.status = status;
  if (assigned_to !== undefined) data.assigned_to = assigned_to;
  res.json(await service.update(actual.id, data));
};

exports.remove = async (req, res) => {
  const actual = await service.findInTeam(Number(req.params.taskId), Number(req.params.teamId));
  if (!actual) return res.status(404).json({ error: 'Tarea no encontrada' });
  await service.remove(actual.id);
  res.status(204).send();
};
