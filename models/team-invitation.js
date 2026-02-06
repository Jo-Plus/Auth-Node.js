const Joi = require("joi");
const mongoose = require("mongoose");

const teamInvitationSchema = new mongoose.Schema(
  {
    team_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      required: true,
    },
    invited_user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    invited_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
    invited_at: {
      type: Date,
      default: Date.now,
    },
    responded_at: {
      type: Date,
      default: null,
    },
    message: {
      type: String,
      maxlength: 200,
      default: null,
    },
  },
  { timestamps: true }
);

teamInvitationSchema.index(
  { team_id: 1, invited_user_id: 1, status: 1 },
  { 
    unique: true,
    partialFilterExpression: { status: "pending" }
  }
);

teamInvitationSchema.index({ invited_user_id: 1, status: 1 });
teamInvitationSchema.index({ team_id: 1, status: 1 });
teamInvitationSchema.index({ invited_at: -1 });

function validateSendInvitation(obj) {
  const schema = Joi.object({
    user_id: Joi.string().required(),
    message: Joi.string().max(200),
  });
  return schema.validate(obj);
}

const TeamInvitation = mongoose.model("TeamInvitation", teamInvitationSchema);

module.exports = {
  TeamInvitation,
  validateSendInvitation,
};