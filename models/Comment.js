const { Schema, model } = require('mongoose');

const commentSchema = new Schema(
  {
    user: {
      ref: 'User',
    },
    images: [{ type: String }],
  },
  {
    timestamps: true,
  }
);

module.exports = model('Comment', commentSchema);
