// mergeParams permite leer :teamId, que está definido en app.js
const router = require('express').Router({ mergeParams: true });
const ctrl = require('../controllers/tasks.controller');
const validate = require('../middleware/validate');
const { taskSchema } = require('../utils/schemas');

router.get('/', ctrl.list);
router.post('/', validate(taskSchema), ctrl.create);
router.put('/:taskId', validate(taskSchema), ctrl.update);
router.delete('/:taskId', ctrl.remove);

module.exports = router;
