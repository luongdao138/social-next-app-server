const ApiError = require('../errors/ApiError');
const User = require('../models/User');

module.exports = {
  async getUserProfile(req, res) {
    const { id } = req.params;
    let user;
    let info = {};

    user = await User.findById(id);
    if (!user) {
      throw ApiError.badRequest('User not found!');
    }
    user = { ...user._doc };

    // this user is followed by login user or not
    info.is_followed = req.user.following.some((x) => x.toString() === user._id.toString());

    // this user is following login user or not
    info.is_following = req.user.followers.some((x) => x.toString() === user._id.toString());

    info.follower_count = user.followers.length;
    info.following_count = user.following.length;
    info.is_own = user._id.toString() === req.user._id.toString();

    delete user.followers;
    delete user.following;

    return res.json({ user: { ...user, ...info } });
  },
  async updateUserProfile(req, res) {
    const user_id = req.user._id;
    let user = await User.findByIdAndUpdate(user_id, req.body, { new: true });

    user = { ...user._doc };

    let info = {};
    info.is_followed = false;
    info.is_following = false;

    info.follower_count = user.followers.length;
    info.following_count = user.following.length;
    info.is_own = true;

    delete user.password;
    delete user.followers;
    delete user.following;

    return res.json({ user: { ...user, ...info }, msg: 'Update user profile successfully!' });
  },
  async followUser(req, res) {
    const { user_id, is_from_list } = req.body;
    const user = await User.findById(user_id);
    if (!user) {
      throw ApiError.badRequest('User not found!');
    }

    const isFollowed = req.user.following.some((x) => x.toString() === user_id.toString());
    if (isFollowed) {
      throw ApiError.badRequest('You already follow this user!');
    }

    await User.findByIdAndUpdate(user_id, { $push: { followers: req.user._id } });
    await User.findByIdAndUpdate(req.user._id, { $push: { following: user_id } });

    return res.json({
      user: is_from_list
        ? {
            _id: user._id,
            avatar: user.avatar,
            username: user.username,
            fullname: user.fullname,
            is_followed: true,
            is_following: !!req.user.followers.some((x) => x.toString() === user_id.toString()),
          }
        : {
            _id: req.user._id,
            avatar: req.user.avatar,
            username: req.user.username,
            fullname: req.user.fullname,
            is_followed: undefined,
            is_following: undefined,
          },
      msg: 'Follow user success',
    });
  },
  async unfollowUser(req, res) {
    const { user_id, is_from_list } = req.body;
    const user = await User.findById(user_id);
    if (!user) {
      throw ApiError.badRequest('User not found!');
    }

    const isFollowed = req.user.following.some((x) => x.toString() === user_id.toString());
    if (!isFollowed) {
      throw ApiError.badRequest('You have not followed this user!');
    }

    await User.findByIdAndUpdate(user_id, { $pull: { followers: req.user._id } });
    await User.findByIdAndUpdate(req.user._id, { $pull: { following: user_id } });

    return res.json({
      msg: 'Unfollow user success',
      user_id: !is_from_list ? req.user._id : user_id,
    });
  },
  async getUserFollowers(req, res) {
    let { items_per_page, page, user_id } = req.body;

    const limit = items_per_page ? Number(items_per_page) : 10;
    page = page ? Number(page) : 1;
    const offset = (page - 1) * limit;

    const user = await User.findById(user_id, '_id followers');
    if (!user) {
      throw ApiError.badRequest('User not found!');
    }

    let followerIds = user.followers.slice(offset, offset + limit);

    let data = [];
    for (let id of followerIds) {
      let u = await User.findById(id, '_id fullname avatar username');
      if (u._id.toString() === req.user._id.toString()) {
        data.push(u);
      } else {
        // this user is followed by login user or not
        let is_followed = !!req.user.following.some((x) => x.toString() === id.toString());

        // this user is following login user or not
        let is_following = !!req.user.followers.some((x) => x.toString() === id.toString());
        data.push({ ...u._doc, is_followed, is_following });
      }
    }

    const total_count = user.followers.length;
    const total_pages = Math.ceil(user.followers.length / limit);

    let meta = {
      current_page: page,
      per_page: limit,
      total_count,
      total_pages,
    };

    return res.json({ data, meta });
  },
  async getUserFollowing(req, res) {
    let { items_per_page, page, user_id } = req.body;

    const limit = items_per_page ? Number(items_per_page) : 10;
    page = page ? Number(page) : 1;
    const offset = (page - 1) * limit;

    const user = await User.findById(user_id, '_id following');
    if (!user) {
      throw ApiError.badRequest('User not found!');
    }

    let followingIds = user.following.slice(offset, offset + limit);

    let data = [];
    for (let id of followingIds) {
      let u = await User.findById(id, '_id fullname avatar username');
      if (u._id.toString() === req.user._id.toString()) {
        data.push(u);
      } else {
        // this user is followed by login user or not
        let is_followed = !!req.user.following.some((x) => x.toString() === id.toString());

        // this user is following login user or not
        let is_following = !!req.user.followers.some((x) => x.toString() === id.toString());
        data.push({ ...u._doc, is_followed, is_following });
      }
    }

    const total_count = user.following.length;
    const total_pages = Math.ceil(user.following.length / limit);

    let meta = {
      current_page: page,
      per_page: limit,
      total_count,
      total_pages,
    };

    return res.json({ data, meta });
  },
  async searchUsers(req, res) {
    let { items_per_page, page, keyword } = req.query;

    const limit = items_per_page ? Number(items_per_page) : 20;
    page = page ? Number(page) : 1;
    const offset = (page - 1) * limit;

    const regex = new RegExp(keyword, 'gi');

    const total_count = await User.find(
      {
        $or: [{ fullname: { $regex: regex } }, { username: { $regex: regex } }],
        _id: { $ne: req.user._id },
      },
      '_id username fullname avatar'
    ).countDocuments();
    const users = await User.find(
      {
        $or: [{ fullname: { $regex: regex } }, { username: { $regex: regex } }],
        _id: { $ne: req.user._id },
      },
      '_id username fullname avatar'
    )
      .limit(limit)
      .skip(offset);
    const total_pages = Math.ceil(total_count / limit);

    const data = users.map((u) => {
      return {
        ...u._doc,
        is_followed: !!req.user.following.some((x) => x.toString() === u._id.toString()),
      };
    });
    const meta = {
      per_page: limit,
      total_count,
      current_page: page,
      total_pages,
    };

    return res.json({ meta, data });
  },
};

// https://api.cloudinary.com/v1_1/luongdao/image/upload
