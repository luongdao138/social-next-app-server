const { Schema, model } = require('mongoose');

const userSchema = new Schema({
  username: {
    type: String,
    required: true,
    trim: true,
    maxlength: 25,
  },
  fullname: {
    type: String,
    required: true,
    trim: true,
    maxlength: 25,
  },
  email: {
    type: String,
    required: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  avatar: {
    type: String,
    default:
      'https://res.cloudinary.com/devatchannel/image/upload/v1602752402/avatar/avatar_cugq40.png',
  },
  role: {
    type: String,
    default: 'user',
    enum: ['user', 'admin'],
  },
  address: {
    type: String,
    default: '',
  },
  mobile: {
    type: String,
    default: '',
  },
  gender: {
    type: String,
    default: 'male',
    enum: ['male', 'female', 'other'],
  },
  website: {
    type: String,
    default: '',
  },
  story: {
    type: String,
    maxlength: 250,
    default: '',
  },
  followers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  following: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  verified: {
    type: Boolean,
    default: false,
  },
});

module.exports = model('User', userSchema);
