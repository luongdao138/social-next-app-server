const { loginSchema, registerSchema } = require('../utils/validateData');
const ApiError = require('../errors/ApiError');
const {
  checkUserExist,
  createAccessToken,
  hashPassword,
  validatePassword,
  createRefreshToken,
} = require('../utils/authHelpers');
const User = require('../models/User');
const { StatusCodes } = require('http-status-codes');
const jwt = require('jsonwebtoken');

module.exports = {
  async login(req, res) {
    const { email, password } = req.body;
    const { error } = loginSchema.validate({ email, password });
    if (error) {
      throw ApiError.badRequest(error.message);
    }

    const { val, user } = await checkUserExist('email', email);
    if (!val) {
      throw ApiError.badRequest('Email or password is not correct!');
    }

    const isMatch = await validatePassword(password, user.password);
    if (!isMatch) {
      throw ApiError.badRequest('Email or password is not correct!');
    }

    const access_token = createAccessToken({ id: user._id });
    const refresh_token = createRefreshToken({ id: user._id });
    delete user._doc.password;

    return res
      .status(StatusCodes.OK)
      .json({ msg: 'Login success!', user: { ...user._doc }, access_token, refresh_token });
  },
  async register(req, res) {
    const { error } = registerSchema.validate(req.body);
    console.log(error);
    if (error) {
      throw ApiError.badRequest(error.message);
    }

    const { email, password, username, fullname, gender } = req.body;
    const { val } = await checkUserExist('email', email);
    if (val) {
      throw new Error('Email already taken!');
    }

    const { val: usernameVal } = await checkUserExist('username', username);
    if (usernameVal) {
      throw new Error('Username already taken!');
    }

    const hashedPassword = await hashPassword(password);
    let user = new User({ username, fullname, email, password: hashedPassword, gender });
    const access_token = createAccessToken({ id: user._id });
    const refresh_token = createRefreshToken({ id: user._id });

    user = await user.save();
    delete user._doc.password;

    return res
      .status(StatusCodes.CREATED)
      .json({ msg: 'Register success!', user: { ...user._doc }, access_token, refresh_token });
  },
  async refresh(req, res) {
    const { refresh_token } = req.body;

    try {
      const decoded = jwt.verify(refresh_token, process.env.REFRESH_TOKEN_KEY);
      const { id } = decoded;
      const user = await User.findById(id);
      if (!user) {
        throw new ApiError.badRequest('User not found!');
      }

      delete user._doc.password;

      const access_token = createAccessToken({ id });
      return res.json({
        msg: 'Refresh success',
        user: { ...user._doc },
        access_token,
        refresh_token,
      });
    } catch (error) {
      throw ApiError.unauthorized('Invalid refresh token');
    }
  },
};
