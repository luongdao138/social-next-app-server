const authMiddleware = require('../middlewares/authMiddleware');
const router = require('express').Router();

router.use(authMiddleware);

router.get('/private', (req, res) => {
  return res.json({ msg: 'Private resources!' });
});

module.exports = router;
