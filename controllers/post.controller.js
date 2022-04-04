const Post = require('../models/Post');

module.exports = {
  async createPost(req, res) {
    let { content, images } = req.body;
    if (!Array.isArray(images)) {
      images = [images];
    }
    let imagesId = images.map((image) => image._id);
    let newPost = new Post({ content, images: imagesId, user: req.user._id });
    newPost = await newPost.save();

    return res.json({
      msg: 'Create post success',
      post: { ...newPost._doc, images },
    });
  },
};
