// Álvaro Martínez
exports.up = (knex) =>
  knex.schema.createTable('team_members', (t) => {
    t.increments('id');
    t.integer('team_id').notNullable()
      .references('id').inTable('teams').onDelete('CASCADE');
    t.integer('user_id').notNullable()
      .references('id').inTable('users').onDelete('CASCADE');
    t.unique(['team_id', 'user_id']); // evita duplicados
  });

exports.down = (knex) => knex.schema.dropTable('team_members');
