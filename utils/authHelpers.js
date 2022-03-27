const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENGRID_API_KEY);

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
    const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_KEY, {
      expiresIn: '1d',
    }); // 1 day
    return refreshToken;
  },
  createVerifyToken(payload) {
    const verifyToken = jwt.sign(payload, process.env.VERIFICATION_TOKEN_KEY, {
      expiresIn: 60 * 60,
    }); // 60 mins
    return verifyToken;
  },
  async checkUserExist(fieldName, value) {
    const user = await User.findOne({ [fieldName]: value });
    return { val: !!user, user };
  },
  // {to, from, subject, text, html }
  async sendMail(message) {
    return sgMail.send(message);
  },
};
