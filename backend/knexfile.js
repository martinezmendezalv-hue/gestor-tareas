// Álvaro Martínez
const base = {
  client: 'better-sqlite3',
  useNullAsDefault: true,
  migrations: { directory: './migrations' },
  seeds: { directory: './seeds' },
  pool: {
    // SQLite no activa las claves foráneas por defecto: hay que pedirlo
    afterCreate: (conn, done) => {
      conn.pragma('foreign_keys = ON');
      done();
    },
  },
};

module.exports = {
  development: { ...base, connection: { filename: './dev.sqlite3' } },
  test: { ...base, connection: { filename: './test.sqlite3' } },
  production: { ...base, connection: { filename: './prod.sqlite3' } },
};
