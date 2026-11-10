// Almacén temporal en memoria (se pierde al reiniciar el servidor)
const tasks = [
  { id: 1, title: 'Diseñar logo', description: '', status: 'pendiente', team_id: 1, assigned_to: null },
  { id: 2, title: 'Preparar demo', description: '', status: 'en_curso', team_id: 1, assigned_to: null },
  { id: 3, title: 'Revisar API', description: '', status: 'pendiente', team_id: 2, assigned_to: null },
];
let nextId = 4;

exports.list = (req, res) => {
  const teamId = Number(req.params.teamId);
  res.json(tasks.filter((t) => t.team_id === teamId));
};

exports.create = (req, res) => {
  const { title, description, status, assigned_to } = req.body;
  const task = {
    id: nextId++,
    title,
    description,
    status: status || 'pendiente',
    team_id: Number(req.params.teamId),
    assigned_to: assigned_to ?? null,
  };
  tasks.push(task);
  res.status(201).json(task);
};

exports.update = (req, res) => {
  const teamId = Number(req.params.teamId);
  const task = tasks.find((t) => t.id === Number(req.params.taskId) && t.team_id === teamId);
  if (!task) return res.status(404).json({ error: 'Tarea no encontrada' });

  const { title, description, status, assigned_to } = req.body;
  task.title = title;
  task.description = description;
  if (status !== undefined) task.status = status;
  if (assigned_to !== undefined) task.assigned_to = assigned_to;
  res.json(task);
};

exports.remove = (req, res) => {
  const teamId = Number(req.params.teamId);
  const index = tasks.findIndex((t) => t.id === Number(req.params.taskId) && t.team_id === teamId);
  if (index === -1) return res.status(404).json({ error: 'Tarea no encontrada' });

  tasks.splice(index, 1);
  res.status(204).send();
};
