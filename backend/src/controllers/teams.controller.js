// Álvaro Martínez
const db = require('../config/db');

exports.list = async (req, res) => {
  res.json(await db('teams').select('*').orderBy('id'));
};

exports.getById = async (req, res) => {
  const team = await db('teams').where({ id: Number(req.params.id) }).first();
  if (!team) return res.status(404).json({ error: 'Equipo no encontrado' });
  res.json(team);
};

exports.create = async (req, res) => {
  // created_by quedará vacío hasta que exista autenticación (Fase 3)
  const [id] = await db('teams').insert({ name: req.body.name });
  const team = await db('teams').where({ id }).first();
  res.status(201).json(team);
};
