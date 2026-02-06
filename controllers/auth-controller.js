const asyncHandler = require("express-async-handler");
const bcrypt = require("bcryptjs");
const {
  User,
  validationRegisterUser,
  validationLoginUser,
} = require("../models/user.js");
const { VerificationToken } = require("../models/verification-token.js");
const EmailTemplate = require("../utils/email-template.js");
const crypto = require("crypto");
const sendEmail = require("../utils/send-email.js");

// @desc    Register New User (Store data temporarily)
module.exports.registerUserCtrl = asyncHandler(async (req, res) => {
  const { error } = validationRegisterUser(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  const userExist = await User.findOne({ email: req.body.email });
  if (userExist) return res.status(400).json({ message: "user already exist" });

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(req.body.password, salt);

  await VerificationToken.findOneAndDelete({ email: req.body.email });

  const verificationToken = new VerificationToken({
    username: req.body.username,
    email: req.body.email,
    password: hashedPassword,
    token: crypto.randomBytes(32).toString("hex"),
  });
  await verificationToken.save();

  const link = `${process.env.BACKEND_DOMAIN}/api/auth/verify/${verificationToken.token}`;
  await sendEmail(req.body.email, "Verify Your Email", EmailTemplate(link));

  res
    .status(201)
    .json({ message: "We sent an email, please verify your address" });
});

// @desc    Login User
module.exports.loginUserCtrl = asyncHandler(async (req, res) => {
  const { error } = validationLoginUser(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  const user = await User.findOne({ email: req.body.email });
  if (!user)
    return res.status(400).json({ message: "Invalid email or password" });

  const isPasswordMatch = await bcrypt.compare(
    req.body.password,
    user.password,
  );
  if (!isPasswordMatch)
    return res.status(400).json({ message: "Invalid email or password" });

  const token = user.generateAuthToken();

  res.status(200).json({
    _id: user._id,
    username: user.username,
    profilePhoto: user.profilePhoto,
    token,
  });
});

// @desc    Verify User Account (Move data to User Collection)
module.exports.verifyUserAccountCtrl = asyncHandler(async (req, res) => {
  const verificationToken = await VerificationToken.findOne({
    token: req.params.token,
  });
  if (!verificationToken)
    return res.status(400).send("Invalid or expired link");

  const user = new User({
    username: verificationToken.username,
    email: verificationToken.email,
    password: verificationToken.password,
    isAccountVerified: true,
  });
  await user.save();

  await VerificationToken.deleteOne({ _id: verificationToken._id });

  res.send(`
        <div style="text-align: center; margin-top: 50px; font-family: sans-serif;">
            <h2 style="color: #4F46E5;">Your account has been verified successfully ✅</h2>
            <p>You can now close this tab and log in.</p>
        </div>
    `);
});
