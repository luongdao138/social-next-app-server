const PostImage = require('../models/PostImage');

module.exports = {
  async createImages(req, res) {
    let { images } = req.body;
    if (!Array.isArray(images)) {
      images = [images];
    }
    images = images.map((image) => ({ ...image, user: req.user._id }));

    images = await PostImage.insertMany(images);
    images = images.map((image) => ({
      _id: image._id,
      url: image.url,
      public_id: image.public_id,
      description: image.description,
    }));

    return res.json({ images, msg: 'Images created!' });
  },
};
