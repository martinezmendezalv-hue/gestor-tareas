// Álvaro Martínez
const router = require('express').Router();
const ctrl = require('../controllers/admin.controller');
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');

// Todo lo que cuelga de /api/admin exige sesión (auth) Y rol administrador (roles)
router.use(auth, roles('admin'));

router.get('/users', ctrl.listUsers);

module.exports = router;
