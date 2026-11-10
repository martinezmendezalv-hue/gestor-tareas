// Álvaro Martínez
exports.up = (knex) =>
  knex.schema.createTable('teams', (t) => {
    t.increments('id');
    t.string('name').notNullable();
    // Si se borra el creador, el equipo sigue existiendo y created_by pasa a NULL
    t.integer('created_by').references('id').inTable('users').onDelete('SET NULL');
    t.timestamps(true, true);
  });

exports.down = (knex) => knex.schema.dropTable('teams');
