const asyncHandler = require("express-async-handler");
const bcrypt = require("bcryptjs");
const { User, validationNewPassword, validationEmail } = require("../models/user");
const { VerificationToken } = require("../models/verification-token.js");
const crypto = require("crypto");
const sendEmail = require("../utils/send-email.js");
const EmailTemplate = require("../utils/email-template.js");

module.exports.sendResetPasswordLinkCtrl = asyncHandler(async (req, res) => {
  const { error } = validationEmail(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  const user = await User.findOne({ email: req.body.email });
  if (!user) return res.status(404).json({ message: "User not found!" });

  let verificationToken = await VerificationToken.findOne({ userId: user._id });
  if (!verificationToken) {
    verificationToken = new VerificationToken({
      userId: user._id,
      token: crypto.randomBytes(32).toString("hex"),
    });
    await verificationToken.save();
  }

  const link = `${process.env.CLIENT_DOMAIN}/reset-password/${user._id}/${verificationToken.token}`;

  await sendEmail(user.email, "Reset Password", EmailTemplate(link));
  res.status(200).json({ message: "Password reset link sent to your email" });
});

module.exports.getResetPasswordLinkCtrl = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.userId);
  const verificationToken = await VerificationToken.findOne({
    userId: req.params.userId,
    token: req.params.token,
  });

  if (!user || !verificationToken) {
    return res.status(400).json({ message: "Invalid or expired link" });
  }
  res.status(200).json({ message: "Valid url" });
});

module.exports.resetPasswordCtrl = asyncHandler(async (req, res) => {
  const { error } = validationNewPassword(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  const user = await User.findById(req.params.userId);
  const verificationToken = await VerificationToken.findOne({
    userId: req.params.userId,
    token: req.params.token,
  });

  if (!user || !verificationToken) {
    return res.status(400).json({ message: "Invalid or expired link" });
  }

  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(req.body.password, salt);
  if (!user.isAccountVerified) user.isAccountVerified = true;

  await user.save();
  await VerificationToken.deleteOne({ _id: verificationToken._id });

  res.status(200).json({ message: "Password reset successfully" });
});