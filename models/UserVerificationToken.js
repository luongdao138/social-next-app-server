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
});

module.exports = model('UserVerificationToken', userVerificationTokenSchema);
