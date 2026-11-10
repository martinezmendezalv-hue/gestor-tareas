// Álvaro Martínez
const db = require('../config/db');

// Admin: todos los equipos. Miembro: solo aquellos en los que está
exports.list = async (req, res) => {
  let query = db('teams as t').select('t.*');
  if (req.user.role !== 'admin') {
    query = query
      .join('team_members as m', 'm.team_id', 't.id')
      .where('m.user_id', req.user.id);
  }
  res.json(await query.orderBy('t.id'));
};

// teamAccess ya ha comprobado el acceso y ha dejado el equipo en req.team
exports.getById = (req, res) => {
  res.json(req.team);
};

// Crea el equipo y añade al creador como miembro, todo en una transacción
exports.create = async (req, res) => {
  const team = await db.transaction(async (trx) => {
    const [id] = await trx('teams').insert({
      name: req.body.name,
      created_by: req.user.id,
    });
    await trx('team_members').insert({ team_id: id, user_id: req.user.id });
    return trx('teams').where({ id }).first();
  });
  res.status(201).json(team);
};

exports.listMembers = async (req, res) => {
  res.json(
    await db('team_members as m')
      .join('users as u', 'u.id', 'm.user_id')
      .where('m.team_id', req.team.id)
      .select('u.id', 'u.name', 'u.email')
      .orderBy('u.id')
  );
};

exports.addMember = async (req, res) => {
  const email = req.body.email.toLowerCase();
  const user = await db('users').where({ email }).first();
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

  const yaEsMiembro = await db('team_members')
    .where({ team_id: req.team.id, user_id: user.id })
    .first();
  if (yaEsMiembro) {
    return res.status(409).json({ error: 'El usuario ya es miembro del equipo' });
  }

  await db('team_members').insert({ team_id: req.team.id, user_id: user.id });
  res.status(201).json({
    team_id: req.team.id,
    user: { id: user.id, name: user.name, email: user.email },
  });
};
