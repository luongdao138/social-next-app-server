const { Schema, model } = require('mongoose');

const postImageSchema = new Schema(
  {
    description: String,
    url: { type: String, required: true },
    public_id: { type: String },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = model('PostImage', postImageSchema);
