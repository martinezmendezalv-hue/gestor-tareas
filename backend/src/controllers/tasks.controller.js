// Álvaro Martínez
const db = require('../config/db');
const service = require('../services/tasks.service');
const email = require('../services/email.service');

// ¿El usuario pertenece al equipo?
const isMember = async (teamId, userId) =>
  !!(await db('team_members').where({ team_id: teamId, user_id: userId }).first());

// Busca la tarea dentro del equipo de la URL. Si el id no es un número, no existe
const findTask = (taskId, teamId) =>
  Number.isInteger(taskId) ? service.findInTeam(taskId, teamId) : undefined;

// Avisa por email al usuario asignado. Si el email falla, la petición no se rompe:
// la tarea ya está guardada y el error solo se registra en consola
const notifyAssigned = async (userId, task) => {
  if (!userId) return;
  try {
    const user = await db('users').where({ id: userId }).first();
    if (user) await email.sendTaskAssigned(user, task);
  } catch (err) {
    console.error('No se pudo enviar la notificación:', err.message);
  }
};

// teamAccess ya ha comprobado el acceso y ha dejado el equipo en req.team
exports.list = async (req, res) => {
  res.json(await service.listByTeam(req.team.id));
};

exports.create = async (req, res) => {
  const { title, description, status, assigned_to } = req.body;
  if (assigned_to && !(await isMember(req.team.id, assigned_to))) {
    return res.status(400).json({ error: 'El usuario asignado no pertenece al equipo' });
  }
  const task = await service.create({
    title,
    description,
    status: status || 'pendiente',
    team_id: req.team.id,
    assigned_to: assigned_to ?? null,
  });
  await notifyAssigned(task.assigned_to, task);
  res.status(201).json(task);
};

exports.update = async (req, res) => {
  const actual = await findTask(Number(req.params.taskId), req.team.id);
  if (!actual) return res.status(404).json({ error: 'Tarea no encontrada' });

  const { title, description, status, assigned_to } = req.body;
  if (assigned_to && !(await isMember(req.team.id, assigned_to))) {
    return res.status(400).json({ error: 'El usuario asignado no pertenece al equipo' });
  }
  const data = { title, description };
  if (status !== undefined) data.status = status;
  if (assigned_to !== undefined) data.assigned_to = assigned_to;

  const task = await service.update(actual.id, data);
  // Solo se avisa si la tarea se asigna a alguien distinto del anterior
  if (assigned_to && assigned_to !== actual.assigned_to) {
    await notifyAssigned(task.assigned_to, task);
  }
  res.json(task);
};

// Marca la tarea como hecha, sin necesidad de enviar cuerpo
exports.complete = async (req, res) => {
  const actual = await findTask(Number(req.params.taskId), req.team.id);
  if (!actual) return res.status(404).json({ error: 'Tarea no encontrada' });
  res.json(await service.update(actual.id, { status: 'hecha' }));
};

exports.remove = async (req, res) => {
  const actual = await findTask(Number(req.params.taskId), req.team.id);
  if (!actual) return res.status(404).json({ error: 'Tarea no encontrada' });
  await service.remove(actual.id);
  res.status(204).send();
};
