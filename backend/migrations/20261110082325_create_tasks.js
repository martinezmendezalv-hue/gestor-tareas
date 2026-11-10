// Álvaro Martínez
exports.up = (knex) =>
  knex.schema.createTable('tasks', (t) => {
    t.increments('id');
    t.string('title').notNullable();
    t.text('description').defaultTo('');
    t.string('status').notNullable().defaultTo('pendiente'); // pendiente | en_curso | hecha
    t.integer('team_id').notNullable()
      .references('id').inTable('teams').onDelete('CASCADE');
    t.integer('assigned_to')
      .references('id').inTable('users').onDelete('SET NULL');
    t.timestamps(true, true);
  });

exports.down = (knex) => knex.schema.dropTable('tasks');
