// Álvaro Martínez
const router = require('express').Router();
const ctrl = require('../controllers/teams.controller');
const auth = require('../middleware/auth');
const teamAccess = require('../middleware/teamAccess');
const validate = require('../middleware/validate');
const { teamSchema, memberSchema } = require('../utils/schemas');

// Todas las rutas de equipos requieren sesión iniciada
router.use(auth);

router.get('/', ctrl.list);
router.post('/', validate(teamSchema), ctrl.create);

// Las rutas con :teamId pasan además por teamAccess (¿pertenece al equipo?)
router.get('/:teamId', teamAccess, ctrl.getById);
router.get('/:teamId/members', teamAccess, ctrl.listMembers);
router.post('/:teamId/members', teamAccess, validate(memberSchema), ctrl.addMember);

module.exports = router;
