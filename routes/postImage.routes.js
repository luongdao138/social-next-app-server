const router = require('express').Router();
const postImageController = require('../controllers/postImage.controller');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

router.post('/', postImageController.createImages);

module.exports = router;
