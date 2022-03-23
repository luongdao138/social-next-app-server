const { loginSchema, registerSchema } = require('../utils/validateData');
const ApiError = require('../errors/ApiError');
const {
  checkUserExist,
  createAccessToken,
  hashPassword,
  validatePassword,
  createRefreshToken,
  createVerifyToken,
  sendMail,
} = require('../utils/authHelpers');
const User = require('../models/User');
const { StatusCodes } = require('http-status-codes');
const jwt = require('jsonwebtoken');
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
      if (userEmail.verified) {
        throw ApiError.badRequest('Email already taken!');
      } else {
        const usertoken = await UserVerificationToken.findOne({ user_id: userEmail._id });
        if (usertoken) {
          let decoded;
          try {
            decoded = jwt.verify(usertoken.token, process.env.VERIFICATION_TOKEN_KEY);
          } catch (error) {
            await UserVerificationToken.findByIdAndDelete(usertoken._id);
            await User.findByIdAndDelete(userEmail._id);
          }

          if (decoded) {
            throw ApiError.badRequest('Email already taken!');
          }
        } else {
          await User.findByIdAndDelete(userEmail._id);
        }
      }
    }

    const { val: usernameVal, user: userUsername } = await checkUserExist('username', username);
    if (usernameVal) {
      if (userUsername.verified) {
        throw ApiError.badRequest('Username already taken!');
      } else {
        const usertoken = await UserVerificationToken.findOne({ user_id: userUsername._id });
        if (usertoken) {
          let decoded;
          try {
            decoded = jwt.verify(usertoken.token, process.env.VERIFICATION_TOKEN_KEY);
          } catch (error) {
            await UserVerificationToken.findByIdAndDelete(usertoken._id);
            await User.findByIdAndDelete(userUsername._id);
          }
          if (decoded) {
            throw ApiError.badRequest('Username already taken!');
          }
        } else {
          await User.findByIdAndDelete(userUsername._id);
        }
      }
    }

    const hashedPassword = await hashPassword(password);
    let user = new User({ username, fullname, email, password: hashedPassword, gender });
    // const access_token = createAccessToken({ id: user._id });
    // const refresh_token = createRefreshToken({ id: user._id });

    const verifyToken = createVerifyToken({ id: user._id });
    let userVerificationToken = new UserVerificationToken({
      user_id: user._id,
      token: verifyToken,
    });

    user = await user.save();
    await userVerificationToken.save();
    delete user._doc.password;

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
                <a href="${process.env.CLIENT_URL}/register/confirm?verifyToken=${verifyToken}" style="box-sizing: border-box;border-color: #348eda; font-weight: 400;text-decoration: none;display: inline-block;margin: 0; color: #ffffff;background-color: #348eda;border: solid 1px #348eda;font-size: 14px;padding: 12px 45px;" target="_blank">Verify email</a>
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
    const { token } = req.body;
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.VERIFICATION_TOKEN_KEY);
    } catch (error) {
      await UserVerificationToken.findOneAndDelete({ token });
      throw ApiError.badRequest('Token invalid');
    }
    const { id } = decoded;
    const user = await User.findById(id);
    if (!user) {
      await UserVerificationToken.findOneAndDelete({ token });
      throw ApiError.badRequest('Cannot find the user!');
    }

    if (user.verified) {
      await UserVerificationToken.findOneAndDelete({ token });
      throw ApiError.badRequest('Email already confirmed!');
    }

    const userVerificationToken = await UserVerificationToken.findOne({
      user_id: user._id,
      token,
    });
    if (!userVerificationToken) {
      if (user.verified) {
        throw ApiError.badRequest('Email already confirmed!');
      }
      throw ApiError.badRequest('Token not found!');
    }

    await User.updateOne({ _id: user._id }, { verified: true });
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

    const verifyToken = createVerifyToken({ id: user._id });
    let userVerificationToken = new UserVerificationToken({
      user_id: user._id,
      token: verifyToken,
    });

    await userVerificationToken.save();
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
                <a href="${process.env.CLIENT_URL}/register/confirm?verifyToken=${verifyToken}" style="box-sizing: border-box;border-color: #348eda; font-weight: 400;text-decoration: none;display: inline-block;margin: 0; color: #ffffff;background-color: #348eda;border: solid 1px #348eda;font-size: 14px;padding: 12px 45px;" target="_blank">Verify email</a>
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
};
