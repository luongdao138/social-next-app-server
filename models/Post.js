const { Schema, model } = require('mongoose');

const postSchema = new Schema(
  {
    content: {
      type: String,
    },
    images: [
      {
        type: Schema.Types.ObjectId,
        ref: 'PostImage',
      },
    ],
    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    comments: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Comment',
      },
    ],
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = model('Post', postSchema);
