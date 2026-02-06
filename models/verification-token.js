const mongoose = require("mongoose");

const VerificationTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    username: String,
    email: String,
    password: { type: String },
    token: { type: String, required: true },
  },
  { timestamps: true }
);

const VerificationToken = mongoose.models.VerificationToken || mongoose.model("VerificationToken", VerificationTokenSchema);

module.exports = { VerificationToken };