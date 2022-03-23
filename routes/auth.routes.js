const router = require('express').Router();
const authController = require('../controllers/auth.controller');

router.post('/login', authController.login);
router.post('/register', authController.register);
router.post('/refresh', authController.refresh);
router.post('/verify', authController.verifyEmail);
router.post('/resendVerify', authController.resendConfirmEmail);

module.exports = router;
