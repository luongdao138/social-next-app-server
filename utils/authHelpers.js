const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = {
  async hashPassword(password) {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    return passwordHash;
  },
  async validatePassword(password, hashedPassword) {
    const isValid = await bcrypt.compare(password, hashedPassword);
    return isValid;
  },
  createAccessToken(payload) {
    const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_KEY, { expiresIn: 30 * 60 }); // 30 mins
    return accessToken;
  },
  createRefreshToken(payload) {
    const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_KEY, { expiresIn: 30 * 60 }); // 30 mins
    return refreshToken;
  },
  async checkUserExist(fieldName, value) {
    const user = await User.findOne({ [fieldName]: value });
    return { val: !!user, user };
  },
};
