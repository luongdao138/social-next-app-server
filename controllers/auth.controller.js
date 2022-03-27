const { loginSchema, registerSchema } = require('../utils/validateData');
const ApiError = require('../errors/ApiError');
const {
  checkUserExist,
  createAccessToken,
  hashPassword,
  validatePassword,
  createRefreshToken,
  sendMail,
} = require('../utils/authHelpers');
const User = require('../models/User');
const { StatusCodes } = require('http-status-codes');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const UserVerificationToken = require('../models/UserVerificationToken');

module.exports = {
  async login(req, res) {
    const { email, password } = req.body;
    const { error } = loginSchema.validate({ email, password });
    if (error) {
      throw ApiError.badRequest(error.message);
    }

    const { val, user } = await checkUserExist('email', email);
    if (!val || !user.verified) {
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
    const { val, user: userEmail } = await checkUserExist('email', email);
    if (val) {
      throw ApiError.badRequest('Email already taken!');
    }

    const { val: usernameVal, user: userUsername } = await checkUserExist('username', username);
    if (usernameVal) {
      throw ApiError.badRequest('Username already taken!');
    }

    const hashedPassword = await hashPassword(password);
    let user = new User({ username, fullname, email, password: hashedPassword, gender });
    let verifyToken = crypto.randomBytes(32).toString('hex');
    const salt = await bcrypt.genSalt(10);
    const hashToken = await bcrypt.hash(verifyToken, salt);

    console.log({ verifyToken, hashToken });

    user = await user.save();
    delete user._doc.password;

    await new UserVerificationToken({
      user_id: user._id,
      token: hashToken,
      createdAt: Date.now(),
    }).save();

    // send verification email to user
    const message = {
      to: email,
      from: process.env.SENDER_EMAIL,
      subject: 'Please verify your L-Network registration email',
      text: `Let's verify your email so you can start with L-Network.`,
      html: `
                <h1 style=" margin-bottom: 20px; color: #294661; font-weight: 500 ">Let's verify your email so you can start with L-Network.</h1>

                <span style=" color: #15c; text-decoration: underline; font-weight: bold; font-size: 16px">${email}</span>

                <p style=" margin: 20px 0 ">Our link is active for 1 hour. After that, you will need to resend the verification email.</p>
                <div style="display: flex; justify-content: center;">
                <a href="${process.env.CLIENT_URL}/register/confirm?verifyToken=${verifyToken}&id=${user._id}" style="box-sizing: border-box;border-color: #348eda; font-weight: 400;text-decoration: none;display: inline-block;margin: 0; color: #ffffff;background-color: #348eda;border: solid 1px #348eda;font-size: 14px;padding: 12px 45px;" target="_blank">Verify email</a>
                </div>
       `,
    };
    try {
      await sendMail(message);
      return res
        .status(StatusCodes.CREATED)
        .json({ msg: 'Verify to complete registration!', user: { ...user._doc } });
    } catch (error) {
      throw ApiError.internalServer('Some thing went wrong, try again later!');
    }
  },
  async refresh(req, res) {
    const { refresh_token } = req.body;
    let decoded;
    try {
      decoded = jwt.verify(refresh_token, process.env.REFRESH_TOKEN_KEY);
    } catch (error) {
      throw ApiError.unauthorized('Invalid refresh token');
    }
    const { id } = decoded;
    const user = await User.findById(id);
    if (!user) {
      throw ApiError.badRequest('User not found!');
    }

    delete user._doc.password;

    const access_token = createAccessToken({ id });
    return res.json({
      msg: 'Refresh success',
      user: { ...user._doc },
      access_token,
      refresh_token,
    });
  },
  async verifyEmail(req, res) {
    const { token, user_id } = req.body;
    if (!token || !user_id) {
      throw ApiError.badRequest('User id and verification token are required!');
    }
    const userVerificationToken = await UserVerificationToken.findOne({ user_id });

    const user = await User.findById(user_id);
    if (!user) {
      throw ApiError.badRequest('Cannot find the user!');
    }

    if (user.verified) {
      throw ApiError.badRequest('Email already confirmed!');
    }

    if (!userVerificationToken) {
      throw ApiError.badRequest('Invalid or expired verification token!');
    }

    console.log('Verify', token, userVerificationToken.token);

    const isValid = await validatePassword(token, userVerificationToken.token);
    console.log('Verify result', isValid);
    if (!isValid) {
      throw ApiError.badRequest('Invalid or expired verification token!');
    }

    await User.updateOne({ _id: user_id }, { verified: true });
    await UserVerificationToken.findByIdAndDelete(userVerificationToken._id);
    res.status(200).json({ msg: 'Confirm email successfully!' });
  },
  async resendConfirmEmail(req, res) {
    const { email } = req.body;
    if (!email) {
      throw ApiError.badRequest('Email is missing!');
    }

    const user = await User.findOne({ email });

    if (!user) {
      throw ApiError.badRequest('User not found!');
    }

    if (user.verified) {
      throw ApiError.badRequest('Email already confirmed!');
    }

    const existToken = await UserVerificationToken.findOne({ user_id: user._id });
    if (existToken) {
      console.log(`Remove token with hash = ${existToken.token}`);
      await UserVerificationToken.findByIdAndDelete(existToken._id);
    }

    let verifyToken = crypto.randomBytes(32).toString('hex');
    const salt = await bcrypt.genSalt(10);
    const hashToken = await bcrypt.hash(verifyToken, salt);
    console.log({ verifyToken, hashToken });

    await new UserVerificationToken({
      user_id: user._id,
      token: hashToken,
      createdAt: Date.now(),
    }).save();

    // send verification email to user
    const message = {
      to: email,
      from: process.env.SENDER_EMAIL,
      subject: 'Please verify your L-Network registration email',
      text: `Let's verify your email so you can start with L-Network.`,
      html: `
                <h1 style=" margin-bottom: 20px; color: #294661; font-weight: 500 ">Let's verify your email so you can start with L-Network.</h1>

                <span style=" color: #15c; text-decoration: underline; font-weight: bold; font-size: 16px">${email}</span>

                <p style=" margin: 20px 0 ">Our link is active for 1 hour. After that, you will need to resend the verification email.</p>
                <div style="display: flex; justify-content: center;">
                <a href="${process.env.CLIENT_URL}/register/confirm?verifyToken=${verifyToken}&id=${user._id}" style="box-sizing: border-box;border-color: #348eda; font-weight: 400;text-decoration: none;display: inline-block;margin: 0; color: #ffffff;background-color: #348eda;border: solid 1px #348eda;font-size: 14px;padding: 12px 45px;" target="_blank">Verify email</a>
                </div>
       `,
    };
    try {
      await sendMail(message);
      return res.status(StatusCodes.OK).json({ msg: 'Resend confirmation email success!' });
    } catch (error) {
      throw ApiError.internalServer('Some thing went wrong, try again later!');
    }
  },
  async forgotPassword(req, res) {
    const { email } = req.body;
    if (!email) {
      throw ApiError.badRequest('Email missing!');
    }

    const user = await User.findOne({ email });
    if (!user || !user.verified) {
      throw ApiError.badRequest(`Can not find user with email ${email}.`);
    }

    let token = await UserVerificationToken.findOne({ user_id: user._id });
    if (token) {
      await UserVerificationToken.findOneAndDelete({ user_id: user._id });
    }

    let resetToken = crypto.randomBytes(32).toString('hex');
    const salt = await bcrypt.genSalt(10);
    const hashToken = await bcrypt.hash(resetToken, salt);

    await new UserVerificationToken({
      user_id: user._id,
      token: hashToken,
      createdAt: Date.now(),
    }).save();

    const link = `${process.env.CLIENT_URL}/forgot-password/reset?token=${resetToken}&id=${user._id}`;
    const message = {
      to: email,
      from: process.env.SENDER_EMAIL,
      subject: 'Please verify your L-Network registration email',
      text: `Reset your L-Netword password.`,
      html: `
                <h1 style=" margin-bottom: 20px; color: #294661; font-weight: 500 ">L-Network password reset.</h1>
                <p style=" margin: 20px 0 ">Seem like you forgot your password for L-Network. If this is true, click button below to reset your password. Our link is active for 1 hour</p>
                <div style="display: flex; justify-content: center;">
                <a href="${link}" style="box-sizing: border-box;border-color: #348eda; font-weight: 400;text-decoration: none;display: inline-block;margin: 0; color: #ffffff;background-color: #348eda;border: solid 1px #348eda;font-size: 14px;padding: 12px 45px;" target="_blank">Reset my password</a>  
                </div>
                <p style=" margin: 20px 0 ">If you did not forgot your password, you can safely ignore this email</p>
                <div style="display: flex; justify-content: center;">
       `,
    };
    await sendMail(message);

    return res.json({ msg: 'Check your email to reset the password!' });
  },
  async resetPassword(req, res) {
    const { token, user_id, new_password } = req.body;
    const userVerificationToken = await UserVerificationToken.findOne({ user_id });
    if (!userVerificationToken) {
      throw ApiError.badRequest('Invalid or expired password reset token!');
    }

    const isValid = validatePassword(token, userVerificationToken.token);
    if (!isValid) {
      throw ApiError.badRequest('Invalid or expired password reset token!');
    }

    const hashPw = await hashPassword(new_password);
    await User.updateOne({ _id: user_id }, { password: hashPw });

    const user = await User.findById(user_id);
    console.log(user.email);

    // send mail
    const message = {
      to: user.email,
      from: process.env.SENDER_EMAIL,
      subject: 'Reset password L-Network successfully!',
      text: `Reset password L-Network successfully!`,
      html: `
                <h1 style=" margin-bottom: 20px; color: #294661; font-weight: 500 ">You've got yourself a new password.</h1>
                <p style=" margin: 20px 0 ">The password for username ${user.username} has been successfully changed. From now on, you can use this password to login to L-Network</p>
                <div style="display: flex; justify-content: center;">
       `,
    };

    await sendMail(message);

    await UserVerificationToken.findByIdAndDelete(userVerificationToken._id);
    return res.json({ msg: 'Reset password successfully!' });
  },
};
