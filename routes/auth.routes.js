const router = require('express').Router();
const authController = require('../controllers/auth.controller');

router.post('/login', authController.login);
router.post('/register', authController.register);
router.post('/refresh', authController.refresh);

module.exports = router;
