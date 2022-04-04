const router = require('express').Router();
const postController = require('../controllers/post.controller');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

router.post('/', postController.createPost);

module.exports = router;
