// Álvaro Martínez
// mergeParams permite leer :teamId, que está definido en app.js
const router = require('express').Router({ mergeParams: true });
const ctrl = require('../controllers/tasks.controller');
const auth = require('../middleware/auth');
const teamAccess = require('../middleware/teamAccess');
const validate = require('../middleware/validate');
const { taskSchema } = require('../utils/schemas');

// Todas las rutas de tareas exigen sesión y pertenencia al equipo (o ser admin)
router.use(auth, teamAccess);

router.get('/', ctrl.list);
router.post('/', validate(taskSchema), ctrl.create);
router.put('/:taskId', validate(taskSchema), ctrl.update);
router.patch('/:taskId/complete', ctrl.complete);
router.delete('/:taskId', ctrl.remove);

module.exports = router;
