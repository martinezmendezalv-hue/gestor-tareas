// Álvaro Martínez
// Almacén temporal en memoria (se pierde al reiniciar el servidor)
const teams = [
  { id: 1, name: 'Equipo Alfa' },
  { id: 2, name: 'Equipo Beta' },
];
let nextId = 3;

exports.list = (req, res) => {
  res.json(teams);
};

exports.getById = (req, res) => {
  const team = teams.find((t) => t.id === Number(req.params.id));
  if (!team) return res.status(404).json({ error: 'Equipo no encontrado' });
  res.json(team);
};

exports.create = (req, res) => {
  const team = { id: nextId++, name: req.body.name };
  teams.push(team);
  res.status(201).json(team);
};
