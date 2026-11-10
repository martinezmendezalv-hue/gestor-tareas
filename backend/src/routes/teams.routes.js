const router = require('express').Router();
const ctrl = require('../controllers/teams.controller');
const validate = require('../middleware/validate');
const { teamSchema } = require('../utils/schemas');

router.get('/', ctrl.list);
router.get('/:id', ctrl.getById);
router.post('/', validate(teamSchema), ctrl.create);

module.exports = router;
