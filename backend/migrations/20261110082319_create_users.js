// Álvaro Martínez
exports.up = (knex) =>
  knex.schema.createTable('users', (t) => {
    t.increments('id');
    t.string('name').notNullable();
    t.string('email').notNullable().unique();
    t.string('password_hash').notNullable();
    t.string('role').notNullable().defaultTo('miembro'); // 'admin' o 'miembro'
    t.timestamps(true, true);
  });

exports.down = (knex) => knex.schema.dropTable('users');
