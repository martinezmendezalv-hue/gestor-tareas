// Álvaro Martínez
const { hashPassword } = require('../src/utils/password');

exports.seed = async (knex) => {
  // Se borra en orden inverso a las dependencias (primero lo que apunta a otras tablas)
  await knex('tasks').del();
  await knex('team_members').del();
  await knex('teams').del();
  await knex('users').del();

  // Reinicia los contadores de id para que el seed deje siempre los mismos ids
  await knex.raw("DELETE FROM sqlite_sequence WHERE name IN ('tasks', 'team_members', 'teams', 'users')");

  const hash = await hashPassword('Password123');

  await knex('users').insert([
    { id: 1, name: 'Admin', email: 'admin@demo.com', password_hash: hash, role: 'admin' },
    { id: 2, name: 'Ana', email: 'ana@demo.com', password_hash: hash, role: 'miembro' },
    { id: 3, name: 'Luis', email: 'luis@demo.com', password_hash: hash, role: 'miembro' },
  ]);

  await knex('teams').insert([
    { id: 1, name: 'Equipo Alfa', created_by: 2 },
    { id: 2, name: 'Equipo Beta', created_by: 3 },
  ]);

  await knex('team_members').insert([
    { team_id: 1, user_id: 2 },
    { team_id: 1, user_id: 3 },
    { team_id: 2, user_id: 3 },
  ]);

  await knex('tasks').insert([
    { title: 'Diseñar logo', description: 'Primera propuesta', status: 'pendiente', team_id: 1, assigned_to: 2 },
    { title: 'Preparar demo', description: 'Guion de 10 minutos', status: 'en_curso', team_id: 1, assigned_to: 3 },
    { title: 'Escribir memoria', description: 'Capítulo 1', status: 'hecha', team_id: 1, assigned_to: 2 },
    { title: 'Configurar repositorio', description: '', status: 'hecha', team_id: 1, assigned_to: 3 },
    { title: 'Revisar API', description: '', status: 'pendiente', team_id: 2, assigned_to: 3 },
    { title: 'Probar despliegue', description: '', status: 'en_curso', team_id: 2, assigned_to: 3 },
  ]);
};
