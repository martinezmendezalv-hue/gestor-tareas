// Álvaro Martínez
const bcrypt = require('bcrypt');

const ROUNDS = 10; // coste del cifrado: más rondas = más seguro y más lento

exports.hashPassword = (plain) => bcrypt.hash(plain, ROUNDS);

exports.comparePassword = (plain, hash) => bcrypt.compare(plain, hash);
