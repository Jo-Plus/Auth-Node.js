const Joi = require("joi");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const passwordComplexity = require("joi-password-complexity");

// user schema
const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      minlength: 3,
      maxlength: 100,
    },
    password: {
      type: String,
      required: true,
      trim: true,
      minlength: 8,
    },
    profilePhoto: {
      type: Object,
      default: {
        url: "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_640.png",
        publicId: null,
      },
    },
    bio: String,
    isAccountVerified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

// Generate Auth Token for login
userSchema.methods.generateAuthToken = function () {
  return jwt.sign(
    { id: this._id },
    process.env.JWT_SECRET,
    { expiresIn: '15d' }
  );
};

// User register Validation
function validationRegisterUser(obj) {
  const schema = Joi.object({
    username: Joi.string().trim().min(3).max(100).required(),
    email: Joi.string().trim().min(5).max(100).email().required(),
    password: passwordComplexity().required(),
  });
  return schema.validate(obj);
}

// User login Validation
function validationLoginUser(obj) {
  const schema = Joi.object({
    email: Joi.string().trim().min(5).max(100).email().required(),
    password: passwordComplexity().required(),
  });
  return schema.validate(obj);
}

// Email Validation
function validationEmail(obj) {
  const schema = Joi.object({
    email: Joi.string().trim().min(5).max(100).email().required(),
  });
  return schema.validate(obj);
}

// New Password Validation
function validationNewPassword(obj) {
  const schema = Joi.object({
    password: passwordComplexity().required(),
  });
  return schema.validate(obj);
}

// Update User Validation
function validationUpdateUser(obj) {
  const schema = Joi.object({
    username: Joi.string().trim().min(3).max(100),
    password: passwordComplexity(),
    bio: Joi.string().max(250),
  });
  return schema.validate(obj);
}

const User = mongoose.model("User", userSchema);

module.exports = {
  User,
  validationRegisterUser,
  validationLoginUser,
  validationUpdateUser,
  validationNewPassword,
  validationEmail,
};