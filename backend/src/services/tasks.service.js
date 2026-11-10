// Álvaro Martínez
const db = require('../config/db');

// Busca una tarea por su id, comprobando que pertenece al equipo indicado
exports.findInTeam = (taskId, teamId) =>
  db('tasks').where({ id: taskId, team_id: teamId }).first();

// Crea una tarea y devuelve la tarea ya guardada
exports.create = async (data) => {
  const [id] = await db('tasks').insert(data);
  return db('tasks').where({ id }).first();
};

// Actualiza una tarea y devuelve la tarea actualizada
exports.update = async (id, data) => {
  await db('tasks').where({ id }).update({ ...data, updated_at: db.fn.now() });
  return db('tasks').where({ id }).first();
};

// Elimina una tarea
exports.remove = (id) => db('tasks').where({ id }).del();

// Consulta con JOIN: tareas de un equipo con el nombre del equipo y del usuario asignado
exports.listByTeam = (teamId) =>
  db('tasks as t')
    .join('teams as tm', 'tm.id', 't.team_id')
    .leftJoin('users as u', 'u.id', 't.assigned_to')
    .where('t.team_id', teamId)
    .select(
      't.id',
      't.title',
      't.description',
      't.status',
      't.assigned_to',
      'u.name as assigned_name',
      'tm.name as team_name'
    )
    .orderBy('t.id');

// Consulta con GROUP BY: número de tareas de un equipo por estado
exports.countByStatus = async (teamId) => {
  const filas = await db('tasks')
    .where({ team_id: teamId })
    .select('status')
    .count({ total: '*' })
    .groupBy('status');

  // Se parte de los tres estados a 0 para que siempre aparezcan, aunque no haya tareas
  const resultado = { pendiente: 0, en_curso: 0, hecha: 0 };
  filas.forEach((f) => {
    resultado[f.status] = Number(f.total);
  });
  return resultado;
};
