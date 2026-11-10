// Álvaro Martínez
const knex = require('knex');
const config = require('../../knexfile');
const env = require('./env');

module.exports = knex(config[env.env]);
