const joi = require("@hapi/joi");

const validateSignUp = (data) => {
  const schema = joi.object({
    name: joi.string().required(),
    username: joi.string().required(),
    email: joi.string().email().required(),
    bio: joi.string(),
    password: joi.string().min(6).required(),
  });
  return schema.validate(data);
};

const validateLogin = (data) => {
  const schema = joi.object({
    email: joi.string().email().required(),
    password: joi.string().min(6).required(),
  });
  return schema.validate(data);
};
const validateChallenge = (data) => {
  const schema = joi.object({
    name: joi.string().required(),
    createdBy: joi.string().required(),
    duration: joi.number().required(),
    ends: joi.string(),
    description: joi.string(),
    tag: joi.array(),
    visibility: joi.boolean(),
  });
  return schema.validate(data);
};
module.exports = {
  validateSignUp,
  validateLogin,
  validateChallenge,
};
