const { Schema, model } = require('mongoose');

const userVerificationTokenSchema = new Schema({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  token: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 60 * 60,
  },
});

module.exports = model('UserVerificationToken', userVerificationTokenSchema);
