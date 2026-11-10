// Álvaro Martínez
const router = require('express').Router();
const ctrl = require('../controllers/auth.controller');
const validate = require('../middleware/validate');
const auth = require('../middleware/auth');
const { loginLimiter } = require('../middleware/rateLimit');
const { registerSchema, loginSchema } = require('../utils/schemas');

router.post('/register', validate(registerSchema), ctrl.register);
router.post('/login', loginLimiter, validate(loginSchema), ctrl.login);
router.get('/me', auth, ctrl.me);

module.exports = router;
