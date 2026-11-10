// Álvaro Martínez
// mergeParams permite leer :teamId, que está definido en app.js
const router = require('express').Router({ mergeParams: true });
const ctrl = require('../controllers/stats.controller');
const auth = require('../middleware/auth');
const teamAccess = require('../middleware/teamAccess');

router.get('/', auth, teamAccess, ctrl.byStatus);

module.exports = router;
