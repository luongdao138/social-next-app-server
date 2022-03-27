const authMiddleware = require('../middlewares/authMiddleware');
const router = require('express').Router();
const profileController = require('../controllers/profile.controller');

router.use(authMiddleware);

router.put('/profile/update', profileController.updateUserProfile);
router.get('/profile/:id', profileController.getUserProfile);
router.put('/follow', profileController.followUser);
router.put('/unfollow', profileController.unfollowUser);
router.post('/followers', profileController.getUserFollowers);
router.post('/following', profileController.getUserFollowing);
router.get('/search', profileController.searchUsers);

module.exports = router;
