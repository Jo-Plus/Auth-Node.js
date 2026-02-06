const asyncHandler = require("express-async-handler");
const { User, validationUpdateUser } = require("../models/user.js");
const { cloudinaryUploadImage, cloudinaryRemoveImage } = require("../utils/cloudnary.js");
const bcrypt = require("bcryptjs");
const path = require("node:path");
const fs = require("node:fs");

// @desc    Get User Profile
module.exports.getUserProfileCtrl = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select("-password");
  if (!user) return res.status(404).json({ message: "user not found" });
  res.status(200).json(user);
});

// @desc    Update User Profile
module.exports.updateUserProfileCtrl = asyncHandler(async (req, res) => {
  const { error } = validationUpdateUser(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  if (req.body.password) {
    const salt = await bcrypt.genSalt(10);
    req.body.password = await bcrypt.hash(req.body.password, salt);
  }

  const updateUser = await User.findByIdAndUpdate(
    req.params.id,
    {
      $set: {
        username: req.body.username,
        password: req.body.password,
        bio: req.body.bio,
      },
    },
    { new: true }
  ).select("-password");

  res.status(200).json(updateUser);
});

// @desc    Upload Profile Photo
module.exports.profilePhotoUploadCtrl = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "no file provided" });

  const imagePath = path.join(__dirname, `../images/${req.file.filename}`);
  try {
    const result = await cloudinaryUploadImage(imagePath);
    const user = await User.findById(req.user.id);

    if (user.profilePhoto.publicId !== null) {
      await cloudinaryRemoveImage(user.profilePhoto.publicId);
    }

    user.profilePhoto = { url: result.secure_url, publicId: result.public_id };
    await user.save();

    res.status(200).json({
      message: "profile photo uploaded successfully",
      profilePhoto: user.profilePhoto,
    });
  } finally {
    if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
  }
});

// @desc    Delete User Profile
module.exports.deleteUserProfileCtrl = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: "user not found" });

  if (user.profilePhoto.publicId !== null) {
    await cloudinaryRemoveImage(user.profilePhoto.publicId);
  }

  await User.findByIdAndDelete(req.params.id);
  res.status(200).json({ message: "your profile has been deleted" });
});

// @desc    Get Users Count
module.exports.getUsersCountCtrl = asyncHandler(async (req, res) => {
  const count = await User.countDocuments();
  res.status(200).json(count);
});