const { StatusCodes } = require('http-status-codes');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  const authorization = req.headers['authorization'];
  const token = authorization?.split(' ')[1];
  if (!token) return res.status(StatusCodes.UNAUTHORIZED).json({ msg: 'Token not provided!' });

  try {
    const { id } = jwt.verify(token, process.env.ACCESS_TOKEN_KEY);
    const user = await User.findById(id);
    if (!user) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ msg: 'Invalid access token' });
    }

    delete user._doc.password;
    req.user = { ...user._doc };
    next();
  } catch (error) {
    return res.status(StatusCodes.UNAUTHORIZED).json({ msg: 'Invalid access token' });
  }
};

module.exports = authMiddleware;
