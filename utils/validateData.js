const joi = require('joi');

const loginSchema = joi.object({
  email: joi
    .string()
    .email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } })
    .required(),
  password: joi.string().min(6).max(30).required(),
});

const registerSchema = joi.object({
  email: joi
    .string()
    .email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } })
    .required(),
  password: joi.string().min(6).max(30).required(),
  username: joi.string().max(25).required(),
  fullname: joi.string().max(25).required(),
  gender: joi.string().required(),
});

module.exports = {
  loginSchema,
  registerSchema,
};
